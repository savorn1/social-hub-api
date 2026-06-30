import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { AbstractEntity } from '../../common/entities/base.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('permissions')
export class Permission extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  module: string;

  @Column()
  resource: string;

  @Column()
  action: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
