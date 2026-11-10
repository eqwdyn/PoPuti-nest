import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountService } from './account.service.js';
import { Authorization } from '../../../shared/decorators/auth.decorator.js';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Authorized } from '../../../shared/decorators/authorized.decorator.js';
import { type SafeUser } from '../../../shared/types/safeUser.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import type { Request, Response } from 'express';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Логин' })
  @ApiResponse({ status: 200, description: 'Авторизация прошла успешно' })
  async login(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = await this.accountService.validateUser(dto);
    const accessToken = this.accountService.generateAccessToken(payload);
    const refreshToken = this.accountService.generateRefreshToken({
      id: payload.id,
    });

    this.setRefreshTokenToCookies(res, refreshToken);

    return { accessToken };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Регистрация' })
  @ApiResponse({ status: 201, description: 'Регистрация прошла успешно' })
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('Register');

    const payload = await this.accountService.createUser(dto);
    const accessToken = this.accountService.generateAccessToken(payload);
    const refreshToken = this.accountService.generateRefreshToken({
      id: payload.id,
    });

    this.setRefreshTokenToCookies(res, refreshToken);

    return { accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Обновление токена' })
  @ApiResponse({ status: 201, description: 'Регистрация прошла успешно' })
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    const payload = await this.accountService.verifyRefreshToken(refreshToken);
    const accessToken = this.accountService.generateAccessToken(payload);

    return { accessToken };
  }

  @Get('me')
  @Authorization()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение данных о пользователе' })
  @ApiResponse({ status: 200 })
  me(@Authorized() user: SafeUser) {
    return user;
  }

  private parseEnvValDaysToMs(val: string | undefined): number | null {
    if (!val) {
      return null;
    }

    const match = val.match(/^(\d+)d$/);
    if (!match) {
      return null;
    }
    const countOfDays = Number(match[1]);
    return countOfDays * 24 * 60 * 60 * 1000;
  }

  private setRefreshTokenToCookies(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge:
        this.parseEnvValDaysToMs(process.env.JWT_REFRESH_EXPIRES_IN) ??
        7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
