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
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('create')
  createBooking(@Req() req: any, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.createBooking(req.user.userId, createBookingDto);
  }

  @Patch('accept/:id')
  acceptBooking(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.washerAcceptBooking(+bookingId, req.user.userId);
  }

  @Patch('decline/:id')
  declineBooking(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.washerDeclineBooking(
      +bookingId,
      req.user.userId,
    );
  }

  @Patch('completed/:id')
  completeBooking(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.completeBooking(+bookingId, req.user.userId);
  }

  @Patch('approve/:id')
  approveBooking(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.approveBooking(+bookingId, req.user.userId);
  }

  @Patch('verify')
  async verifyPayment(@Query('payload') payload: string) {
    return await this.bookingService.verifyPayment(payload);
  }

  @Patch('cancel/:id')
  cancelBooking(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.cancelBooking(+bookingId, req.user.userId);
  }

  @Get('all')
  getAllBoooking() {
    return this.bookingService.getAllBooking();
  }

  @Get('myBooking')
  getMyBooking(@Req() req: any) {
    return this.bookingService.getUserBooking(req.user.userId);
  }
}

// @Get('verify')
// async verifyPayment(@Query('payload') payload: string) {
//   return await this.bookingService.verifyPayment(payload);
// }
