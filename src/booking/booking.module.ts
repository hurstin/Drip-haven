import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { CarModule } from 'src/car/car.module';
import { ServiceMenuModule } from 'src/service-menu/service-menu.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), CarModule, ServiceMenuModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
