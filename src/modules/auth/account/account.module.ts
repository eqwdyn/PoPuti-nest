import { Global, Module } from '@nestjs/common';
import { AccountService } from './account.service.js';
import { AccountController } from './account.controller.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../../../shared/strategies/jwt.strategy.js';
import { PrismaModule } from '../../../core/prisma/prisma.module.js';

@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  controllers: [AccountController],
  providers: [AccountService, JwtStrategy],
  exports: [AccountService, PassportModule, JwtModule],
})
export class AccountModule {}
