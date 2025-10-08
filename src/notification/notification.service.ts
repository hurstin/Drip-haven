import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MssgStatus, Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import * as firebase from 'firebase-admin';
import { sendNotificationDTO } from './dto/send-notification.dto';
import { UserRole } from '../user/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private userService: UserService,
  ) {}

  // Create and persist an in-app notification for a single user
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

  // Send a push notification to a specific device using Firebase Admin
  // Expects: { title, body, deviceId }
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

  // Retrieve all notifications for a user ordered by newest first
  async listUserNotifications(userId: number) {
    return this.notificationRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  // Get the count of unread notifications for a user
  async unreadCount(userId: number) {
    const count = await this.notificationRepo.count({
      where: { user: { id: userId }, status: MssgStatus.UNREAD },
    });
    return { count };
  }

  // Mark a single notification as read for the given user
  async markAsRead(userId: number, notificationId: number) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, user: { id: userId } },
    });
    if (!notification) throw new NotFoundException('notification not found');
    notification.status = MssgStatus.READ;
    return this.notificationRepo.save(notification);
  }

  // Mark all unread notifications as read for the given user
  async markAllAsRead(userId: number) {
    await this.notificationRepo.update(
      { user: { id: userId }, status: MssgStatus.UNREAD },
      { status: MssgStatus.READ },
    );
    return { success: true };
  }

  // Notify all admins (helper used by other modules)
  async notifyAdmins(title: string, message: string) {
    if (!('findByRole' in this.userService)) return;
    // @ts-ignore optional method in userService
    const admins = await this.userService.findByRole(UserRole.ADMIN);
    if (!admins?.length) return;

    await Promise.all(
      admins.map((admin: any) =>
        this.notifyUser(admin.id, {
          userId: admin.id,
          title,
          message,
        } as any),
      ),
    );
  }
}
