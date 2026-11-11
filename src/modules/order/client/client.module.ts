import { Module } from '@nestjs/common';
import { ClientService } from './client.service.js';
import { ClientController } from './client.controller.js';
import { PrismaModule } from '../../../core/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule {}
