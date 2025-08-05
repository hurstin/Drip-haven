import { Module } from '@nestjs/common';
import { WasherService } from './washer.service';
import { WasherController } from './washer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Washer } from './entities/washer.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Washer]), UserModule],
  controllers: [WasherController],
  providers: [WasherService],
})
export class WasherModule {}
