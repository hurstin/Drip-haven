import { Module } from '@nestjs/common';
import { WasherService } from './washer.service';
import { WasherController } from './washer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Washer } from './entities/washer.entity';
import { UserModule } from 'src/user/user.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Washer]), UserModule, NotificationModule],
  controllers: [WasherController],
  providers: [WasherService],
  exports: [WasherService],
})
export class WasherModule {}
