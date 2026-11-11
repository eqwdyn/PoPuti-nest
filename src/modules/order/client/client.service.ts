import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { OrderStatus } from '../../../generated/prisma/enums.js';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: number, dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        clientId,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,

        deliveryAddress: dto.deliveryAddress,
        deliveryLat: dto.deliveryLat,
        deliveryLng: dto.deliveryLng,

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
  }

  async findAllByClient(clientId: number) {
    return this.prisma.order.findMany({
      where: { clientId },
      include: { items: true, courier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForClient(clientId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, clientId },
      include: { items: true, courier: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateForClient(
    clientId: number,
    orderId: number,
    dto: UpdateOrderDto,
  ) {
    const order = await this.findOneForClient(clientId, orderId);

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.ACCEPTED
    ) {
      throw new ForbiddenException(
        'Cannot update order after courier started delivery',
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        pickupAddress: dto.pickupAddress,
        deliveryAddress: dto.deliveryAddress,
        comment: dto.comment,
        price: dto.price,
      },
      include: { items: true },
    });
  }

  async cancelForClient(clientId: number, orderId: number) {
    const order = await this.findOneForClient(clientId, orderId);

    if (order.status === OrderStatus.DELIVERED) {
      throw new ForbiddenException('Cannot cancel delivered order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new ForbiddenException('Order is already cancelled');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        deliveredAt: new Date(),
      },
      include: { items: true },
    });
  }
}
