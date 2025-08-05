import { Injectable } from '@nestjs/common';
import { CreateServiceMenuDto } from './dto/create-service-menu.dto';
import { UpdateServiceMenuDto } from './dto/update-service-menu.dto';

@Injectable()
export class ServiceMenuService {
  create(createServiceMenuDto: CreateServiceMenuDto) {
    return 'This action adds a new serviceMenu';
  }

  findAll() {
    return `This action returns all serviceMenu`;
  }

  findOne(id: number) {
    return `This action returns a #${id} serviceMenu`;
  }

  update(id: number, updateServiceMenuDto: UpdateServiceMenuDto) {
    return `This action updates a #${id} serviceMenu`;
  }

  remove(id: number) {
    return `This action removes a #${id} serviceMenu`;
  }
}
