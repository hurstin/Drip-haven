import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { Car } from './entities/car.entity';
import { UserService } from '../user/user.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CarService {
  constructor(
    @InjectRepository(Car) private carRepository: Repository<Car>,
    private userService: UserService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async addCar(userId: number, createCarDto: CreateCarDto): Promise<Car> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // check if a car has same plate number
    if (
      await this.carRepository.findOne({
        where: { plateNumber: createCarDto.plateNumber },
      })
    ) {
      throw new BadRequestException('plate number belongs to another car');
    }

    // Create car instance with proper typing
    const car = this.carRepository.create({
      ...createCarDto,
      user: { id: userId },
    }); // Assign User entity directly

    return this.carRepository.save(car);
  }

  async getCarsByUser(userId: number) {
    const cars = await this.carRepository.find({
      where: { user: { id: userId } },
    });
    if (!cars || cars.length === 0)
      throw new NotFoundException('no car found in collection');

    return cars;
  }

  // get a car
  async getCar(carId: number, userId: number) {
    const car = await this.carRepository.findOne({
      where: {
        id: carId,
        user: { id: userId },
      },
    });
    if (!car) throw new NotFoundException('car not found');

    return car;
  }

  // update a car for a user
  async updateCar(carId: number, userId: number, updateCarDto: UpdateCarDto) {
    const car = await this.carRepository.findOne({
      where: { id: carId, user: { id: userId } },
    });

    if (!car) throw new NotFoundException('car not found');

    // Check if plate number is being updated and if it already exists
    if (
      updateCarDto.plateNumber &&
      updateCarDto.plateNumber !== car.plateNumber
    ) {
      const existingCar = await this.carRepository.findOne({
        where: { plateNumber: updateCarDto.plateNumber },
      });
      if (existingCar) {
        throw new BadRequestException('Plate number belongs to another car');
      }
    }

    // Apply updates to the car entity
    Object.assign(car, updateCarDto);

    return this.carRepository.save(car);
  }

  // delete a car for a user
  async deleteCar(carId: number, userId: number) {
    const car = await this.carRepository.findOne({
      where: { id: carId, user: { id: userId } },
    });

    if (!car) throw new NotFoundException('Car not found');
    return this.carRepository.remove(car);
  }

  // Upload car picture
  async uploadCarPicture(
    carId: number,
    userId: number,
    file: Express.Multer.File,
  ) {
    const car = await this.getCar(carId, userId);

    // Delete old picture if exists
    if (car.picturePublicId) {
      await this.cloudinaryService.deleteImage(car.picturePublicId);
    }

    // Upload new picture
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'car-pictures',
    );

    // Update car with new picture details
    car.pictureUrl = uploadResult.url;
    car.picturePublicId = uploadResult.publicId;

    return this.carRepository.save(car);
  }

  // Remove car picture
  async removeCarPicture(carId: number, userId: number) {
    const car = await this.getCar(carId, userId);

    if (!car.picturePublicId) {
      throw new NotFoundException('Car picture not found');
    }

    // Delete from Cloudinary
    await this.cloudinaryService.deleteImage(car.picturePublicId);

    // Update car profile
    car.pictureUrl = null;
    car.picturePublicId = null;

    return this.carRepository.save(car);
  }
}
