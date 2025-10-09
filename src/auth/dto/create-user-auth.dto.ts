import {
  Equals,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../user/entities/user.entity';
import { Match } from '../decorator/match.decorator';
export class CreateUserDto {
  @ApiProperty({ description: 'Name of user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Valid email of user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'user role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ description: 'password' })
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'password confirm' })
  @IsNotEmpty()
  @Match('password', { message: 'Password and confirm password do not match' })
  passwordConfirm: string;
  // @Equals('password', { message: 'Password and confirm password do not match' })
  // passwordConfirm: string;
}
