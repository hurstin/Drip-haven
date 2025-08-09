import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { In, Repository } from 'typeorm';
import { CarService } from 'src/car/car.service';
import { ServiceMenuService } from 'src/service-menu/service-menu.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private carService: CarService,
    private serviceRepo: ServiceMenuService,
  ) {}

  // create booking with user-selected washer
  async createBooking(userId: number, createBookingDto: CreateBookingDto) {
    // validate car and service
    const car = await this.carService.getCar(createBookingDto.carId, userId);

    if (!car) throw new NotFoundException('car not found');

    const service = await this.serviceRepo.getService(
      createBookingDto.serviceId,
    );
    if (!service) throw new NotFoundException('service not found');

    // check for existing active booking for this car
    const activeStatuses = ['pending', 'assigned', 'accepted', 'in-progress'];
    const activeBooking = await this.bookingRepo.findOne({
      where: {
        car: { id: createBookingDto.carId },
        status: In(activeStatuses),
      },
    });

    if (activeBooking) {
      throw new ConflictException('this car already has a active booking');
    }
    // // 3. Validate selected washer
    // const washer = await this.washerRepo.findOne({
    //   where: { id: dto.washerId, isAvailable: true, kycStatus: 'approved' },
    // });
    // if (!washer) throw new ConflictException('Washer not available or not approved');

    // 4. Create booking
    const booking = this.bookingRepo.create({
      user: { id: userId },
      car,
      service,
      scheduledTime: createBookingDto.scheduledTime,
      latitude: Number(createBookingDto.latitude),
      longitude: Number(createBookingDto.longitude),
      status: 'assigned',
      paymentStatus: 'unpaid',
      washerResponse: undefined,
    });

    return await this.bookingRepo.save(booking);
  }
}
