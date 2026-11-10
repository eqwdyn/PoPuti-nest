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
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { Authorization } from '../../../shared/decorators/auth.decorator.js';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Authorized } from '../../../shared/decorators/authorized.decorator.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Authorization()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Создание заказа' })
  @ApiResponse({ status: 200 })
  create(@Authorized('id') userId: number, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(userId, dto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  //   @Delete(':id')
  //   remove(@Param('id') id: string) {
  //     return this.ordersService.remove(+id);
  //   }
}
