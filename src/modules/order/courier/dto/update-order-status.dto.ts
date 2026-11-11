import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../../../../generated/prisma/enums.js';

// Тип допустимых статусов: 'PENDING' | 'ACCEPTED' | ...
type OrderStatusValue = (typeof OrderStatus)[keyof typeof OrderStatus];

// Курьеру разрешено ставить только эти статусы.
// PENDING — «вернуть заказ в пул», IN_PROGRESS — «в магазине»,
// DELIVERED — «доставлено». ACCEPTED и CANCELLED ставит система/клиент.
export const COURIER_ALLOWED_STATUSES: OrderStatusValue[] = [
  OrderStatus.PENDING,
  OrderStatus.IN_PROGRESS,
  OrderStatus.DELIVERED,
];

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Новый статус заказа',
    enum: COURIER_ALLOWED_STATUSES,
    example: OrderStatus.IN_PROGRESS,
  })
  @IsNotEmpty({ message: 'status should not be empty' })
  @IsIn(COURIER_ALLOWED_STATUSES, {
    message: `status must be one of: ${COURIER_ALLOWED_STATUSES.join(', ')}`,
  })
  status: OrderStatusValue;
}
