import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientService } from './client.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { Authorization } from '../../../shared/decorators/auth.decorator.js';
import { Authorized } from '../../../shared/decorators/authorized.decorator.js';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Order / Client')
@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @Authorization()
  @ApiResponse({ status: 201, description: 'Заказ создан' })
  create(@Authorized('id') userId: number, @Body() dto: CreateOrderDto) {
    return this.clientService.create(userId, dto);
  }

  @Get()
  @Authorization()
  @ApiOperation({ summary: 'Список заказов текущего клиента' })
  findAll(@Authorized('id') userId: number) {
    return this.clientService.findAllByClient(userId);
  }

  @Get(':id')
  @Authorization()
  @ApiOperation({ summary: 'Получить заказ по id' })
  findOne(
    @Authorized('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientService.findOneForClient(userId, id);
  }

  @Patch(':id')
  @Authorization()
  @ApiOperation({ summary: 'Обновить заказ' })
  update(
    @Authorized('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.clientService.updateForClient(userId, id, dto);
  }

  @Delete(':id')
  @Authorization()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Отменить заказ' })
  remove(
    @Authorized('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientService.cancelForClient(userId, id);
  }
}
