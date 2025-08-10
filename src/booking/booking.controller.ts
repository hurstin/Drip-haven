import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
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

  @Get('accept/:id')
  acceptBooking(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.washerAcceptBooking(+bookingId, req.user.userId);
  }

  @Get('decline/:id')
  declineBooking(@Param('id') bookingId: string, @Req() req: any) {
    return this.bookingService.washerDeclineBooking(
      +bookingId,
      req.user.userId,
    );
  }
}
