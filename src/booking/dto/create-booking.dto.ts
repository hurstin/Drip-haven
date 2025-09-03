// src/booking/dto/create-booking.dto.ts
import {
  IsInt,
  IsDateString,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID of the car to be washed',
    example: 1,
    minimum: 1,
    type: 'integer',
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  carId: number;

  @ApiProperty({
    description: 'ID of the car wash service to book',
    example: 1,
    minimum: 1,
    type: 'integer',
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  serviceId: number;

  @ApiProperty({
    description:
      'Scheduled date and time for the car wash service (ISO 8601 format)',
    example: '2025-12-15T14:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduledTime: string;

  @ApiProperty({
    description: 'Latitude coordinate for the service location',
    example: 6.422526,
    minimum: -90,
    maximum: 90,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate for the service location',
    example: 5.595574,
    minimum: -180,
    maximum: 180,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  longitude: number;
}
