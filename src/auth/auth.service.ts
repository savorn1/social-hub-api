import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { comparePassword } from '../common/utils/hash.util';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from '../common/interfaces/api-response.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await comparePassword(password, user.password))) return user;
    return null;
  }

  async login(user: User) {
    const permissions =
      user.roles?.flatMap((r) => r.permissions?.map((p) => p.name) ?? []) ?? [];

    const tokens = await this.generateTokens(user);
    await Promise.all([
      this.redisService.setRefreshToken(user.id, tokens.refreshToken),
      this.redisService.setPermissions(user.id, permissions),
    ]);
    return { ...tokens, user };
  }

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return this.login(user);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const stored = await this.redisService.getRefreshToken(userId);
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException('Access denied');
    }
    const user = await this.usersService.findOne(userId);
    const tokens = await this.generateTokens(user);
    await this.redisService.setRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await Promise.all([
      this.redisService.deleteRefreshToken(userId),
      this.redisService.deletePermissions(userId),
    ]);
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map((r) => r.name) ?? [],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as unknown as Record<string, unknown>),
      this.jwtService.signAsync(payload as unknown as Record<string, unknown>, {
        secret: this.configService.get<string>('jwt.refreshSecret') as string,
        expiresIn: '30d' as const,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
