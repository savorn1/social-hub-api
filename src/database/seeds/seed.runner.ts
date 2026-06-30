import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { hashPassword } from '../../common/utils/hash.util';
import {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  SEED_USERS,
  USER_ROLES,
} from './data';

export async function runSeed(dataSource: DataSource): Promise<void> {
  const permRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);

  // 1. Permissions
  console.log('\nSeeding permissions...');
  const permMap = new Map<string, Permission>();
  for (const p of PERMISSIONS) {
    let perm = await permRepo.findOne({ where: { name: p.name } });
    if (!perm) {
      perm = permRepo.create(p);
      await permRepo.save(perm);
      console.log(`  + ${p.name}`);
    }
    permMap.set(p.name, perm);
  }

  // 2. Roles + role_permissions
  console.log('\nSeeding roles and role_permissions...');
  const roleMap = new Map<string, Role>();
  for (const r of ROLES) {
    let role = await roleRepo.findOne({
      where: { name: r.name },
      relations: ['permissions'],
    });
    if (!role) {
      role = roleRepo.create({ name: r.name, code: r.code, description: r.description, isDefault: r.isDefault });
      console.log(`  + role: ${r.name}`);
    }
    const permNames = ROLE_PERMISSIONS[r.name] ?? [];
    role.permissions = permNames.map((n) => permMap.get(n)!).filter(Boolean);
    await roleRepo.save(role);
    console.log(`    permissions assigned: ${role.permissions.length}`);
    roleMap.set(r.name, role);
  }

  // 3. Users + user_roles
  console.log('\nSeeding users and user_roles...');
  for (const u of SEED_USERS) {
    let user = await userRepo.findOne({
      where: { email: u.email },
      relations: ['roles'],
    });
    if (!user) {
      user = userRepo.create({
        email: u.email,
        password: await hashPassword(u.password),
        firstName: u.firstName,
        lastName: u.lastName,
        status: u.status,
      });
    }
    const roleNames = USER_ROLES[u.email] ?? [];
    const newRoles = roleNames.map((n) => roleMap.get(n)!).filter(Boolean);
    const existingIds = new Set(user.roles?.map((r) => r.id));
    user.roles = [
      ...(user.roles ?? []),
      ...newRoles.filter((r) => !existingIds.has(r.id)),
    ];
    await userRepo.save(user);
    console.log(`  + ${u.email} → [${roleNames.join(', ')}]`);
  }

  console.log('\nSeed complete.\n');
  console.log('Default credentials (all passwords: Admin@1234):');
  for (const u of SEED_USERS) {
    const roles = USER_ROLES[u.email]?.join(', ') ?? '—';
    console.log(`  ${u.email.padEnd(30)} → ${roles}`);
  }
}
