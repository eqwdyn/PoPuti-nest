import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto.js';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Адрес магазина (откуда забрать)',
    example: 'ул. Сенявина 3, магазин Яблоко',
  })
  @IsString()
  @Length(1, 500)
  pickupAddress: string;

  @ApiProperty({
    description: 'Адрес доставки (куда привезти)',
    example: 'ул. Музыки 84, кв. 426',
  })
  @IsString()
  @Length(1, 500)
  deliveryAddress: string;

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
