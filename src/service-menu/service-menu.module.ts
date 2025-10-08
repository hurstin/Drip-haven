import { Module } from '@nestjs/common';
import { ServiceMenuService } from './service-menu.service';
import { ServiceMenuController } from './service-menu.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceMenu } from './entities/service-menu.entity';
import { WasherModule } from '../washer/washer.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceMenu]),
    WasherModule,
    NotificationModule,
  ],
  controllers: [ServiceMenuController],
  providers: [ServiceMenuService],
  exports: [ServiceMenuService],
})
export class ServiceMenuModule {}
