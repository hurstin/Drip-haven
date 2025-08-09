import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { WasherService } from './washer.service';
import { CreateWasherDto } from './dto/create-washer.dto';
import { UpdateWasherDto } from './dto/update-washer.dto';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';

@Controller('washer')
export class WasherController {
  constructor(private readonly washerService: WasherService) {}

  @Post()
  registerWasher(@Request() req: any, @Body() Body: any) {
    return this.washerService.registerAsWasher(req.user.userId, Body);
  }

  @Roles('washer')
  @Get('profile')
  getWasherProfile(@Request() req: any) {
    return this.washerService.getWasherById(req.user.userId);
  }

  // @Roles('admin')
  @Get('allWashers')
  getAllWasher() {
    return this.washerService.getAllWasher();
  }

  @Roles('admin')
  @Get('approve/:id')
  approveWasher(@Param('id') userId: number) {
    return this.washerService.approveWasher(userId);
  }

  @Roles('admin')
  @Get('reject/:id')
  rejectWasher(@Param('id') userId: number) {
    return this.washerService.rejectWasher(userId);
  }

  @Patch()
  updateWasher(@Req() req: any, @Body() body: any) {
    return this.washerService.updateWasherProfile(req.user.userId, body);
  }

  @Get('nearby-services')
  async getNearbyWashersWithService(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    if (!lat || !lng) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    const radiusKm = radius ? parseFloat(radius) : 5;

    return this.washerService.findNearbyWashersWithServices(
      parseFloat(lat),
      parseFloat(lng),
      radiusKm,
    );
  }
}
