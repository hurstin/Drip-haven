import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  HttpCode,
} from '@nestjs/common';
import { CarService } from './car.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

@Controller('car')
export class CarController {
  constructor(private readonly carService: CarService) {}

  @Post('add-car')
  async addCar(@Request() req: any, @Body() createCarDto: CreateCarDto) {
    return this.carService.addCar(req.user.userId, createCarDto);
  }

  @Get()
  getCars(@Request() req: any) {
    return this.carService.getCarsByUser(req.user.userId);
  }

  @Patch('update-car/:id')
  updateCar(
    @Param('id') carId: number,
    @Request() req: any,
    @Body() updateCarDto: UpdateCarDto,
  ) {
    return this.carService.updateCar(carId, req.user.userId, updateCarDto);
  }

  @Delete('delete/:id')
  @HttpCode(204)
  deleteCar(@Param('id') carId: number, @Request() req: any) {
    return this.carService.deleteCar(carId, req.user.userId);
  }
}
