import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { sendNotificationDTO } from './dto/send-notification.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

// Handles push and in-app notification APIs
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Send a raw push notification to a device token
  @Post('send')
  @ApiOperation({ summary: 'Send a push notification to a device token' })
  @ApiOkResponse({ description: 'Notification queued/sent' })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  sendNotification(@Body() payload: sendNotificationDTO) {
    return this.notificationService.sendPush(payload);
  }

  // Create an in-app notification for a specific user
  @Post('notify/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create in-app notification for a user' })
  @ApiParam({ name: 'userId', type: 'number', example: 1 })
  @ApiOkResponse({ description: 'Notification created' })
  createInApp(
    @Param('userId') userId: number,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationService.notifyUser(Number(userId), dto);
  }

  // List notifications for the authenticated user
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my notifications (latest first)' })
  listMine(@Req() req: any) {
    return this.notificationService.listUserNotifications(req.user.userId);
  }

  // Get unread notifications count for the authenticated user
  @Get('unread-count')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my unread notifications count' })
  unreadCount(@Req() req: any) {
    return this.notificationService.unreadCount(req.user.userId);
  }

  // Mark a specific notification as read
  @Patch(':id/read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', type: 'number', example: 10 })
  markOneAsRead(@Param('id') id: number, @Req() req: any) {
    return this.notificationService.markAsRead(req.user.userId, Number(id));
  }

  // Mark all notifications as read for the authenticated user
  @Patch('read-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAll(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.userId);
  }
}
