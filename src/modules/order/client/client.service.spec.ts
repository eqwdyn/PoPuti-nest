import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientService } from './client.service.js';
import { PrismaService } from '../../../core/prisma/prisma.service.js';

describe('ClientService', () => {
  let service: ClientService;
  let prisma: PrismaService;

  const mockPrisma = {
    order: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    prisma = module.get<PrismaService>(PrismaService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneForClient', () => {
    it('должен выбросить NotFoundException, если заказ не найден', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.findOneForClient(1, 1)).rejects.toThrow(
        NotFoundException, // ✅ правильный тип
      );
    });

    it('должен фильтровать по clientId (защита от доступа к чужим заказам)', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 1,
        clientId: 1,
        items: [],
      });

      await service.findOneForClient(1, 1);

      // ✅ проверяем, что в запрос ушёл clientId
      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 1, clientId: 1 },
        include: { items: true, courier: true },
      });
    });

    it('должен вернуть заказ, если он найден и принадлежит клиенту', async () => {
      const order = { id: 1, clientId: 1, items: [], courier: null };
      mockPrisma.order.findFirst.mockResolvedValue(order);

      const result = await service.findOneForClient(1, 1);

      expect(result).toEqual(order);
    });
  });
});
