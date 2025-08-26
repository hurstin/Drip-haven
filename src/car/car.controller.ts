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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CarService } from './car.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@Controller('car')
@ApiBearerAuth()
export class CarController {
  constructor(private readonly carService: CarService) {}

  @Post('add-car')
  @ApiOperation({
    summary: 'Add a new car',
    description: "Add a new car to the authenticated user's collection",
  })
  @ApiOkResponse({
    description: 'Car added successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        make: { type: 'string', example: 'Toyota' },
        model: { type: 'string', example: 'Camry' },
        color: { type: 'string', example: 'White' },
        plateNumber: { type: 'string', example: 'ABC123' },
        pictureUrl: { type: 'string', nullable: true, example: null },
        picturePublicId: { type: 'string', nullable: true, example: null },
        user: { type: 'object' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Plate number already exists or invalid data',
  })
  async addCar(@Request() req: any, @Body() createCarDto: CreateCarDto) {
    return this.carService.addCar(req.user.userId, createCarDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get user cars',
    description: 'Retrieve all cars belonging to the authenticated user',
  })
  @ApiOkResponse({
    description: 'Cars retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          make: { type: 'string', example: 'Toyota' },
          model: { type: 'string', example: 'Camry' },
          color: { type: 'string', example: 'White' },
          plateNumber: { type: 'string', example: 'ABC123' },
          pictureUrl: { type: 'string', nullable: true, example: null },
          picturePublicId: { type: 'string', nullable: true, example: null },
          user: { type: 'object' },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'No cars found for user',
  })
  getCars(@Request() req: any) {
    return this.carService.getCarsByUser(req.user.userId);
  }

  @Patch('update-car/:id')
  @ApiOperation({
    summary: 'Update car details',
    description:
      'Update details of a specific car belonging to the authenticated user',
  })
  @ApiParam({
    name: 'id',
    description: 'Car ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Car updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        make: { type: 'string', example: 'Toyota' },
        model: { type: 'string', example: 'Camry' },
        color: { type: 'string', example: 'Black' },
        plateNumber: { type: 'string', example: 'XYZ789' },
        pictureUrl: { type: 'string', nullable: true, example: null },
        picturePublicId: { type: 'string', nullable: true, example: null },
        user: { type: 'object' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Car not found, plate number already exists, or invalid data',
  })
  updateCar(
    @Param('id') carId: number,
    @Request() req: any,
    @Body() updateCarDto: UpdateCarDto,
  ) {
    return this.carService.updateCar(carId, req.user.userId, updateCarDto);
  }

  @Delete('delete/:id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete car',
    description: 'Delete a specific car belonging to the authenticated user',
  })
  @ApiParam({
    name: 'id',
    description: 'Car ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Car deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Car not found or deletion failed',
  })
  deleteCar(@Param('id') carId: number, @Request() req: any) {
    return this.carService.deleteCar(carId, req.user.userId);
  }

  @Post('picture/:id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Upload car picture',
    description:
      'Upload a picture for a specific car. Supports JPG, PNG, GIF formats up to 5MB.',
  })
  @ApiParam({
    name: 'id',
    description: 'Car ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Car picture uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        make: { type: 'string', example: 'Toyota' },
        model: { type: 'string', example: 'Camry' },
        color: { type: 'string', example: 'White' },
        plateNumber: { type: 'string', example: 'ABC123' },
        pictureUrl: {
          type: 'string',
          example:
            'https://res.cloudinary.com/example/image/upload/v123/car.jpg',
        },
        picturePublicId: { type: 'string', example: 'car-pictures/abc123' },
        user: { type: 'object' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid file format, file too large, or upload failed',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Car picture file (JPG, PNG, GIF)',
        },
      },
    },
  })
  async uploadCarPicture(
    @Param('id') carId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.carService.uploadCarPicture(carId, req.user.userId, file);
  }

  @Delete('picture/:id')
  @ApiOperation({
    summary: 'Remove car picture',
    description: 'Remove the picture for a specific car',
  })
  @ApiParam({
    name: 'id',
    description: 'Car ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Car picture removed successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        make: { type: 'string', example: 'Toyota' },
        model: { type: 'string', example: 'Camry' },
        color: { type: 'string', example: 'White' },
        plateNumber: { type: 'string', example: 'ABC123' },
        pictureUrl: { type: 'string', example: null },
        picturePublicId: { type: 'string', example: null },
        user: { type: 'object' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Car picture not found or removal failed',
  })
  async removeCarPicture(@Param('id') carId: number, @Request() req: any) {
    return this.carService.removeCarPicture(carId, req.user.userId);
  }
}
