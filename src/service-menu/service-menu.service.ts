import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateServiceMenuDto } from './dto/create-service-menu.dto';
import { UpdateServiceMenuDto } from './dto/update-service-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceMenu } from './entities/service-menu.entity';
import { Repository } from 'typeorm';
import { WasherService } from '../washer/washer.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ServiceMenuService {
  constructor(
    @InjectRepository(ServiceMenu)
    private serviceRepository: Repository<ServiceMenu>,
    private washerService: WasherService,
    private notificationService: NotificationService,
  ) {}

  // create service
  async createService(
    userId: number,
    createServiceMenuDto: CreateServiceMenuDto,
  ) {
    // check if washer exists
    const washer = await this.washerService.getWasherById(userId);
    if (!washer) throw new NotFoundException('Washer not found');
    console.log('washer', washer);

    // check if service already exists
    const existingService = await this.serviceRepository.findOne({
      where: { name: createServiceMenuDto.name },
    });
    if (existingService)
      throw new BadRequestException('Service already exists');

    // create service
    const service = this.serviceRepository.create(createServiceMenuDto);
    service.washer = washer;
    const saved = await this.serviceRepository.save(service);

    // Inform admins of newly created service (for moderation/oversight)
    await this.notificationService.notifyAdmins(
      'New service created',
      `Washer ${washer.user.name} created service: ${service.name} at ₦${service.price}.`,
    );

    return saved;
  }

  // list all my services
  async listServices(userId: number) {
    const services = await this.serviceRepository.find({
      where: { washer: { user: { id: userId } } },
    });
    if (!services || services.length === 0)
      throw new NotFoundException('Washer not found');
    return services;
  }

  // get a service
  async getService(serviceId: number) {
    const service = await this.serviceRepository.findOne({
      where: {
        id: serviceId,
        isActive: true,
      },
      relations: ['washer'],
    });
    if (!service) throw new NotFoundException('service not found');

    return service;
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

  // update a service. modify with the code below
  async updateService(
    id: number,
    userId: number,
    updateServiceDto: UpdateServiceMenuDto,
  ) {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['washer', 'washer.user'],
      select: {
        id: true,
        name: true,
        price: true,
        washer: {
          id: true,
          user: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!service) throw new NotFoundException('service not found');
    if (service.washer.user.id !== userId) throw new ForbiddenException();
    Object.assign(service, updateServiceDto);

    return this.serviceRepository.save(service);
  }

  // delete a service
  async deleteService(id: number, userId: number) {
    // Optimized database query: removed unnecessary selects and relations
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['washer.user'], // Only load necessary relation
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Validate ownership with proper null checks
    const ownerId = service.washer?.user?.id;
    if (ownerId !== userId) {
      throw new ForbiddenException();
    }

    // Efficient deletion using ID instead of full entity
    return this.serviceRepository.delete(id);
  }

  // set active status (activate/deactivate) for a service
  async setActiveStatus(id: number, userId: number, isActive: boolean) {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['washer.user'],
    });

    if (!service) throw new NotFoundException('Service not found');

    const ownerId = service.washer?.user?.id;
    if (ownerId !== userId) throw new ForbiddenException();

    service.isActive = isActive;
    return this.serviceRepository.save(service);
  }

  // list all active services
  async listAllActiveServices() {
    const services = await this.serviceRepository.find({
      where: { isActive: true },
      relations: ['washer', 'washer.user'],
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true,
        washer: {
          id: true,
          user: {
            name: true,
          },
        },
      },
    });
    return services;
  }
}

// async updateService(
//   id: number,
//   userId: number,
//   updateServiceDto: UpdateServiceMenuDto,
// ) {
//   // Load only necessary relations for ownership verification
//   const service = await this.serviceRepository.findOne({
//     where: { id },
//     relations: ['washer.user'], // Only load the essential relation chain
//   });

//   if (!service) {
//     throw new NotFoundException('Service not found');
//   }

//   // Safe ownership check with optional chaining
//   const ownerId = service.washer?.user?.id;
//   if (ownerId !== userId) {
//     throw new ForbiddenException();
//   }

//   // Efficient update using repository's update method
//   await this.serviceRepository.update(id, updateServiceDto);

//   // Return updated entity without sensitive relations
//   return this.serviceRepository.findOneBy({ id });
// }
