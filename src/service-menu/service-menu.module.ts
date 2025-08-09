import { Module } from '@nestjs/common';
import { ServiceMenuService } from './service-menu.service';
import { ServiceMenuController } from './service-menu.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceMenu } from './entities/service-menu.entity';
import { WasherModule } from 'src/washer/washer.module';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceMenu]), WasherModule],
  controllers: [ServiceMenuController],
  providers: [ServiceMenuService],
  exports: [ServiceMenuService],
})
export class ServiceMenuModule {}
