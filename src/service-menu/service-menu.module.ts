import { Module } from '@nestjs/common';
import { ServiceMenuService } from './service-menu.service';
import { ServiceMenuController } from './service-menu.controller';

@Module({
  controllers: [ServiceMenuController],
  providers: [ServiceMenuService],
})
export class ServiceMenuModule {}
