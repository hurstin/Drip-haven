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
}
