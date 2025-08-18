import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InitializeTransactionDto } from './dto/initialize-transaction.dto';
import { PaystackCallbackDto, PaystackWebhookDto } from './dto/paystack.dto';
import { PAYSTACK_WEBHOOK_SIGNATURE_KEY } from './constants';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Public()
  @Post('initialize')
  async initializeTransaction(
    // @Req() req: any,
    req: any,
    // @Body()
    dto: InitializeTransactionDto,
  ) {
    console.log('initialize==>', dto);
    return await this.transactionService.initializeTransaction(req, dto);
  }

  @Public()
  @Get('callback')
  async verifyTransaction(@Query() query: any) {
    return await this.transactionService.verifyTransaction(query);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async paymentWebhookHandler(
    @Body() dto: PaystackWebhookDto,
    @Headers() headers = {},
  ) {
    const result = await this.transactionService.handlePaystackWebhook(
      dto,
      `${headers[PAYSTACK_WEBHOOK_SIGNATURE_KEY]}`,
    );

    if (!result) {
      throw new BadRequestException();
    }
  }

  @Get()
  async findTransactions() {
    return await this.transactionService.findMany();
  }
}
