import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { PrismaService } from '../../../core/prisma/prisma.service.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: number, dto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: {
        clientId,
        pickupAddress: dto.pickupAddress,
        deliveryAddress: dto.deliveryAddress,
        comment: dto.comment,
        price: dto.price,
        items: {
          create: dto.items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            note: item.note,
          })),
        },
      },
      include: { items: true },
    });
    return order;
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
