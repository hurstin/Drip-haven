import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ServiceMenuService } from './service-menu.service';
import { CreateServiceMenuDto } from './dto/create-service-menu.dto';
import { UpdateServiceMenuDto } from './dto/update-service-menu.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';

@Controller('services')
export class ServiceMenuController {
  constructor(private readonly serviceMenuService: ServiceMenuService) {}

  @Post('create')
  @Roles('washer')
  createService(
    @Req() req: any,
    @Body() createServiceDto: CreateServiceMenuDto,
  ) {
    return this.serviceMenuService.createService(
      req.user.userId,
      createServiceDto,
    );
  } // list all services
  @Get('all')
  @Roles('admin')
  listAllServices() {
    return this.serviceMenuService.listAllServices();
  }

  @Get()
  @Roles('washer')
  listMyServices(@Req() req: any) {
    return this.serviceMenuService.listServices(req.user.userId);
  }

  @Get(':id')
  @Roles('washer')
  getService(@Param('id', ParseIntPipe) userId: number) {
    return this.serviceMenuService.listServices(userId);
  }
}
