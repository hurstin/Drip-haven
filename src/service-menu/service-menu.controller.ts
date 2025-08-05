import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceMenuService } from './service-menu.service';
import { CreateServiceMenuDto } from './dto/create-service-menu.dto';
import { UpdateServiceMenuDto } from './dto/update-service-menu.dto';

@Controller('service-menu')
export class ServiceMenuController {
  constructor(private readonly serviceMenuService: ServiceMenuService) {}

  @Post()
  create(@Body() createServiceMenuDto: CreateServiceMenuDto) {
    return this.serviceMenuService.create(createServiceMenuDto);
  }

  @Get()
  findAll() {
    return this.serviceMenuService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceMenuService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceMenuDto: UpdateServiceMenuDto) {
    return this.serviceMenuService.update(+id, updateServiceMenuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceMenuService.remove(+id);
  }
}
