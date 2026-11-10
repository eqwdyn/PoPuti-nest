import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, genSalt, hash } from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AccountService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { login: dto.login },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid login or password');
    }

    const isValidPassword = await compare(dto.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid login or password');
    }

    return { id: user.id, login: user.login };
  }

  async createUser(dto: CreateUserDto) {
    const candidate = await this.prisma.user.findFirst({
      where: { login: dto.login },
    });

    if (candidate) {
      throw new ConflictException('Login is already taken');
    }

    const hashedPass = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPass,
      },
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }

  generateAccessToken(payload: { id: number; login: string }) {
    return this.jwtService.sign(payload);
  }

  generateRefreshToken(payload: { id: number }) {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }

  async verifyRefreshToken(
    refreshToken: string,
  ): Promise<{ id: number; login: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findFirst({
        where: { id: payload.id },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return { id: user.id, login: user.login };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async hashPassword(password: string) {
    const salt = await genSalt(10);
    return hash(password, salt);
  }
}
