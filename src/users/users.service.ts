import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPassword } from '../common/utils/hash.util';
import { ResourceNotFoundException } from '../common/exceptions/business.exception';
import { getPaginationParams, paginate } from '../common/utils/pagination.util';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.usersRepo.create({
      ...dto,
      password: await hashPassword(dto.password),
    });
    return this.usersRepo.save(user);
  }

  async findAll(page = 1, limit = 20): Promise<PaginatedResult<User>> {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await this.usersRepo.findAndCount({ skip, take });
    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new ResourceNotFoundException('User');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.usersRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepo.remove(user);
  }

  async assignRoles(id: string, roleIds: string[]): Promise<User> {
    const user = await this.findOne(id);
    user.roles = roleIds.length
      ? await this.rolesRepo.findBy({ id: In(roleIds) })
      : [];
    return this.usersRepo.save(user);
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.usersRepo.update(id, {
      refreshToken: refreshToken ?? undefined,
    });
  }
}
