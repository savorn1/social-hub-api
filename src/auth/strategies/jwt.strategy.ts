import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { RedisService } from '../../redis/redis.service';
import { JwtPayload } from '../../common/interfaces/api-response.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('jwt.secret') as string,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) throw new UnauthorizedException();

    const cached = await this.redisService.getPermissions(payload.sub);
    const permissions =
      cached ??
      user.roles?.flatMap((r) => r.permissions?.map((p) => p.name) ?? []) ??
      [];

    return {
      ...user,
      roles: user.roles?.map((r) => r.name) ?? [],
      permissions,
    };
  }
}
