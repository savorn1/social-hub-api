import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { ResourceNotFoundException } from '../common/exceptions/business.exception';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepo: Repository<Permission>,
  ) {}

  async create(dto: CreatePermissionDto): Promise<Permission> {
    return this.permissionsRepo.save(this.permissionsRepo.create(dto));
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionsRepo.find();
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionsRepo.findOne({ where: { id } });
    if (!permission) throw new ResourceNotFoundException('Permission');
    return permission;
  }

  async remove(id: string): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionsRepo.remove(permission);
  }
}
