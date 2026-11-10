import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { FILE_UPLOADS_DIR, FILE_UPLOADS_NAME } from '../shared/config.js';
import { AccountModule } from '../modules/auth/account/account.module.js';
import { ProfileModule } from '../modules/auth/profile/profile.module.js';
import { OrdersModule } from '../modules/auth/orders/orders.module.js';

@Module({
  imports: [
    // CacheModule.register({
    //   isGlobal: true,
    // }),
    // ServeStaticModule.forRoot({
    //   rootPath: FILE_UPLOADS_DIR,
    //   serveRoot: `/${FILE_UPLOADS_NAME}`,
    // }),
    ConfigModule.forRoot({ isGlobal: true }),
    AccountModule,
    ProfileModule,
    OrdersModule,
  ],
})
export class CoreModule {}
