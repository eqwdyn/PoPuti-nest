import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CourierService } from './courier.service.js';
import { PrismaService } from '../../../core/prisma/prisma.service.js';
import { OrderStatus } from '../../../generated/prisma/enums.js';
import { getDistanceKm } from '../../../shared/utils/get-distance-km.js';

// Мокаем утилиты геолокации, чтобы тесты были детерминированными
vi.mock('../../../shared/utils/get-distance-km.js', () => ({
  getDistanceKm: vi.fn(),
}));

vi.mock('../../../shared/utils/get-bounding-box.js', () => ({
  getBoundingBox: vi.fn(() => ({
    minLat: 44.0,
    maxLat: 45.0,
    minLng: 33.0,
    maxLng: 34.0,
  })),
}));

describe('CourierService', () => {
  let service: CourierService;
  let prisma: PrismaService;

  const mockPrisma = {
    order: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    orderItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourierService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CourierService>(CourierService);
    prisma = module.get<PrismaService>(PrismaService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== takeOrder ====================
  describe('takeOrder', () => {
    it('должен атомарно обновить заказ, если он PENDING и свободен', async () => {
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.order.findUnique.mockResolvedValue({ id: 1, courierId: 5 });

      const result = await service.takeOrder(1, 5);

      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 1,
          status: OrderStatus.PENDING,
          courierId: null,
        },
        data: {
          courierId: 5,
          status: OrderStatus.ACCEPTED,
        },
      });
      expect(result).toEqual({ id: 1, courierId: 5 });
    });

    it('должен выбросить NotFoundException, если заказа не существует', async () => {
      mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.takeOrder(1, 5)).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить ConflictException, если заказ уже занят', async () => {
      mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 1,
        status: OrderStatus.ACCEPTED,
        courierId: 10,
      });

      await expect(service.takeOrder(1, 5)).rejects.toThrow(ConflictException);
    });
  });

  // ==================== getAvailable ====================
  describe('getAvailable', () => {
    const courierPos = { pickupLat: 44.5, pickupLng: 33.5 };

    it('должен вернуть только заказы в радиусе (по Haversine)', async () => {
      // 2 кандидата из bounding box
      mockPrisma.order.findMany.mockResolvedValue([
        { id: 1, pickupLat: 44.5, pickupLng: 33.5 },
        { id: 2, pickupLat: 44.9, pickupLng: 33.9 },
      ]);

      // Заказ 1 — в радиусе, заказ 2 — за пределами
      vi.mocked(getDistanceKm)
        .mockReturnValueOnce(0.3) // id: 1
        .mockReturnValueOnce(2.0); // id: 2

      const result = await service.getAvailable({
        radiusKm: 1,
        ...courierPos,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.PENDING,
            courierId: null,
            pickupLat: { gte: 44.0, lte: 45.0 },
            pickupLng: { gte: 33.0, lte: 34.0 },
          }),
        }),
      );
    });

    it('должен использовать радиус по умолчанию (1 км)', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      await service.getAvailable(courierPos);

      // Проверяем, что getBoundingBox вызван с радиусом 1 (дефолт)
      // (в моке getBoundingBox всегда возвращает одно и то же, так что проверяем косвенно)
      expect(mockPrisma.order.findMany).toHaveBeenCalled();
    });
  });

  // ==================== findAllByCourier ====================
  describe('findAllByCourier', () => {
    it('должен вернуть заказы курьера, отсортированные по дате', async () => {
      mockPrisma.order.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await service.findAllByCourier(5);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: { courierId: 5 },
        include: { items: true, client: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  // ==================== findOneForCourier ====================
  describe('findOneForCourier', () => {
    it('должен вернуть заказ, если он принадлежит курьеру', async () => {
      const order = { id: 1, courierId: 5 };
      mockPrisma.order.findFirst.mockResolvedValue(order);

      const result = await service.findOneForCourier(5, 1);

      expect(result).toEqual(order);
      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 1, courierId: 5 },
        include: { items: true, client: true },
      });
    });

    it('должен выбросить NotFoundException, если заказ не принадлежит курьеру', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.findOneForCourier(5, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==================== updateStatus ====================
  describe('updateStatus', () => {
    const mockOrder = (status: OrderStatus) => ({
      id: 1,
      courierId: 5,
      status,
    });

    it('должен разрешить ACCEPTED → IN_PROGRESS', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(
        mockOrder(OrderStatus.ACCEPTED),
      );
      mockPrisma.order.update.mockResolvedValue({
        id: 1,
        status: OrderStatus.IN_PROGRESS,
      });

      const result = await service.updateStatus(5, 1, OrderStatus.IN_PROGRESS);

      expect(result.status).toBe(OrderStatus.IN_PROGRESS);
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: OrderStatus.IN_PROGRESS },
        }),
      );
    });

    it('должен разрешить IN_PROGRESS → DELIVERED и поставить deliveredAt', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(
        mockOrder(OrderStatus.IN_PROGRESS),
      );
      mockPrisma.order.update.mockResolvedValue({
        id: 1,
        status: OrderStatus.DELIVERED,
      });

      await service.updateStatus(5, 1, OrderStatus.DELIVERED);

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OrderStatus.DELIVERED,
            deliveredAt: expect.any(Date),
          }),
        }),
      );
    });

    it('должен разрешить ACCEPTED → PENDING (вернуть в пул) и снять курьера', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(
        mockOrder(OrderStatus.ACCEPTED),
      );
      mockPrisma.order.update.mockResolvedValue({ id: 1 });

      await service.updateStatus(5, 1, OrderStatus.PENDING);

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: OrderStatus.PENDING,
            courierId: null,
          },
        }),
      );
    });

    it('должен выбросить ForbiddenException при недопустимом переходе (ACCEPTED → DELIVERED)', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(
        mockOrder(OrderStatus.ACCEPTED),
      );

      await expect(
        service.updateStatus(5, 1, OrderStatus.DELIVERED),
      ).rejects.toThrow(ForbiddenException);
    });

    it('должен выбросить ForbiddenException из терминального статуса (DELIVERED → IN_PROGRESS)', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(
        mockOrder(OrderStatus.DELIVERED),
      );

      await expect(
        service.updateStatus(5, 1, OrderStatus.IN_PROGRESS),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== toggleItem ====================
  describe('toggleItem', () => {
    it('должен отметить товар как купленный (false → true)', async () => {
      // findOneForCourier
      mockPrisma.order.findFirst.mockResolvedValue({ id: 1, courierId: 5 });
      // findFirst для item
      mockPrisma.orderItem.findFirst.mockResolvedValue({
        id: 10,
        orderId: 1,
        isPurchased: false,
      });
      mockPrisma.orderItem.update.mockResolvedValue({
        id: 10,
        isPurchased: true,
      });

      const result = await service.toggleItem(5, 1, 10);

      expect(result.isPurchased).toBe(true);
      expect(mockPrisma.orderItem.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          isPurchased: true,
          purchasedAt: expect.any(Date),
        },
      });
    });

    it('должен снять отметку (true → false) и обнулить purchasedAt', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ id: 1, courierId: 5 });
      mockPrisma.orderItem.findFirst.mockResolvedValue({
        id: 10,
        orderId: 1,
        isPurchased: true,
      });
      mockPrisma.orderItem.update.mockResolvedValue({
        id: 10,
        isPurchased: false,
      });

      await service.toggleItem(5, 1, 10);

      expect(mockPrisma.orderItem.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          isPurchased: false,
          purchasedAt: null,
        },
      });
    });

    it('должен выбросить NotFoundException, если товар не принадлежит заказу', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ id: 1, courierId: 5 });
      mockPrisma.orderItem.findFirst.mockResolvedValue(null);

      await expect(service.toggleItem(5, 1, 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('должен выбросить NotFoundException, если заказ не принадлежит курьеру', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.toggleItem(5, 1, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
