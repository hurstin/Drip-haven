import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
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
}
