import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SafeUser } from '../types/safeUser.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
    });
  }

  async validate(payload: { id: number }): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (!user) throw new UnauthorizedException();
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
