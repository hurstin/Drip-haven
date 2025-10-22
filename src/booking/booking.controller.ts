import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Roles } from '../auth/decorator/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { SearchBookingsDto } from './dto/searchBooking.dto';
import {
  BookingResponseDto,
  BookingsListResponseDto,
  BookingStatsResponseDto,
  BookingAnalyticsResponseDto,
} from './dto/booking-response.dto';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('create')
  @ApiOperation({
    summary: 'Create a new car wash booking',
    description:
      'Create a new booking for car wash service. Users can book services for their registered cars.',
  })
  @ApiBody({
    type: CreateBookingDto,
    description:
      'Booking details including car, service, and scheduling information',
    examples: {
      example1: {
        summary: 'Basic booking',
        value: {
          carId: 1,
          serviceId: 1,
          scheduledTime: '2025-12-15T14:30:00Z',
          latitude: 6.422526,
          longitude: 5.595574,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid booking data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Car already has active booking',
  })
  @Roles('user', 'admin')
  createBooking(@Req() req: any, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.createBooking(req.user.userId, createBookingDto);
  }

  @Patch('accept/:id')
  @ApiOperation({
    summary: 'Accept a booking (Washer)',
    description:
      'Washer accepts a booking assignment. This changes the booking status to accepted.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking accepted successfully',
    schema: {
      example: {
        id: 1,
        status: 'accepted',
        washerResponse: 'accepted',
        message: 'Booking accepted successfully',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not your booking or insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Booking not awaiting washer response',
  })
  @Roles('washer')
  acceptBooking(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.washerAcceptBooking(+bookingId, req.user.userId);
  }

  @Patch('decline/:id')
  @ApiOperation({
    summary: 'Decline a booking (Washer)',
    description:
      'Washer declines a booking assignment. This changes the booking status to declined.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking declined successfully',
    schema: {
      example: {
        id: 1,
        status: 'declined',
        washerResponse: 'declined',
        message: 'Booking declined successfully',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not your booking or insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Booking not awaiting washer response',
  })
  @Roles('washer')
  declineBooking(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.washerDeclineBooking(
      +bookingId,
      req.user.userId,
    );
  }

  @Patch('completed/:id')
  @ApiOperation({
    summary: 'Mark booking as completed (Washer)',
    description:
      'Washer marks a booking as completed after finishing the service.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking marked as completed',
    schema: {
      example: {
        id: 1,
        status: 'completed',
        message: 'Service completed successfully',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not your booking or insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Cannot complete booking at current status',
  })
  @Roles('washer')
  completeBooking(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.completeBooking(+bookingId, req.user.userId);
  }

  @Patch('approve/:id')
  @ApiOperation({
    summary: 'Approve completed service (User)',
    description:
      'User approves the completed service, confirming satisfaction with the work.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Service approved successfully',
    schema: {
      example: {
        id: 1,
        status: 'payment processing',
        message: 'Service approved and payment processed',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not your booking or insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Cannot approve booking at current status',
  })
  @Roles('user')
  approveBooking(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.approveBooking(+bookingId, req.user.userId);
  }

  @Patch('verify')
  @ApiOperation({
    summary: 'Verify payment',
    description: 'Verify payment for a booking using the payment payload.',
  })
  @ApiQuery({
    name: 'payload',
    description: 'Payment verification payload',
    example: 'wxi8emcmhx',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment verified successfully',
    schema: {
      example: {
        message: 'Payment verified successfully',
        booking: {
          id: 9,
          scheduledTime: '2025-12-15T14:30:00.000Z',
          status: 'paid',
          paymentStatus: 'authorized',
          paymentReference: 'wxi8emcmhx',
          latitude: 6.422526,
          longitude: 5.595574,
          washerResponse: 'accepted',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid payload',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @Roles('user')
  async verifyPayment(@Query('payload') payload: string) {
    return await this.bookingService.verifyPayment(payload);
  }

  @Patch('cancel/:id')
  @ApiOperation({
    summary: 'Cancel a booking (User)',
    description:
      'User cancels an existing booking. Only possible for certain booking statuses.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully',
    schema: {
      example: {
        id: 1,
        status: 'cancelled',
        message: 'Booking cancelled successfully',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not your booking or insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Cannot cancel booking at current status',
  })
  @Roles('user')
  cancelBooking(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.cancelBooking(+bookingId, req.user.userId);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Get all bookings (Admin)',
    description: 'Retrieve all bookings in the system. Admin only endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'All bookings retrieved successfully',
    type: BookingsListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'No bookings found',
  })
  @Roles('admin')
  getAllBoooking() {
    return this.bookingService.getAllBooking();
  }

  @Get('myBooking')
  @ApiOperation({
    summary: 'Get user bookings',
    description: 'Retrieve all bookings for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User bookings retrieved successfully',
    type: BookingsListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'No bookings found for user',
  })
  @Roles('user')
  getMyBooking(@Req() req: any) {
    return this.bookingService.getUserBooking(req.user.userId);
  }

  @Get('washer/bookings')
  @ApiOperation({
    summary: 'Get washer bookings',
    description:
      'Retrieve all bookings assigned to the authenticated washer with filtering and pagination.',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by booking status',
    required: false,
    example: 'accepted',
    enum: [
      'pending',
      'assigned',
      'accepted',
      'in-progress',
      'completed',
      'cancelled',
    ],
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    example: 1,
    type: 'integer',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    example: 10,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Washer bookings retrieved successfully',
    type: BookingsListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Washer access required',
  })
  @Roles('washer')
  async getWasherBookings(@Req() req: any, @Query() query: any) {
    const { status, page = 1, limit = 10 } = query;
    return this.bookingService.getWasherBookings(req.user.userId, {
      status,
      page: +page,
      limit: +limit,
    });
  }

  @Get('stats/overview')
  @ApiOperation({
    summary: 'Get booking statistics (Admin)',
    description:
      'Retrieve comprehensive booking statistics and revenue data for admin dashboard.',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for statistics (ISO date string)',
    required: false,
    example: '2024-01-01',
    type: 'string',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for statistics (ISO date string)',
    required: false,
    example: '2024-01-31',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: BookingStatsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @Roles('admin')
  async getBookingStats(@Query() query: any) {
    const { startDate, endDate } = query;
    return this.bookingService.getBookingStats({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search and filter bookings (Admin)',
    description:
      'Advanced search and filtering for bookings with pagination support.',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by booking status',
    required: false,
    example: 'completed',
    enum: [
      'pending',
      'assigned',
      'accepted',
      'in-progress',
      'completed',
      'cancelled',
    ],
  })
  @ApiQuery({
    name: 'paymentStatus',
    description: 'Filter by payment status',
    required: false,
    example: 'captured',
    enum: ['none', 'authorized', 'captured', 'refunded', 'failed'],
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date filter (ISO date string)',
    required: false,
    example: '2024-01-01',
    type: 'string',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date filter (ISO date string)',
    required: false,
    example: '2024-01-31',
    type: 'string',
  })
  @ApiQuery({
    name: 'userId',
    description: 'Filter by user ID',
    required: false,
    example: 1,
    type: 'integer',
  })
  @ApiQuery({
    name: 'washerId',
    description: 'Filter by washer ID',
    required: false,
    example: 2,
    type: 'integer',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    example: 1,
    type: 'integer',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    example: 10,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: BookingsListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @Roles('admin')
  async searchBookings(@Query() query: SearchBookingsDto) {
    const {
      status,
      paymentStatus,
      startDate,
      endDate,
      userId,
      washerId,
      page = 1,
      limit = 10,
    } = query;

    return this.bookingService.searchBookings({
      status,
      paymentStatus,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId: userId ? +userId : undefined,
      washerId: washerId ? +washerId : undefined,
      page: +page,
      limit: +limit,
    });
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get user booking history',
    description:
      'Retrieve detailed booking history for the authenticated user with filtering and pagination.',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by booking status',
    required: false,
    example: 'completed',
    enum: [
      'pending',
      'assigned',
      'accepted',
      'in-progress',
      'completed',
      'cancelled',
    ],
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    example: 1,
    type: 'integer',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    example: 10,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking history retrieved successfully',
    type: BookingsListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'No booking history found',
  })
  @Roles('user')
  async getBookingHistory(@Req() req: any, @Query() query: any) {
    const { status, page = 1, limit = 10 } = query;
    return this.bookingService.getBookingHistory(req.user.userId, {
      status,
      page: +page,
      limit: +limit,
    });
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get booking analytics',
    description:
      'Retrieve role-based booking analytics for dashboard insights.',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
    type: BookingAnalyticsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid user role',
  })
  @Roles('user', 'washer', 'admin')
  async getBookingAnalytics(@Req() req: any) {
    return this.bookingService.getBookingAnalytics(
      req.user.userId,
      req.user.role,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get booking by ID',
    description:
      'Retrieve detailed information about a specific booking with proper authorization.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking details retrieved successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to this booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @Roles('user', 'washer', 'admin')
  async getBookingById(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.getBookingById(+bookingId, req.user);
  }

  @Get(':id/can-review')
  @ApiOperation({
    summary: 'Check if booking can be reviewed',
    description:
      'Check if the current user can create a review for the specified booking.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns whether user can review the booking',
    schema: {
      example: {
        canReview: true,
        reason: 'Booking is completed and paid, no review exists yet',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @Roles('user')
  async canReviewBooking(
    @Param('id') bookingId: string,
    @Req() req: any,
  ): Promise<{ canReview: boolean; reason?: string }> {
    const canReview = await this.bookingService.canUserReviewBooking(
      req.user.userId,
      +bookingId,
    );

    return {
      canReview,
      reason: canReview
        ? 'You can review this booking'
        : 'You cannot review this booking (may be incomplete, unpaid, or already reviewed)',
    };
  }
}

// // Update booking status (user-initiated)
// @Patch(':id/status')
// @Roles('user')
// async updateBookingStatus(
//   @Param('id') bookingId: string,
//   @Body() updateStatusDto: UpdateBookingStatusDto,
//   @Req() req: any,
// ) {
//   return this.bookingService.updateBookingStatus(
//     +bookingId,
//     req.user.userId,
//     updateStatusDto,
//   );
// }

// // Reschedule booking
// @Patch(':id/reschedule')
// @Roles('user')
// async rescheduleBooking(
//   @Param('id') bookingId: string,
//   @Body() rescheduleDto: RescheduleBookingDto,
//   @Req() req: any,
// ) {
//   return this.bookingService.rescheduleBooking(
//     +bookingId,
//     req.user.userId,
//     new Date(rescheduleDto.newScheduledTime),
//   );
// }

// // Assign washer to booking (admin)
// @Patch(':id/assign-washer')
// @Roles('admin')
// async assignWasher(
//   @Param('id') bookingId: string,
//   @Body() assignDto: AssignWasherDto,
//   @Req() req: any,
// ) {
//   return this.bookingService.assignWasher(+bookingId, assignDto.washerId);
// }

// // Create dispute for booking
// @Post(':id/dispute')
// @Roles('user', 'washer')
// async createDispute(
//   @Param('id') bookingId: string,
//   @Body() disputeDto: CreateDisputeDto,
//   @Req() req: any,
// ) {
//   return this.bookingService.createDispute(
//     +bookingId,
//     req.user.userId,
//     disputeDto,
//   );
// }

// Get available time slots for a specific date and service
// @Get('available-slots')
// @Roles('user')
// async getAvailableSlots(@Query() query: any) {
//   const { date, serviceId, latitude, longitude } = query;
//   return this.bookingService.getAvailableSlots({
//     date: new Date(date),
//     serviceId: +serviceId,
//     latitude: +latitude,
//     longitude: +longitude,
//   });
// }

// // Bulk assign washers to multiple bookings
// @Post('bulk/assign-washers')
// @Roles('admin')
// async bulkAssignWashers(@Body() bulkDto: BulkAssignWashersDt) {
//   return this.bookingService.bulkAssignWashers(
//     bulkDto.bookings,
//     bulkDto.washerId,
//   );
// }

// // Get upcoming bookings for a user
// @Get('upcoming')
// @Roles('user')
// async getUpcomingBookings(@Req() req: any) {
//   return this.bookingService.getUpcomingBookings(req.user.userId);
// }
