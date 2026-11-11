import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Название товара',
    example: 'Молоко 2.5%',
    required: true,
  })
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiProperty({
    description: 'Количество',
    example: '2 шт',
    required: true,
  })
  @IsString()
  @Length(1, 50)
  quantity: string;

  @ApiProperty({
    description: 'Комментарий к товару',
    example: 'Без сахара',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;
}
