import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { Car } from './entities/car.entity';
import { UserService } from 'src/user/user.service';

@Injectable()
export class CarService {
  constructor(
    @InjectRepository(Car) private carRepository: Repository<Car>,
    private userService: UserService,
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

  // update a car for a user
  async updateCar(carId: number, userId: number, updateCarDto: UpdateCarDto) {
    const car = await this.carRepository.findOne({
      where: { id: carId, user: { id: userId } },
    });

    if (!car) throw new NotFoundException('car not found');

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
}
