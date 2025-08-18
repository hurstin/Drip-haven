import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking, WasherResponse } from './entities/booking.entity';
import { In, Repository } from 'typeorm';
import { CarService } from 'src/car/car.service';
import { ServiceMenuService } from 'src/service-menu/service-menu.service';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private carService: CarService,
    private serviceRepo: ServiceMenuService,
    private transactionService: TransactionService,
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
      paymentStatus: 'none',
      washerResponse: undefined,
    });
    // NOTE: notify washer
    return await this.bookingRepo.save(booking);
  }

  // washer accept booking
  async washerAcceptBooking(bookingId: number, washerUserId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['service', 'service.washer.user'],
    });
    if (!booking) throw new NotFoundException('booking not found');

    // Add null check for washer first
    if (!booking.service.washer) {
      throw new ConflictException('Booking has no assigned washer');
    }

    if (booking.service.washer.user.id !== washerUserId)
      throw new ForbiddenException('not your booking');
    if (booking.status !== 'assigned')
      throw new ConflictException('Booking not awaiting washer reponse');

    booking.status = 'accepted';
    booking.washerResponse = WasherResponse.ACCEPTED;
    return this.bookingRepo.save(booking);
  }

  // washer declines booking(admin can reassign)
  async washerDeclineBooking(bookingId: number, washerUserId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['service', 'service.washer.user'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.service.washer.user.id !== washerUserId)
      throw new ForbiddenException('Not your booking');
    if (booking.status !== 'assigned')
      throw new ConflictException('Booking not awaiting washer response');

    booking.status = 'declined';
    booking.washerResponse = WasherResponse.DECLINED;
    // Optionally: notify user/admin
    return this.bookingRepo.save(booking);
  }

  async completeBooking(bookingId: number, washerUserId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['service', 'service.washer.user'],
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (!booking.service.washer) {
      throw new ConflictException('Booking has no assigned washer');
    }

    if (booking.service.washer.user.id !== washerUserId)
      throw new ForbiddenException('not your booking');

    if (booking.status === 'accepted') {
      booking.status = 'completed';
      await this.bookingRepo.save(booking);
      return { booking };
    }
    return { message: 'booking is not assigned or was cancelled' };
  }

  async approveBooking(bookingId: number, userId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['service', 'user'],
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.user.id !== userId)
      throw new ForbiddenException('Not your booking');

    if (booking.status === 'completed') {
      const transaction = await this.transactionService.initializeTransaction(
        userId,
        booking.service.id,
      );

      if (!transaction) return null;

      console.log('transref===>', transaction.transactionReference);

      booking.paymentReference = transaction.transactionReference;
      await this.bookingRepo.save(booking);

      // const findTrans = await this.transactionService.findByRefrence(
      //   transaction.transactionReference,
      // );
      return { transaction, booking };
    }
  }

  async verifyPayment(ref: string) {
    const booking = await this.bookingRepo.findOne({
      where: { paymentReference: ref },
    });

    if (!booking) throw new NotFoundException('booking not found');

    const transaction = await this.transactionService.findByRefrence(ref);

    if (!transaction) throw new NotFoundException('transaction not found');

    // check if transaction is successfull
    if (
      transaction.transactionStatus === 'success' &&
      transaction.status === 'paid'
    ) {
      booking.paymentStatus = 'authorized';
      booking.status = 'paid';

      await this.bookingRepo.save(booking);
    } else {
      throw new UnauthorizedException(
        'error popped up,still fixing error messages',
      );
    }

    return {
      booking,
      transaction,
    };
  }

  // src/booking/booking.service.ts
  async cancelBooking(bookingId: number, userId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['user'],
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user.id !== userId)
      throw new ForbiddenException('Not your booking');

    if (!['assigned', 'accepted'].includes(booking.status)) {
      throw new ConflictException('Booking cannot be cancelled at this stage');
    }

    booking.status = 'cancelled';
    await this.bookingRepo.save(booking);

    // Notify washer (if assigned)
    // if (booking.washer) {
    //   await this.notificationService.notifyUser(booking.washer.user.id, {
    //     title: 'Booking Cancelled',
    //     message: `Booking for ${booking.car?.model ?? 'car'} on ${booking.scheduledTime} was cancelled by the user.`,
    //     type: 'booking'
    //   });
    // }

    // Optionally: Notify admins
    // await this.notificationService.notifyAdmins({ ... });

    return booking;
  }

  async getAllBooking() {
    const bookings = await this.bookingRepo.find({
      relations: ['user', 'service'],
      select: {
        id: true,
        scheduledTime: true,
        status: true,
        paymentStatus: true,
        washerResponse: true,
        paymentReference: true,
        user: {
          name: true,
        },
        service: {
          id: true,
          name: true,
        },
      },
    });

    if (!bookings || bookings.length === 0)
      throw new NotFoundException('no bookings found');

    return {
      bookings,
    };
  }

  async getUserBooking(userId: number) {
    const bookings = await this.bookingRepo.find({
      where: { user: { id: userId } },
      relations: ['user', 'service'],
      select: {
        id: true,
        scheduledTime: true,
        status: true,
        paymentStatus: true,
        washerResponse: true,
        user: {
          name: true,
        },
        service: {
          id: true,
          name: true,
        },
      },
    });
    if (!bookings || bookings.length === 0)
      throw new NotFoundException('no bookings found');
    return {
      bookings,
    };
  }
}
