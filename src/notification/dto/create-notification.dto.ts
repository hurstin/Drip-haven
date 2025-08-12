// src/notification/dto/create-notification.dto.ts
import { IsInt, IsString, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  userId: number;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  type?: string;
}
