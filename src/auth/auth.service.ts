import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
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
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await comparePassword(password, user.password))) return user;
    return null;
  }

  async login(user: User) {
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return { user, ...tokens };
  }

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return this.login(user);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findOne(userId);
    if (!user?.refreshToken || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Access denied');
    }
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
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
