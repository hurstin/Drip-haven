import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking, WasherResponse } from './entities/booking.entity';
import { In, Repository, Between, Like } from 'typeorm';
import { CarService } from '../car/car.service';
import { ServiceMenuService } from '../service-menu/service-menu.service';
import { TransactionService } from '../transaction/transaction.service';
import { UserService } from '../user/user.service';
import { WasherService } from '../washer/washer.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private carService: CarService,
    private serviceRepo: ServiceMenuService,
    private transactionService: TransactionService,
    private userService: UserService,
    private washerService: WasherService,
    private notificationService: NotificationService,
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
    const saved = await this.bookingRepo.save(booking);

    // Notify washer of new booking
    // Ensure service includes washer.user for userId (serviceRepo.getService loads washer)
    if (service?.washer?.user?.id) {
      await this.notificationService.notifyUser(service.washer.user.id, {
        userId: service.washer.user.id,
        title: 'New booking assigned',
        message: `A new booking has been assigned for service: ${service.name}.`,
      } as any);
    }
    return saved;
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
    const saved = await this.bookingRepo.save(booking);

    // Notify user that washer accepted the booking
    if (saved.user?.id) {
      await this.notificationService.notifyUser(saved.user.id, {
        userId: saved.user.id,
        title: 'Booking accepted',
        message: 'Your booking has been accepted by the washer.',
      } as any);
    }
    return saved;
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
      const saved = await this.bookingRepo.save(booking);
      // Notify user booking completed
      if (saved.user?.id) {
        await this.notificationService.notifyUser(saved.user.id, {
          userId: saved.user.id,
          title: 'Booking completed',
          message: 'Your car wash booking has been marked as completed.',
        } as any);
      }
      return { booking: saved };
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

      if (!transaction) throw new NotFoundException('Transaction not found!');

      booking.paymentReference = transaction.transactionReference;
      await this.bookingRepo.save(booking);

      // const findTrans = await this.transactionService.findByRefrence(
      //   transaction.transactionReference,
      // );
      return { booking, transaction };
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
    if (booking.service.washer.user.id) {
      await this.notificationService.notifyUser(
        booking.service.washer.user.id,
        {
          userId: booking.service.washer.user.id,
          title: 'Booking Cancelled',
          message: `Booking for ${booking.car?.model ?? 'car'} on ${booking.scheduledTime} was cancelled by the user.`,
          type: 'booking',
        },
      );
    }

    // Notify admins of cancellation (ops visibility)
    await this.notificationService.notifyAdmins(
      'Booking cancelled',
      `User ${booking.user?.name ?? booking.user?.id} cancelled booking #${booking.id}.`,
    );

    return booking;
  }

  async getAllBooking() {
    const bookings = await this.bookingRepo.find({
      relations: ['user', 'service', 'service.washer', 'service.washer.user'],
      select: {
        id: true,
        scheduledTime: true,
        status: true,
        paymentStatus: true,
        washerResponse: true,
        paymentReference: true,
        user: {
          id: true,
          name: true,
          email: true,
        },
        service: {
          id: true,
          name: true,
          price: true,
          washer: {
            id: true,
            user: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      order: { scheduledTime: 'DESC' },
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

  // Get washer's bookings with filtering and pagination
  async getWasherBookings(
    washerUserId: number,
    options: {
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('service.washer', 'washer')
      .leftJoinAndSelect('washer.user', 'washerUser')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.car', 'car')
      .where('washerUser.id = :washerUserId', { washerUserId });

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    const [bookings, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('booking.scheduledTime', 'DESC')
      .getManyAndCount();

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single booking by ID with proper authorization
  async getBookingById(bookingId: number, user: any) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: [
        'user',
        'car',
        'service',
        'service.washer',
        'service.washer.user',
      ],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if user has access to this booking
    if (user.role === 'user' && booking.user.id !== user.userId) {
      throw new ForbiddenException('Access denied to this booking');
    }

    if (
      user.role === 'washer' &&
      (!booking.service.washer ||
        booking.service.washer.user.id !== user.userId)
    ) {
      throw new ForbiddenException('Access denied to this booking');
    }

    return { booking };
  }

  // Get booking statistics for admin
  async getBookingStats(options: { startDate?: Date; endDate?: Date }) {
    const { startDate, endDate } = options;

    let whereClause = {};
    if (startDate && endDate) {
      whereClause = {
        scheduledTime: Between(startDate, endDate),
      };
    }

    const [
      totalBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
    ] = await Promise.all([
      this.bookingRepo.count({ where: whereClause }),
      this.bookingRepo.count({
        where: { ...whereClause, status: 'pending' },
      }),
      this.bookingRepo.count({
        where: { ...whereClause, status: 'completed' },
      }),
      this.bookingRepo.count({
        where: { ...whereClause, status: 'cancelled' },
      }),
    ]);

    // Get revenue data
    const revenueData = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.service', 'service')
      .select('SUM(service.price)', 'totalRevenue')
      .where('booking.status = :status', { status: 'completed' })
      .andWhere(
        startDate && endDate
          ? 'booking.scheduledTime BETWEEN :startDate AND :endDate'
          : '1=1',
        {
          startDate,
          endDate,
        },
      )
      .getRawOne();

    return {
      overview: {
        totalBookings,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        completionRate:
          totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
      },
      revenue: {
        totalRevenue: parseFloat(revenueData?.totalRevenue || '0'),
        averageRevenue:
          completedBookings > 0
            ? parseFloat(revenueData?.totalRevenue || '0') / completedBookings
            : 0,
      },
      period: {
        startDate,
        endDate,
      },
    };
  }

  // Search and filter bookings
  async searchBookings(options: {
    status?: string;
    paymentStatus?: string;
    startDate?: Date;
    endDate?: Date;
    userId?: number;
    washerId?: number;
    page?: number;
    limit?: number;
  }) {
    const {
      status,
      paymentStatus,
      startDate,
      endDate,
      userId,
      washerId,
      page = 1,
      limit = 10,
    } = options;

    const skip = (page - 1) * limit;
    const queryBuilder = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.car', 'car')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('service.washer', 'washer')
      .leftJoinAndSelect('washer.user', 'washerUser');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('booking.paymentStatus = :paymentStatus', {
        paymentStatus,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'booking.scheduledTime BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    if (washerId) {
      queryBuilder.andWhere('washer.id = :washerId', { washerId });
    }

    const [bookings, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('booking.scheduledTime', 'DESC')
      .getManyAndCount();

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        status,
        paymentStatus,
        startDate,
        endDate,
        userId,
        washerId,
      },
    };
  }

  // Assign washer to booking (admin function)
  async assignWasher(bookingId: number, washerId: number) {
    const [booking, washer] = await Promise.all([
      this.bookingRepo.findOne({
        where: { id: bookingId },
        relations: ['service'],
      }),
      this.washerService.getWasherById(washerId),
    ]);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (!washer) {
      throw new NotFoundException('Washer not found');
    }

    if (washer.kycStatus !== 'approved') {
      throw new BadRequestException('Washer is not approved');
    }

    if (!washer.isAvailable) {
      throw new BadRequestException('Washer is not available');
    }

    // Update the service to assign the washer
    (booking.service as any).washer = washer;
    await this.bookingRepo.save(booking);

    return {
      message: 'Washer assigned successfully',
      booking,
    };
  }

  // Get booking history with detailed information
  async getBookingHistory(
    userId: number,
    options: {
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('service.washer', 'washer')
      .leftJoinAndSelect('washer.user', 'washerUser')
      .leftJoinAndSelect('booking.car', 'car')
      .where('booking.user.id = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    const [bookings, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('booking.scheduledTime', 'DESC')
      .getManyAndCount();

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get booking analytics for dashboard
  async getBookingAnalytics(userId: number, userRole: string) {
    if (userRole === 'user') {
      return this.getUserBookingAnalytics(userId);
    } else if (userRole === 'washer') {
      return this.getWasherBookingAnalytics(userId);
    } else if (userRole === 'admin') {
      return this.getAdminBookingAnalytics();
    }

    throw new BadRequestException('Invalid user role');
  }

  private async getUserBookingAnalytics(userId: number) {
    const [totalBookings, completedBookings, cancelledBookings] =
      await Promise.all([
        this.bookingRepo.count({ where: { user: { id: userId } } }),
        this.bookingRepo.count({
          where: { user: { id: userId }, status: 'completed' },
        }),
        this.bookingRepo.count({
          where: { user: { id: userId }, status: 'cancelled' },
        }),
      ]);

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      completionRate:
        totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
      cancellationRate:
        totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
    };
  }

  private async getWasherBookingAnalytics(washerUserId: number) {
    // Use query builder for complex relations
    const totalBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.service', 'service')
      .leftJoin('service.washer', 'washer')
      .leftJoin('washer.user', 'washerUser')
      .where('washerUser.id = :washerUserId', { washerUserId })
      .getCount();

    const completedBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.service', 'service')
      .leftJoin('service.washer', 'washer')
      .leftJoin('washer.user', 'washerUser')
      .where('washerUser.id = :washerUserId', { washerUserId })
      .andWhere('booking.status = :status', { status: 'completed' })
      .getCount();

    const acceptedBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.service', 'service')
      .leftJoin('service.washer', 'washer')
      .leftJoin('washer.user', 'washerUser')
      .where('washerUser.id = :washerUserId', { washerUserId })
      .andWhere('booking.status = :status', { status: 'accepted' })
      .getCount();

    return {
      totalBookings,
      completedBookings,
      acceptedBookings,
      completionRate:
        totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
      acceptanceRate:
        totalBookings > 0 ? (acceptedBookings / totalBookings) * 100 : 0,
    };
  }

  async canUserReviewBooking(
    userId: number,
    bookingId: number,
  ): Promise<boolean> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['user', 'review'],
    });

    if (!booking) {
      return false;
    }

    // Check if booking belongs to user
    if (booking.user.id !== userId) {
      return false;
    }

    // Check if booking is completed and paid
    if (
      booking.status !== 'completed' ||
      booking.paymentStatus !== 'authorized'
    ) {
      return false;
    }

    // Check if review already exists
    if (booking.review) {
      return false;
    }

    return true;
  }

  private async getAdminBookingAnalytics() {
    const [totalBookings, pendingBookings, completedBookings, revenue] =
      await Promise.all([
        this.bookingRepo.count(),
        this.bookingRepo.count({ where: { status: 'pending' } }),
        this.bookingRepo.count({ where: { status: 'completed' } }),
        this.bookingRepo
          .createQueryBuilder('booking')
          .leftJoin('booking.service', 'service')
          .select('SUM(service.price)', 'totalRevenue')
          .where('booking.status = :status', { status: 'completed' })
          .getRawOne(),
      ]);

    return {
      totalBookings,
      pendingBookings,
      completedBookings,
      totalRevenue: parseFloat(revenue?.totalRevenue || '0'),
      completionRate:
        totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
    };
  }
}

// // Update booking status (user-initiated)
// async updateBookingStatus(
//   bookingId: number,
//   userId: number,
//   updateStatusDto: { status: any; reason?: string },
// ) {
//   const booking = await this.bookingRepo.findOne({
//     where: { id: bookingId },
//     relations: ['user'],
//   });

//   if (!booking) {
//     throw new NotFoundException('Booking not found');
//   }

//   if (booking.user.id !== userId) {
//     throw new ForbiddenException('Not your booking');
//   }

//   // Validate status transition
//   const allowedTransitions = {
//     assigned: ['cancelled'],
//     accepted: ['cancelled'],
//     'in-progress': ['cancelled'],
//   };

//   if (!allowedTransitions[booking.status]?.includes(updateStatusDto.status)) {
//     throw new BadRequestException(
//       `Cannot change status from ${booking.status} to ${updateStatusDto.status}`,
//     );
//   }

//   booking.status = updateStatusDto.status;
//   await this.bookingRepo.save(booking);

//   return {
//     message: 'Booking status updated successfully',
//     booking,
//   };
// }

// // Reschedule booking
// async rescheduleBooking(
//   bookingId: number,
//   userId: number,
//   newScheduledTime: Date,
// ) {
//   const booking = await this.bookingRepo.findOne({
//     where: { id: bookingId },
//     relations: ['user'],
//   });

//   if (!booking) {
//     throw new NotFoundException('Booking not found');
//   }

//   if (booking.user.id !== userId) {
//     throw new ForbiddenException('Not your booking');
//   }

//   if (!['assigned', 'accepted'].includes(booking.status)) {
//     throw new BadRequestException('Cannot reschedule booking at this stage');
//   }

//   // Check if new time is in the future
//   if (newScheduledTime <= new Date()) {
//     throw new BadRequestException('New scheduled time must be in the future');
//   }

//   // Check for conflicts with other bookings
//   const conflictingBooking = await this.bookingRepo.findOne({
//     where: {
//       car: { id: booking.car.id },
//       status: In(['assigned', 'accepted', 'in-progress']),
//       id: bookingId,
//     },
//   });

//   if (conflictingBooking) {
//     throw new ConflictException('Car has conflicting booking at this time');
//   }

//   booking.scheduledTime = newScheduledTime;
//   await this.bookingRepo.save(booking);

//   return {
//     message: 'Booking rescheduled successfully',
//     booking,
//   };
// }

// // Get available time slots for a specific date and service
// async getAvailableSlots(options: {
//   date: Date;
//   serviceId: number;
//   latitude: number;
//   longitude: number;
// }) {
//   const { date, serviceId, latitude, longitude } = options;

//   // Get the service to check washer availability
//   const service = await this.serviceRepo.getService(serviceId);
//   if (!service) {
//     throw new NotFoundException('Service not found');
//   }

//   // Get all washers for this service within reasonable distance
//   const washers = await this.washerService.findNearbyWashersWithServices(
//     latitude,
//     longitude,
//     10, // 10km radius
//   );

//   // Generate time slots (9 AM to 6 PM, 1-hour intervals)
//   const timeSlots: Array<{
//     time: Date;
//     available: boolean;
//     availableWashers: number;
//   }> = [];
//   const startHour = 9;
//   const endHour = 18;

//   for (let hour = startHour; hour < endHour; hour++) {
//     const slotTime = new Date(date);
//     slotTime.setHours(hour, 0, 0, 0);

//     // Check if slot is available (not too close to current time)
//     if (slotTime > new Date(Date.now() + 2 * 60 * 60 * 1000)) {
//       // 2 hours from now
//       timeSlots.push({
//         time: slotTime,
//         available: true,
//         availableWashers: washers.length,
//       });
//     }
//   }

//   return {
//     date,
//     serviceId,
//     timeSlots,
//     totalWashers: washers.length,
//   };
// }

//  // Create dispute for booking
//  async createDispute(
//   bookingId: number,
//   userId: number,
//   disputeDto: { reason: string; description: string },
// ) {
//   const booking = await this.bookingRepo.findOne({
//     where: { id: bookingId },
//     relations: ['user', 'service', 'service.washer'],
//   });

//   if (!booking) {
//     throw new NotFoundException('Booking not found');
//   }

//   // Check if user has access to this booking
//   const user = await this.userService.findById(userId);
//   if (!user) {
//     throw new NotFoundException('User not found');
//   }

//   if (user.role === 'user' && booking.user.id !== userId) {
//     throw new ForbiddenException('Not your booking');
//   }

//   if (
//     user.role === 'washer' &&
//     (!booking.service.washer || booking.service.washer.user.id !== userId)
//   ) {
//     throw new ForbiddenException('Not your booking');
//   }

//   // Update booking status to dispute
//   (booking as any).status = 'dispute' as any;
//   await this.bookingRepo.save(booking);

//   // TODO: Create dispute record in separate dispute entity
//   // For now, return the updated booking
//   return {
//     message: 'Dispute created successfully',
//     booking,
//     dispute: {
//       reason: disputeDto.reason,
//       description: disputeDto.description,
//       createdBy: userId,
//       createdAt: new Date(),
//     },
//   };
// }

// // Bulk assign washers to multiple bookings
// async bulkAssignWashers(bookingIds: number[], washerId: number) {
//   const washer = await this.washerService.getWasherById(washerId);
//   if (!washer) {
//     throw new NotFoundException('Washer not found');
//   }

//   if (washer.kycStatus !== 'approved') {
//     throw new BadRequestException('Washer is not approved');
//   }

//   const results: Array<{
//     bookingId: number;
//     success: boolean;
//     result: any;
//   }> = [];
//   const errors: Array<{
//     bookingId: number;
//     success: boolean;
//     error: any;
//   }> = [];

//   for (const bookingId of bookingIds) {
//     try {
//       const result = await this.assignWasher(bookingId, washerId);
//       results.push({ bookingId, success: true, result });
//     } catch (error) {
//       errors.push({ bookingId, success: false, error: error.message });
//     }
//   }

//   return {
//     message: `Bulk assignment completed. ${results.length} successful, ${errors.length} failed.`,
//     results,
//     errors,
//     summary: {
//       total: bookingIds.length,
//       successful: results.length,
//       failed: errors.length,
//     },
//   };
// }

// // Get upcoming bookings for a user
// async getUpcomingBookings(userId: number) {
//   const upcomingBookings = await this.bookingRepo.find({
//     where: {
//       user: { id: userId },
//       status: In(['assigned', 'accepted', 'in-progress']),
//       scheduledTime: Between(
//         new Date(),
//         new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       ), // Next 7 days
//     },
//     relations: ['service', 'service.washer', 'car'],
//     order: { scheduledTime: 'ASC' },
//   });

//   return {
//     upcomingBookings,
//     count: upcomingBookings.length,
//   };
// }
