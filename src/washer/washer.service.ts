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
import { UserService } from 'src/user/user.service';
import { UserRole } from 'src/user/entities/user.entity';
import { getDistance } from 'src/utils/distance.util';

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
    return this.washerRepository.save(washer);
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

    const results: NearbyWasherResult[] = [];

    for (const washer of washers) {
      if (!washer.latitude || !washer.longitude) continue;

      const distance = getDistance(lat, lng, washer.latitude, washer.longitude);

      if (distance <= radiusKm) {
        results.push({
          washer: {
            id: washer.id,
            name: washer.user.name,
            distance: parseFloat(distance.toFixed(2)),
          },
          services: washer.services.map((service) => ({
            id: service.id,
            name: service.name,
            price: service.price,
            description: service.description,
          })),
        });
      }
    }

    // Sort by distance (nearest first)
    return results.sort((a, b) => a.washer.distance - b.washer.distance);
  }
}
