import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';

import appConfig from '../../config/app.config';
import databaseConfig from '../../config/database.config';
import jwtConfig from '../../config/jwt.config';
import redisConfig from '../../config/redis.config';
import integrationsConfig from '../../config/integrations.config';

import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { hashPassword } from '../../common/utils/hash.util';
import { Status } from '../../common/enums/status.enum';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        integrationsConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get<number>('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        entities: [User, Role, Permission],
        synchronize: false,
      }),
    }),
  ],
})
class SeedModule {}

const ROLES = [
  { name: 'super_admin', description: 'Full system access' },
  { name: 'admin', description: 'Administrative access' },
  { name: 'manager', description: 'Manager-level access' },
  { name: 'agent', description: 'Agent-level access' },
  { name: 'viewer', description: 'Read-only access' },
];

const SEED_USER = {
  email: 'admin@socialhub.com',
  password: 'Admin@1234',
  firstName: 'Super',
  lastName: 'Admin',
};

async function seed() {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error'],
  });
  const dataSource = app.get(DataSource);

  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);

  console.log('Seeding roles...');
  const roles: Role[] = [];
  for (const roleData of ROLES) {
    let role = await roleRepo.findOne({ where: { name: roleData.name } });
    if (!role) {
      role = roleRepo.create({
        name: roleData.name,
        description: roleData.description,
      });
      await roleRepo.save(role);
      console.log(`  Created role: ${role.name}`);
    } else {
      console.log(`  Role already exists: ${role.name}`);
    }
    roles.push(role);
  }

  const superAdminRole = roles.find((r) => r.name === 'super_admin')!;

  console.log('Seeding super admin user...');
  let user = await userRepo.findOne({ where: { email: SEED_USER.email } });
  if (!user) {
    const hashed = await hashPassword(SEED_USER.password);
    user = userRepo.create({
      email: SEED_USER.email,
      password: hashed,
      firstName: SEED_USER.firstName,
      lastName: SEED_USER.lastName,
      status: Status.ACTIVE,
      roles: [superAdminRole],
    });
    await userRepo.save(user);
    console.log(
      `  Created user: ${user.email} (password: ${SEED_USER.password})`,
    );
  } else {
    console.log(`  User already exists: ${user.email}`);
  }

  await app.close();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
