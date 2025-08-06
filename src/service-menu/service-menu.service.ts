import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateServiceMenuDto } from './dto/create-service-menu.dto';
import { UpdateServiceMenuDto } from './dto/update-service-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceMenu } from './entities/service-menu.entity';
import { Repository } from 'typeorm';
import { WasherService } from 'src/washer/washer.service';

@Injectable()
export class ServiceMenuService {
  constructor(
    @InjectRepository(ServiceMenu)
    private serviceRepository: Repository<ServiceMenu>,
    private washerService: WasherService,
  ) {}

  // create service
  async createService(
    userId: number,
    createServiceMenuDto: CreateServiceMenuDto,
  ) {
    // check if washer exists
    const washer = await this.washerService.getWasherById(userId);
    if (!washer) throw new NotFoundException('Washer not found');

    // check if service already exists
    const existingService = await this.serviceRepository.findOne({
      where: { name: createServiceMenuDto.name },
    });
    if (existingService)
      throw new BadRequestException('Service already exists');

    // create service
    const service = this.serviceRepository.create(createServiceMenuDto);
    service.washer = washer;
    return this.serviceRepository.save(service);
  }

  // list all my services
  async listServices(userId: number) {
    const washer = await this.washerService.getWasherById(userId);
    if (!washer) throw new NotFoundException('Washer not found');
    return washer.services;
  }

  async listAllServices() {
    const services = await this.serviceRepository.find({
      relations: ['washer', 'washer.user'], // Ensure both relations are loaded
      select: {
        id: true, // Include service ID
        name: true, // Include service name
        price: true, // Include service price
        // Add other service fields you need
        washer: {
          id: true, // Include washer ID
          // Add other washer fields you need
          user: {
            name: true, // Only get user's first name
            // Add other user fields as needed
          },
        },
      },
    });
    return services;
  }
}
