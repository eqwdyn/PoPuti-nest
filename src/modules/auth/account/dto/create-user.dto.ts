import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Логин',
    example: 'eqwdy',
    required: true,
    minLength: 2,
  })
  @IsString()
  @Length(2)
  login: string;

  @ApiProperty({
    description: 'Пароль',
    example: '123456',
    required: true,
    minLength: 4,
  })
  @IsString()
  @Length(4)
  password: string;

  @ApiProperty({
    description: 'Имя',
    example: 'Александр',
    required: true,
    minLength: 2,
  })
  @IsString()
  @Length(2)
  name: string;

  @ApiProperty({
    description: 'Фамилия',
    example: 'Куксенок',
    required: true,
    minLength: 2,
  })
  @IsString()
  @Length(2)
  surname: string;

  @ApiProperty({
    description: 'Номер телефона',
    example: '+79786755013',
    required: true,
  })
  @IsString()
  @IsPhoneNumber('RU')
  phone: string;
}
