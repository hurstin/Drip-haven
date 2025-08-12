import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MssgStatus, Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import * as firebase from 'firebase-admin';
import { sendNotificationDTO } from './dto/send-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private userService: UserService,
  ) {}

  // store and dispatch notification to one user
  async notifyUser(
    userid: number,
    createNotificationDto: CreateNotificationDto,
  ) {
    const user = await this.userService.findById(userid);

    if (!user) throw new NotFoundException('user not found');

    const notification = this.notificationRepo.create({
      user,
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      // type: createNotificationDto.type,
      status: MssgStatus.UNREAD,
    });
    await this.notificationRepo.save(notification);
  }

  async sendPush(notification: any) {
    try {
      await firebase
        .messaging()
        .send({
          notification: {
            title: notification.title,
            body: notification.body,
          },
          token: notification.deviceId,
          data: {},
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'default',
            },
          },
          apns: {
            headers: {
              'apns-priority': '10',
            },
            payload: {
              aps: {
                contentAvailable: true,
                sound: 'default',
              },
            },
          },
        })
        .catch((error: any) => {
          console.error('from=>', error);
        });
    } catch (error) {
      console.log(error);
      return {
        error,
        mssg: 'hello',
      };
    }
  }
}
