import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service.js';
import { OrderStatus } from '../../../generated/prisma/enums.js';
import { getDistanceKm } from '../../../shared/utils/get-distance-km.js';
import { getBoundingBox } from '../../../shared/utils/get-bounding-box.js';

const DEFAULT_RADIUS_KM = 1;

// Допустимые переходы статусов курьером
const COURIER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.ACCEPTED],
  [OrderStatus.ACCEPTED]: [OrderStatus.IN_PROGRESS, OrderStatus.PENDING], // вернуть в пул
  [OrderStatus.IN_PROGRESS]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class CourierService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Взять заказ. Атомарно: только если он ещё PENDING и courierId не назначен.
   */
  async takeOrder(orderId: number, courierId: number) {
    const result = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        status: OrderStatus.PENDING,
        courierId: null,
      },
      data: {
        courierId,
        status: OrderStatus.ACCEPTED,
      },
    });

    if (result.count === 0) {
      // Либо заказа нет, либо уже занят, либо не PENDING
      const exists = await this.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!exists) throw new NotFoundException('Order not found');
      throw new ConflictException('Order is already taken or not available');
    }

    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, client: true },
    });
  }

  async getAvailable({
    radiusKm = DEFAULT_RADIUS_KM,
    pickupLat,
    pickupLng,
  }: {
    radiusKm?: number;
    pickupLat: number;
    pickupLng: number;
  }) {
    const box = getBoundingBox(pickupLat, pickupLng, radiusKm);

    const candidates = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        courierId: null,
        pickupLat: { gte: box.minLat, lte: box.maxLat },
        pickupLng: { gte: box.minLng, lte: box.maxLng },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    return candidates.filter((order) => {
      const dist = getDistanceKm(
        pickupLat,
        pickupLng,
        order.pickupLat,
        order.pickupLng,
      );
      return dist <= radiusKm;
    });
  }

  async findAllByCourier(courierId: number) {
    return this.prisma.order.findMany({
      where: { courierId },
      include: { items: true, client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForCourier(courierId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, courierId },
      include: { items: true, client: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(
    courierId: number,
    orderId: number,
    nextStatus: OrderStatus,
  ) {
    const order = await this.findOneForCourier(courierId, orderId);

    const allowed = COURIER_STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(nextStatus)) {
      throw new ForbiddenException(
        `Cannot transition from ${order.status} to ${nextStatus}`,
      );
    }

    const data: any = { status: nextStatus };

    if (nextStatus === OrderStatus.DELIVERED) {
      data.deliveredAt = new Date();
    }

    // Возврат в пул: снять курьера
    if (nextStatus === OrderStatus.PENDING) {
      data.courierId = null;
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data,
      include: { items: true },
    });
  }

  async toggleItem(courierId: number, orderId: number, itemId: number) {
    // Проверяем, что заказ принадлежит курьеру
    await this.findOneForCourier(courierId, orderId);

    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
    });

    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    return this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        isPurchased: !item.isPurchased,
        purchasedAt: !item.isPurchased ? new Date() : null,
      },
    });
  }
}
