import { Module } from '@nestjs/common';
import { CarService } from './car.service';
import { CarController } from './car.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Car } from './entities/car.entity';
import { UserModule } from '../user/user.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Car]), UserModule],
  controllers: [CarController],
  providers: [CarService, CloudinaryService],
  exports: [CarService],
})
export class CarModule {}
