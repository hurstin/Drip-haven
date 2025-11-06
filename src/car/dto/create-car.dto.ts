import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CarType } from '../entities/car.entity';

export class CreateCarDto {
  @ApiProperty()
  @IsString()
  make: string;

  @ApiProperty()
  @IsString()
  model: string;

  @ApiProperty()
  @IsString()
  color: string;

  @ApiProperty()
  @IsString()
  plateNumber: string;

  @ApiPropertyOptional({ enum: CarType, description: 'Type/class of car' })
  @IsOptional()
  @IsEnum(CarType)
  type?: CarType;
}
