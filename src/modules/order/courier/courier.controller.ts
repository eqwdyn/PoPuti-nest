import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  ParseFloatPipe,
  BadRequestException,
} from '@nestjs/common';
import { CourierService } from './courier.service.js';
import { Authorization } from '../../../shared/decorators/auth.decorator.js';
import { Authorized } from '../../../shared/decorators/authorized.decorator.js';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

@ApiTags('Order / Courier')
@Controller('order/courier')
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  @Post(':id/take')
  @Authorization()
  @ApiOperation({ summary: 'Взять заказ (PENDING → ACCEPTED)' })
  @ApiResponse({ status: 200, description: 'Заказ принят' })
  @ApiResponse({ status: 409, description: 'Заказ уже занят другим курьером' })
  async takeOrder(
    @Param('id', ParseIntPipe) id: number,
    @Authorized('id') courierId: number,
  ) {
    return this.courierService.takeOrder(id, courierId);
  }

  @Get('available')
  @Authorization()
  @ApiOperation({ summary: 'Доступные заказы (PENDING)' })
  async getAvailable(
    @Query('radiusKm', ParseIntPipe) radiusKm?: number,
    @Query('lat', ParseFloatPipe) lat?: number,
    @Query('lng', ParseFloatPipe) lng?: number,
  ) {
    const radius = radiusKm ? radiusKm : 1;
    if (lat === undefined || lng === undefined) {
      throw new BadRequestException('Uncorrect geoposition');
    }

    return this.courierService.getAvailable({
      radiusKm: radius,
      pickupLat: lat,
      pickupLng: lng,
    });
  }

  @Get()
  @Authorization()
  @ApiOperation({ summary: 'Мои заказы' })
  async findAll(@Authorized('id') courierId: number) {
    return this.courierService.findAllByCourier(courierId);
  }

  @Get(':id')
  @Authorization()
  @ApiOperation({ summary: 'Заказ по id (только свой)' })
  async findOne(
    @Authorized('id') courierId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.courierService.findOneForCourier(courierId, id);
  }

  @Patch(':id/status')
  @Authorization()
  @ApiOperation({
    summary: 'Изменить статус заказа (ACCEPTED → IN_PROGRESS → DELIVERED)',
  })
  async updateStatus(
    @Authorized('id') courierId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.courierService.updateStatus(courierId, id, dto.status);
  }

  @Patch(':id/items/:itemId/toggle')
  @Authorization()
  @ApiOperation({ summary: 'Отметить товар как купленный (чек-лист)' })
  async toggleItem(
    @Authorized('id') courierId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.courierService.toggleItem(courierId, id, itemId);
  }
}
