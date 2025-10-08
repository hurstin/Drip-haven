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
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Washers')
@Controller('washers')
export class WasherController {
  constructor(private readonly washerService: WasherService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register current user as washer (submit KYC)' })
  @ApiOkResponse({ description: 'Washer registration submitted' })
  @ApiBadRequestResponse({ description: 'Already a washer or invalid data' })
  registerWasher(@Request() req: any, @Body() Body: any) {
    return this.washerService.registerAsWasher(req.user.userId, Body);
  }

  @Roles('washer')
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current washer profile' })
  @ApiOkResponse({ description: 'Washer profile retrieved' })
  getWasherProfile(@Request() req: any) {
    return this.washerService.getWasherById(req.user.userId);
  }

  @Get('allWashers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all washers (Admin)' })
  @ApiOkResponse({ description: 'Washers retrieved' })
  @Roles('admin')
  getAllWasher() {
    return this.washerService.getAllWasher();
  }

  @Roles('admin')
  @Get('approve/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve washer KYC (Admin)' })
  @ApiParam({ name: 'id', type: 'number', example: 5, description: 'User ID' })
  @ApiOkResponse({ description: 'Washer approved' })
  approveWasher(@Param('id') userId: number) {
    return this.washerService.approveWasher(userId);
  }

  @Roles('admin')
  @Get('reject/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject washer KYC (Admin)' })
  @ApiParam({ name: 'id', type: 'number', example: 5, description: 'User ID' })
  @ApiOkResponse({ description: 'Washer rejected' })
  rejectWasher(@Param('id') userId: number) {
    return this.washerService.rejectWasher(userId);
  }

  @Patch()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current washer profile' })
  @ApiOkResponse({ description: 'Washer profile updated' })
  updateWasher(@Req() req: any, @Body() body: any) {
    return this.washerService.updateWasherProfile(req.user.userId, body);
  }

  @Get('nearby-services')
  @ApiOperation({
    summary: 'Find nearby approved washers with active services',
  })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'lng', required: true, description: 'Longitude' })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Radius in km (default 5)',
  })
  @ApiOkResponse({ description: 'Nearby washers returned' })
  @ApiBadRequestResponse({ description: 'Latitude and longitude are required' })
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
