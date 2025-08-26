import { IsNotEmpty, IsString } from 'class-validator';

export class sendNotificationDTO {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
