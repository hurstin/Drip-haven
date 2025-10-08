import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceMenuModule } from '../service-menu/service-menu.module';
import { Transaction } from './entities/transaction.entity';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    ServiceMenuModule,
    UserModule,
    ConfigModule,
    NotificationModule,
  ],

  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
