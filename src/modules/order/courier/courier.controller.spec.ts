import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CourierController } from './courier.controller.js';
import { CourierService } from './courier.service.js';
import { OrderStatus } from '../../../generated/prisma/enums.js';

describe('CourierController', () => {
  let controller: CourierController;
  let service: CourierService;

  const mockCourierService = {
    takeOrder: vi.fn(),
    getAvailable: vi.fn(),
    findAllByCourier: vi.fn(),
    findOneForCourier: vi.fn(),
    updateStatus: vi.fn(),
    toggleItem: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourierController],
      providers: [
        // ✅ Мокаем сервис, а не даём реальный (иначе упадёт на PrismaService)
        { provide: CourierService, useValue: mockCourierService },
      ],
    }).compile();

    controller = module.get<CourierController>(CourierController);
    service = module.get<CourierService>(CourierService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ==================== takeOrder ====================
  describe('takeOrder', () => {
    it('должен вызвать courierService.takeOrder с id и courierId', async () => {
      mockCourierService.takeOrder.mockResolvedValue({ id: 1 });

      const result = await controller.takeOrder(1, 5);

      expect(mockCourierService.takeOrder).toHaveBeenCalledWith(1, 5);
      expect(result).toEqual({ id: 1 });
    });
  });

  // ==================== getAvailable ====================
  describe('getAvailable', () => {
    it('должен вызвать getAvailable с радиусом и координатами', async () => {
      mockCourierService.getAvailable.mockResolvedValue([]);

      await controller.getAvailable(2, 44.5, 33.5);

      expect(mockCourierService.getAvailable).toHaveBeenCalledWith({
        radiusKm: 2,
        pickupLat: 44.5,
        pickupLng: 33.5,
      });
    });

    it('должен использовать радиус 1 по умолчанию, если radiusKm не передан', async () => {
      mockCourierService.getAvailable.mockResolvedValue([]);

      await controller.getAvailable(undefined, 44.5, 33.5);

      expect(mockCourierService.getAvailable).toHaveBeenCalledWith({
        radiusKm: 1,
        pickupLat: 44.5,
        pickupLng: 33.5,
      });
    });

    it('должен работать, если lat = 0 (граничный случай)', async () => {
      mockCourierService.getAvailable.mockResolvedValue([]);

      await controller.getAvailable(2, 0, 33.5);

      expect(mockCourierService.getAvailable).toHaveBeenCalledWith({
        radiusKm: 2,
        pickupLat: 0,
        pickupLng: 33.5,
      });
    });

    it('должен работать, если lng = 0 (граничный случай)', async () => {
      mockCourierService.getAvailable.mockResolvedValue([]);

      await controller.getAvailable(2, 44.5, 0);

      expect(mockCourierService.getAvailable).toHaveBeenCalledWith({
        radiusKm: 2,
        pickupLat: 44.5,
        pickupLng: 0,
      });
    });

    it('должен выбросить BadRequestException, если lat не передан', async () => {
      await expect(controller.getAvailable(1, undefined, 33.5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('должен выбросить BadRequestException, если lng не передан', async () => {
      await expect(controller.getAvailable(1, 44.5, undefined)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ==================== findAll ====================
  describe('findAll', () => {
    it('должен вызвать findAllByCourier с courierId', async () => {
      mockCourierService.findAllByCourier.mockResolvedValue([]);

      await controller.findAll(5);

      expect(mockCourierService.findAllByCourier).toHaveBeenCalledWith(5);
    });
  });

  // ==================== findOne ====================
  describe('findOne', () => {
    it('должен вызвать findOneForCourier с courierId и id', async () => {
      mockCourierService.findOneForCourier.mockResolvedValue({ id: 1 });

      await controller.findOne(5, 1);

      expect(mockCourierService.findOneForCourier).toHaveBeenCalledWith(5, 1);
    });
  });

  // ==================== updateStatus ====================
  describe('updateStatus', () => {
    it('должен вызвать updateStatus с courierId, id и статусом из dto', async () => {
      const dto = { status: OrderStatus.IN_PROGRESS };
      mockCourierService.updateStatus.mockResolvedValue({ id: 1 });

      await controller.updateStatus(5, 1, dto);

      expect(mockCourierService.updateStatus).toHaveBeenCalledWith(
        5,
        1,
        OrderStatus.IN_PROGRESS,
      );
    });
  });

  // ==================== toggleItem ====================
  describe('toggleItem', () => {
    it('должен вызвать toggleItem с courierId, orderId и itemId', async () => {
      mockCourierService.toggleItem.mockResolvedValue({ id: 10 });

      await controller.toggleItem(5, 1, 10);

      expect(mockCourierService.toggleItem).toHaveBeenCalledWith(5, 1, 10);
    });
  });
});
