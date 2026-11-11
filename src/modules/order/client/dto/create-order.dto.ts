import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto.js';

export class CreateOrderDto {
  // ==================== Магазин (откуда забрать) ====================
  @ApiProperty({
    description: 'Адрес магазина (откуда забрать)',
    example: 'ул. Сенявина 3, магазин Яблоко',
  })
  @IsString()
  @Length(1, 500)
  pickupAddress: string;

  @ApiProperty({
    description: 'Широта магазина',
    example: 44.6166,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLat: number;

  @ApiProperty({
    description: 'Долгота магазина',
    example: 33.5254,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLng: number;

  // ==================== Доставка (куда привезти) ====================
  @ApiProperty({
    description: 'Адрес доставки (куда привезти)',
    example: 'ул. Музыки 84, кв. 426',
  })
  @IsString()
  @Length(1, 500)
  deliveryAddress: string;

  @ApiProperty({
    description: 'Широта доставки',
    example: 44.62,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  deliveryLat: number;

  @ApiProperty({
    description: 'Долгота доставки',
    example: 33.53,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  deliveryLng: number;

  // ==================== Прочее ====================
  @ApiProperty({
    description: 'Комментарий к заказу',
    example: 'Донеси до двери',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  comment?: string;

  @ApiProperty({
    description: 'Стоимость доставки',
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Список товаров',
    type: [CreateOrderItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
