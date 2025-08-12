import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { sendNotificationDTO } from './dto/send-notification.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  sendNotification(@Body() pushNotification: any) {
    console.log('hello=>>', pushNotification);

    return this.notificationService.sendPush(pushNotification);
  }

  @Get()
  sendme(@Body() dto: any) {
    return dto;
  }
}
