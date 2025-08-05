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

  @Roles('admin')
  @Get('approve/:id')
  approveWasher(@Param('id') id: number) {
    return this.washerService.approveWasher(id);
  }

  @Roles('admin')
  @Get('reject/:id')
  rejectWasher(@Param('id') id: number) {
    return this.washerService.rejectWasher(id);
  }
}
