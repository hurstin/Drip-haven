import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'user role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
