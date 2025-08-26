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
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Transactions')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // Initialize a new payment (public endpoint for client kickoff)
  @Public()
  @Post('initialize')
  @ApiOperation({ summary: 'Initialize a Paystack transaction' })
  @ApiBody({
    description: 'Transaction initialization payload',
    type: InitializeTransactionDto,
  })
  @ApiOkResponse({ description: 'Transaction initialized successfully' })
  @ApiBadRequestResponse({ description: 'Initialization failed' })
  async initializeTransaction(
    // @Req() req: any,
    req: any,
    // @Body()
    dto: InitializeTransactionDto,
  ) {
    return await this.transactionService.initializeTransaction(req, dto);
  }

  // Client-side redirect after payment; verifies reference
  @Public()
  @Get('callback')
  @ApiOperation({ summary: 'Paystack callback handler (client-side redirect)' })
  @ApiQuery({
    name: 'reference',
    required: true,
    description: 'Paystack reference',
  })
  @ApiOkResponse({ description: 'Transaction verified successfully' })
  @ApiBadRequestResponse({ description: 'Verification failed' })
  async verifyTransaction(@Query() query: any) {
    return await this.transactionService.verifyTransaction(query);
  }

  // Paystack server-to-server webhook; must return 200 quickly
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  @ApiBody({
    description: 'Paystack webhook payload',
  })
  @ApiOkResponse({ description: 'Webhook processed' })
  @ApiBadRequestResponse({
    description: 'Invalid signature or processing error',
  })
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

  // List transactions (consider protecting in future)
  @Get()
  @ApiOperation({ summary: 'List transactions' })
  @ApiOkResponse({ description: 'Transactions retrieved' })
  async findTransactions() {
    return await this.transactionService.findMany();
  }
}
