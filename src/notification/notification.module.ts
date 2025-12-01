import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { NotificationController } from './notification.controller';
import { Notification } from './entities/notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { firebaseAdminProvider } from './firebase-admin.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), forwardRef(() => UserModule), ConfigModule],
  controllers: [NotificationController],
  providers: [NotificationService, firebaseAdminProvider, EmailService],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {}
