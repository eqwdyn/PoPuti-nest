import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccountService } from './account.service.js';
import { PrismaService } from '../../../core/prisma/prisma.service.js';

const mockBcrypt = vi.hoisted(() => ({
  compare: vi.fn<(password: string, hash: string) => Promise<boolean>>(),
  genSalt: vi.fn<(rounds: number) => Promise<string>>(),
  hash: vi.fn<(password: string, salt: string) => Promise<string>>(),
}));

vi.mock('bcrypt', () => mockBcrypt);

describe('AccountService', () => {
  let service: AccountService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  // Моки для зависимостей
  const mockPrisma = {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  };

  const mockJwtService = {
    sign: vi.fn(),
    verify: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Очищаем моки перед каждым тестом
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== validateUser ====================
  describe('validateUser', () => {
    it('должен выбросить UnauthorizedException, если пользователь не найден', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.validateUser({ login: 'unknown', password: '123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('должен выбросить UnauthorizedException, если пароль неверный', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        login: 'test',
        password: 'hashed',
      });
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(
        service.validateUser({ login: 'test', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('должен вернуть id и login при успешной валидации', async () => {
      const user = { id: 1, login: 'test', password: 'hashed' };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await service.validateUser({
        login: 'test',
        password: 'correct',
      });

      expect(result).toEqual({ id: 1, login: 'test' });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('correct', 'hashed');
    });
  });

  // ==================== createUser ====================
  describe('createUser', () => {
    const dto = {
      login: 'newuser',
      password: 'plain',
      name: 'Name',
      surname: 'Surname',
      phone: '+79990000000',
    };

    it('должен выбросить ConflictException, если логин занят', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1, login: 'newuser' });

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
    });

    it('должен создать пользователя с хешированным паролем и вернуть safeUser', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockBcrypt.genSalt.mockResolvedValue('salt');
      mockBcrypt.hash.mockResolvedValue('hashed_password');

      const createdUser = {
        id: 1,
        login: 'newuser',
        password: 'hashed_password',
        name: 'Name',
        surname: 'Surname',
        phone: '+79990000000',
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await service.createUser(dto);

      expect(mockBcrypt.hash).toHaveBeenCalledWith('plain', 'salt');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { ...dto, password: 'hashed_password' },
      });
      // Пароль не должен попасть в результат
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', 1);
    });
  });

  // ==================== generateAccessToken ====================
  describe('generateAccessToken', () => {
    it('должен вызвать jwtService.sign с payload', () => {
      const payload = { id: 1, login: 'test' };
      mockJwtService.sign.mockReturnValue('access_token');

      const result = service.generateAccessToken(payload);

      expect(mockJwtService.sign).toHaveBeenCalledWith(payload);
      expect(result).toBe('access_token');
    });
  });

  // ==================== generateRefreshToken ====================
  describe('generateRefreshToken', () => {
    it('должен вызвать jwtService.sign с expiresIn из конфига', () => {
      const payload = { id: 1 };
      mockConfigService.get.mockReturnValue('7d');
      mockJwtService.sign.mockReturnValue('refresh_token');

      const result = service.generateRefreshToken(payload);

      expect(mockJwtService.sign).toHaveBeenCalledWith(payload, {
        expiresIn: '7d',
      });
      expect(result).toBe('refresh_token');
    });
  });

  // ==================== verifyRefreshToken ====================
  describe('verifyRefreshToken', () => {
    const token = 'valid_refresh_token';

    it('должен вернуть id и login при валидном токене и существующем пользователе', async () => {
      mockConfigService.get.mockReturnValue('secret');
      mockJwtService.verify.mockReturnValue({ id: 1 });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1, login: 'test' });

      const result = await service.verifyRefreshToken(token);

      expect(result).toEqual({ id: 1, login: 'test' });
    });

    it('должен выбросить UnauthorizedException, если пользователь не найден', async () => {
      mockConfigService.get.mockReturnValue('secret');
      mockJwtService.verify.mockReturnValue({ id: 99 });
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyRefreshToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('должен выбросить UnauthorizedException при ошибке верификации JWT', async () => {
      mockConfigService.get.mockReturnValue('secret');
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.verifyRefreshToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
