import { Module } from '@nestjs/common';
import { ClientModule } from './client/client.module.js';
import { CourierModule } from './courier/courier.module.js';

@Module({
  imports: [ClientModule, CourierModule],
})
export class OrderModule {}
