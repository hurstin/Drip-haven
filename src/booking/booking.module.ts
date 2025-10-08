import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { CarModule } from '../car/car.module';
import { ServiceMenuModule } from '../service-menu/service-menu.module';
import { TransactionModule } from '../transaction/transaction.module';
import { UserModule } from '../user/user.module';
import { WasherModule } from 'src/washer/washer.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    CarModule,
    ServiceMenuModule,
    TransactionModule,
    UserModule,
    WasherModule,
    NotificationModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
