import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWasherDto } from './dto/create-washer.dto';
import { UpdateWasherDto } from './dto/update-washer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Washer } from './entities/washer.entity';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';
import { UserRole } from '../user/entities/user.entity';
import { getDistance } from '../utils/distance.util';

// Define a type for the result structure
type NearbyWasherResult = {
  washer: {
    id: number;
    name: string;
    rating?: number;
    distance: number;
  };
  services: {
    id: number;
    name: string;
    price: number;
    duration?: number;
    description: string;
  }[];
};

@Injectable()
export class WasherService {
  constructor(
    @InjectRepository(Washer) private washerRepository: Repository<Washer>,
    private usersService: UserService,
    private notificationService: NotificationService,
  ) {}

  // register a user as a washer
  async registerAsWasher(userId: number, kycInfo: { idPhotoUrl?: string }) {
    // check if user exists
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // prevent duplicate wash profile
    const existing = await this.washerRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existing) throw new BadRequestException('Already a washer');

    // create washer profile
    const washer = this.washerRepository.create({
      user: { id: userId },
      kycStatus: 'pending',
      idPhotoUrl: kycInfo.idPhotoUrl,
    });

    await this.washerRepository.save(washer);

    // // set role

    // await this.usersService.updateMyProfile(userId, { role: UserRole.WASHER });

    // Notify admins of a new washer registration awaiting review
    await this.notificationService.notifyAdmins(
      'New washer registration',
      `User ${user.name} submitted KYC and is awaiting approval.`,
    );

    return washer;
  }

  // admin approves KYC
  // NOTE: apply sending email to user approved
  async approveWasher(userId: number) {
    const washer = await this.washerRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!washer) throw new NotFoundException('Washer not found');

    // approve washer
    washer.kycStatus = 'approved';

    // set userRole to washer
    await this.usersService.updateMyProfile(washer.user.id, {
      role: UserRole.WASHER,
    });
    await this.washerRepository.save(washer);

    // Notify washer of approval
    await this.notificationService.notifyUser(washer.user.id, {
      // Minimal payload: title + message are required in service
      userId: washer.user.id,
      title: 'KYC Approved',
      message:
        'Your washer account has been approved. You can now accept jobs.',
    } as any);
    return washer;
  }

  // admin reject KYC
  // NOTE: apply sending email to user rejected to resend kyc
  async rejectWasher(userId: number) {
    const washer = await this.washerRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!washer) throw new NotFoundException('Washer not found');

    // reject washer
    washer.kycStatus = 'rejected';

    // set userRole to user
    await this.usersService.updateMyProfile(washer.user.id, {
      role: UserRole.USER,
    });
    const saved = await this.washerRepository.save(washer);

    // Notify washer of rejection
    await this.notificationService.notifyUser(washer.user.id, {
      userId: washer.user.id,
      title: 'KYC Rejected',
      message:
        'Your washer verification was rejected. Please resubmit your documents.',
    } as any);
    return saved;
  }

  // get a washer by id
  async getWasherById(userId: number) {
    // get washer by user id
    const washer = await this.washerRepository.findOne({
      where: { user: { id: userId } },
      relations: ['services'],
    });
    if (!washer) throw new NotFoundException('Washer not found');
    return washer;
  }

  // get all washer
  async getAllWasher() {
    const washer = await this.washerRepository.find({
      relations: ['services'],
    });

    if (!washer || washer.length === 0)
      throw new NotFoundException('wahser not found');

    return {
      washer,
    };
  }

  // src/washer/washer.service.ts
  async updateWasherProfile(userId: number, updateData: any): Promise<Washer> {
    const washer = await this.washerRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!washer) {
      throw new NotFoundException('Washer profile not found');
    }

    // Update only basic profile fields
    if (updateData.latitude !== undefined)
      washer.latitude = updateData.latitude;
    if (updateData.longitude !== undefined)
      washer.longitude = updateData.longitude;
    if (updateData.isAvailable !== undefined)
      washer.isAvailable = updateData.isAvailable;

    return this.washerRepository.save(washer);
  }

  async findNearbyWashersWithServices(
    lat: number,
    lng: number,
    radiusKm: number = 5,
  ) {
    // Get all approved, available washers with their services
    const washers = await this.washerRepository.find({
      where: {
        isAvailable: true,
        kycStatus: 'approved',
      },
      relations: ['user', 'services'], // Include user details and services
    });

    // let minDist=Infinity
    const results: NearbyWasherResult[] = [];

    for (const washer of washers) {
      if (!washer.latitude || !washer.longitude) continue;

      const distance = getDistance(lat, lng, washer.latitude, washer.longitude);

      if (distance <= radiusKm) {
        // Filter for only active services
        const activeServices = washer.services.filter(
          (service) => service.isActive,
        );

        // Only include washer if they have at least one active service
        if (activeServices.length > 0) {
          results.push({
            washer: {
              id: washer.id,
              name: washer.user.name,
              distance: parseFloat(distance.toFixed(2)),
            },
            services: activeServices.map((service) => ({
              id: service.id,
              name: service.name,
              price: service.price,
              description: service.description,
            })),
          });
        }
      }
    }

    if (!results || results.length < 1) {
      throw new NotFoundException('no active washer around');
    }

    // Sort by distance (nearest first)
    return results.sort((a, b) => a.washer.distance - b.washer.distance);
  }
}
