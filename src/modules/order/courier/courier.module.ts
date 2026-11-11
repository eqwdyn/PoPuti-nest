import { Module } from '@nestjs/common';
import { CourierService } from './courier.service.js';
import { CourierController } from './courier.controller.js';
import { PrismaModule } from '../../../core/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [CourierController],
  providers: [CourierService],
})
export class CourierModule {}
