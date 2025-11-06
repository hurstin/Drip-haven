import { ApiProperty } from '@nestjs/swagger';

export class CarResponseDto {
  @ApiProperty({
    description: 'Car ID',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Car make/brand',
    example: 'Toyota',
    type: 'string',
  })
  make: string;

  @ApiProperty({
    description: 'Car model',
    example: 'Camry',
    type: 'string',
  })
  model: string;

  @ApiProperty({
    description: 'Car color',
    example: 'Silver',
    type: 'string',
  })
  color: string;

  @ApiProperty({
    description: 'Car license plate number',
    example: 'ABC123',
    type: 'string',
  })
  plateNumber: string;

  @ApiProperty({
    description: 'Car type',
    example: 'suv',
    required: false,
  })
  type?: string;
}

export class ServiceResponseDto {
  @ApiProperty({
    description: 'Service ID',
    example: 2,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Service name',
    example: 'Premium Wash',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: 'Service price',
    example: 50.0,
    type: 'number',
    format: 'float',
  })
  price: number;

  @ApiProperty({
    description: 'Service description',
    example: 'Complete car wash service including interior cleaning',
    type: 'string',
    required: false,
  })
  description?: string;
}

export class WasherResponseDto {
  @ApiProperty({
    description: 'Washer ID',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Washer KYC status',
    example: 'approved',
    enum: ['pending', 'approved', 'rejected'],
    type: 'string',
  })
  kycStatus: string;

  @ApiProperty({
    description: 'Whether washer is available',
    example: true,
    type: 'boolean',
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Washer latitude coordinate',
    example: 40.7128,
    type: 'number',
    format: 'float',
    required: false,
  })
  latitude?: number;

  @ApiProperty({
    description: 'Washer longitude coordinate',
    example: -74.006,
    type: 'number',
    format: 'float',
    required: false,
  })
  longitude?: number;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: 'User email',
    example: 'john@example.com',
    type: 'string',
    required: false,
  })
  email?: string;
}

export class BookingResponseDto {
  @ApiProperty({
    description: 'Booking ID',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Scheduled date and time for the service',
    example: '2024-01-15T10:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  scheduledTime: Date;

  @ApiProperty({
    description: 'Current booking status',
    example: 'accepted',
    enum: [
      'pending',
      'assigned',
      'accepted',
      'in-progress',
      'completed',
      'cancelled',
    ],
    type: 'string',
  })
  status: string;

  @ApiProperty({
    description: 'Payment status',
    example: 'none',
    enum: ['none', 'authorized', 'captured', 'refunded', 'failed'],
    type: 'string',
  })
  paymentStatus: string;

  @ApiProperty({
    description: 'Payment reference from payment gateway',
    example: 'PAY_REF_123456',
    type: 'string',
    required: false,
  })
  paymentReference?: string;

  @ApiProperty({
    description: 'Service location latitude',
    example: 40.7128,
    type: 'number',
    format: 'float',
    required: false,
  })
  latitude?: number;

  @ApiProperty({
    description: 'Service location longitude',
    example: -74.006,
    type: 'number',
    format: 'float',
    required: false,
  })
  longitude?: number;

  @ApiProperty({
    description: 'Washer response to the booking',
    example: 'accepted',
    enum: ['accepted', 'declined'],
    type: 'string',
    required: false,
  })
  washerResponse?: string;

  @ApiProperty({
    description: 'User who made the booking',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Car to be washed',
    type: CarResponseDto,
  })
  car: CarResponseDto;

  @ApiProperty({
    description: 'Service booked',
    type: ServiceResponseDto,
  })
  service: ServiceResponseDto;

  @ApiProperty({
    description: 'Washer assigned to the booking',
    type: WasherResponseDto,
    required: false,
  })
  washer?: WasherResponseDto;
}

export class PaginationResponseDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
    type: 'integer',
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    type: 'integer',
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 25,
    type: 'integer',
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
    type: 'integer',
  })
  totalPages: number;
}

export class BookingsListResponseDto {
  @ApiProperty({
    description: 'List of bookings',
    type: [BookingResponseDto],
  })
  bookings: BookingResponseDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationResponseDto,
  })
  pagination: PaginationResponseDto;
}

export class BookingStatsResponseDto {
  @ApiProperty({
    description: 'Overview statistics',
    example: {
      totalBookings: 150,
      pendingBookings: 25,
      completedBookings: 120,
      cancelledBookings: 5,
      completionRate: 80.0,
    },
  })
  overview: {
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    completionRate: number;
  };

  @ApiProperty({
    description: 'Revenue statistics',
    example: {
      totalRevenue: 7500.0,
      averageRevenue: 62.5,
    },
  })
  revenue: {
    totalRevenue: number;
    averageRevenue: number;
  };

  @ApiProperty({
    description: 'Statistics period',
    example: {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-31T23:59:59Z',
    },
  })
  period: {
    startDate?: Date;
    endDate?: Date;
  };
}

export class BookingAnalyticsResponseDto {
  @ApiProperty({
    description: 'Total number of bookings',
    example: 25,
    type: 'integer',
  })
  totalBookings: number;

  @ApiProperty({
    description: 'Number of completed bookings',
    example: 20,
    type: 'integer',
  })
  completedBookings: number;

  @ApiProperty({
    description: 'Number of cancelled bookings',
    example: 2,
    type: 'integer',
  })
  cancelledBookings: number;

  @ApiProperty({
    description: 'Booking completion rate as percentage',
    example: 80.0,
    type: 'number',
    format: 'float',
  })
  completionRate: number;

  @ApiProperty({
    description: 'Booking cancellation rate as percentage',
    example: 8.0,
    type: 'number',
    format: 'float',
  })
  cancellationRate: number;
}
