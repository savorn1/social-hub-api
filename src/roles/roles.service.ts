import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Permission } from '../permissions/entities/permission.entity';
import {
  BusinessException,
  ResourceNotFoundException,
} from '../common/exceptions/business.exception';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepo: Repository<Permission>,
  ) {}

  private toCode(name: string): string {
    return name
      .trim()
      .replace(/[^a-z0-9]+/gi, '_')
      .toUpperCase();
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const exists = await this.rolesRepo.findOne({ where: { name: dto.name } });
    if (exists) {
      throw new BusinessException(
        'Role name already exists',
        HttpStatus.CONFLICT,
      );
    }
    const role = this.rolesRepo.create({
      name: dto.name,
      code: this.toCode(dto.name),
      description: dto.description,
      isDefault: dto.isDefault ?? false,
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
    if (dto.name !== undefined && dto.name !== role.name) {
      const exists = await this.rolesRepo.findOne({
        where: { name: dto.name },
      });
      if (exists) {
        throw new BusinessException(
          'Role name already exists',
          HttpStatus.CONFLICT,
        );
      }
    }
    if (dto.name !== undefined) {
      role.name = dto.name;
      role.code = this.toCode(dto.name);
    }
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.isDefault !== undefined) role.isDefault = dto.isDefault;
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
