import { Module } from '@nestjs/common';
import { CourierService } from './courier.service.js';
import { CourierController } from './courier.controller.js';

@Module({
  controllers: [CourierController],
  providers: [CourierService],
})
export class CourierModule {}
