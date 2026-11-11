import { PartialType } from '@nestjs/swagger';
import { CreateCourierDto } from './create-courier.dto.js';

export class UpdateCourierDto extends PartialType(CreateCourierDto) {}
