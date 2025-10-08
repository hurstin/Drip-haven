import {
  IsOptional,
  IsInt,
  IsDateString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../../transaction/dto/paystack.dto';

export class SearchBookingsDto {
  @ApiProperty({
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
    type: 'string',
  })
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Filter by payment status',
    required: false,
    example: 'captured',
    enum: PaymentStatus,
    type: 'string',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: string;

  @ApiProperty({
    description: 'Start date for filtering (ISO 8601 format)',
    required: false,
    example: '2024-01-01T00:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiProperty({
    description: 'End date for filtering (ISO 8601 format)',
    required: false,
    example: '2024-01-31T23:59:59Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({
    description: 'Filter by specific user ID',
    required: false,
    example: 1,
    minimum: 1,
    type: 'integer',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  userId?: number;

  @ApiProperty({
    description: 'Filter by specific washer ID',
    required: false,
    example: 2,
    minimum: 1,
    type: 'integer',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  washerId?: number;

  @ApiProperty({
    description: 'Page number for pagination',
    required: false,
    example: 1,
    minimum: 1,
    default: 1,
    type: 'integer',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    type: 'integer',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}
