// src/booking/dto/create-booking.dto.ts
import { IsInt, IsDateString, IsNumber } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  carId: number;

  @IsInt()
  serviceId: number;

  @IsDateString()
  scheduledTime: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
