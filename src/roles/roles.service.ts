import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Permission } from '../permissions/entities/permission.entity';
import { ResourceNotFoundException } from '../common/exceptions/business.exception';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepo: Repository<Permission>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const role = this.rolesRepo.create({
      name: dto.name,
      description: dto.description,
    });
    if (dto.permissionIds?.length) {
      role.permissions = await this.permissionsRepo.findBy({
        id: In(dto.permissionIds),
      });
    }
    return this.rolesRepo.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.rolesRepo.find({ relations: ['permissions'] });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) throw new ResourceNotFoundException('Role');
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    Object.assign(role, { name: dto.name, description: dto.description });
    if (dto.permissionIds !== undefined) {
      role.permissions = await this.permissionsRepo.findBy({
        id: In(dto.permissionIds),
      });
    }
    return this.rolesRepo.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this.rolesRepo.remove(role);
  }
}
