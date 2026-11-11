import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientController } from './client.controller.js';
import { ClientService } from './client.service.js';

describe('ClientController', () => {
  let controller: ClientController;
  let service: ClientService;

  const mockClientService = {
    create: vi.fn(),
    findAllByClient: vi.fn(),
    findOneForClient: vi.fn(),
    updateForClient: vi.fn(),
    cancelForClient: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [{ provide: ClientService, useValue: mockClientService }],
    }).compile();

    controller = module.get<ClientController>(ClientController);
    service = module.get<ClientService>(ClientService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('должен вызвать clientService.create с userId из токена и dto', async () => {
      const dto = {
        pickupAddress: 'A',
        deliveryAddress: 'B',
        price: 100,
        items: [{ title: 'Молоко', quantity: '2 шт' }],
      };
      mockClientService.create.mockResolvedValue({ id: 1 });

      const result = await controller.create(5, dto);

      expect(mockClientService.create).toHaveBeenCalledWith(5, dto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('findAll', () => {
    it('должен вызвать findAllByClient с userId', async () => {
      mockClientService.findAllByClient.mockResolvedValue([]);

      await controller.findAll(5);

      expect(mockClientService.findAllByClient).toHaveBeenCalledWith(5);
    });
  });

  describe('findOne', () => {
    it('должен вызвать findOneForClient с userId и id', async () => {
      mockClientService.findOneForClient.mockResolvedValue({ id: 1 });

      await controller.findOne(5, 1);

      expect(mockClientService.findOneForClient).toHaveBeenCalledWith(5, 1);
    });
  });

  describe('update', () => {
    it('должен вызвать updateForClient с userId, id и dto', async () => {
      const dto = { price: 200 };
      mockClientService.updateForClient.mockResolvedValue({ id: 1 });

      await controller.update(5, 1, dto);

      expect(mockClientService.updateForClient).toHaveBeenCalledWith(5, 1, dto);
    });
  });

  describe('remove', () => {
    it('должен вызвать cancelForClient с userId и id', async () => {
      mockClientService.cancelForClient.mockResolvedValue({ id: 1 });

      await controller.remove(5, 1);

      expect(mockClientService.cancelForClient).toHaveBeenCalledWith(5, 1);
    });
  });
});
