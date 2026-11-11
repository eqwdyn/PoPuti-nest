import { Injectable } from '@nestjs/common';
import { CreateCourierDto } from './dto/create-courier.dto.js';
import { UpdateCourierDto } from './dto/update-courier.dto.js';

@Injectable()
export class CourierService {
  create(createCourierDto: CreateCourierDto) {
    return 'This action adds a new courier';
  }

  findAll() {
    return `This action returns all courier`;
  }

  findOne(id: number) {
    return `This action returns a #${id} courier`;
  }

  update(id: number, updateCourierDto: UpdateCourierDto) {
    return `This action updates a #${id} courier`;
  }

  remove(id: number) {
    return `This action removes a #${id} courier`;
  }
}
