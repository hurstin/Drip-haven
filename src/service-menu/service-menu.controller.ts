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
  HttpCode,
} from '@nestjs/common';
import { ServiceMenuService } from './service-menu.service';
import { CreateServiceMenuDto } from './dto/create-service-menu.dto';
import { UpdateServiceMenuDto } from './dto/update-service-menu.dto';
import { SetServiceActiveDto } from './dto/set-service-active.dto';
import { Roles } from '../auth/decorator/roles.decorator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Services')
@Controller('services')
export class ServiceMenuController {
  constructor(private readonly serviceMenuService: ServiceMenuService) {}

  @Post('create')
  @Roles('washer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service (Washer)' })
  @ApiBody({ type: CreateServiceMenuDto })
  @ApiOkResponse({ description: 'Service created successfully' })
  @ApiBadRequestResponse({
    description: 'Service already exists or invalid data',
  })
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
  // @Roles('admin')
  @ApiOperation({ summary: 'List all services' })
  @ApiOkResponse({ description: 'Services retrieved successfully' })
  listAllServices() {
    return this.serviceMenuService.listAllServices();
  }

  @Get('active')
  @ApiOperation({ summary: 'List all active services' })
  @ApiOkResponse({ description: 'Active services retrieved successfully' })
  listAllActiveServices() {
    return this.serviceMenuService.listAllActiveServices();
  }

  @Get()
  @Roles('washer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my services (Washer)' })
  @ApiOkResponse({ description: 'Services retrieved successfully' })
  listMyServices(@Req() req: any) {
    return this.serviceMenuService.listServices(req.user.userId);
  }

  @Get(':id')
  @Roles('washer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single service (Washer)' })
  @ApiParam({
    name: 'id',
    type: 'number',
    example: 1,
    description: 'Service ID',
  })
  @ApiOkResponse({ description: 'Service retrieved successfully' })
  @ApiBadRequestResponse({ description: 'Service not found' })
  getService(@Param('id', ParseIntPipe) userId: number) {
    return this.serviceMenuService.listServices(userId);
  }

  @Patch('update/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service (Washer)' })
  @ApiParam({
    name: 'id',
    type: 'number',
    example: 1,
    description: 'Service ID',
  })
  @ApiBody({ type: UpdateServiceMenuDto })
  @ApiOkResponse({ description: 'Service updated successfully' })
  @ApiBadRequestResponse({ description: 'Forbidden or invalid data' })
  updateService(
    @Param('id') id: number,
    @Req() req: any,
    @Body() updateServiceDto: UpdateServiceMenuDto,
  ) {
    return this.serviceMenuService.updateService(
      id,
      req.user.userId,
      updateServiceDto,
    );
  }

  @Delete('delete/:id')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a service (Washer)' })
  @ApiParam({
    name: 'id',
    type: 'number',
    example: 1,
    description: 'Service ID',
  })
  @ApiOkResponse({ description: 'Service deleted successfully' })
  @ApiBadRequestResponse({ description: 'Forbidden or not found' })
  deleteService(@Param('id') id: number, @Req() req: any) {
    return this.serviceMenuService.deleteService(id, req.user.userId);
  }

  @Patch(':id/active')
  @Roles('washer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set service active status (Washer)' })
  @ApiParam({
    name: 'id',
    type: 'number',
    example: 1,
    description: 'Service ID',
  })
  @ApiBody({ type: SetServiceActiveDto })
  @ApiOkResponse({ description: 'Service status updated successfully' })
  @ApiBadRequestResponse({ description: 'Forbidden or not found' })
  setActiveStatus(
    @Param('id') id: number,
    @Req() req: any,
    @Body() body: SetServiceActiveDto,
  ) {
    return this.serviceMenuService.setActiveStatus(
      id,
      req.user.userId,
      body.isActive,
    );
  }
}
