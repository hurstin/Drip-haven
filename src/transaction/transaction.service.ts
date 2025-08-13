import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { InitializeTransactionDto } from './dto/initialize-transaction.dto';
import { ServiceMenuService } from 'src/service-menu/service-menu.service';
import { UserService } from 'src/user/user.service';
import {
  PaymentStatus,
  PaystackCallbackDto,
  PaystackCreateTransactionDto,
  PaystackCreateTransactionResponseDto,
  PaystackMetadata,
  PaystackVerifyTransactionResponseDto,
  PaystackWebhookDto,
} from './dto/paystack.dto';
import { ConfigService } from '@nestjs/config';
import {
  PAYSTACK_SUCCESS_STATUS,
  PAYSTACK_TRANSACTION_INI_URL,
  PAYSTACK_TRANSACTION_VERIFY_BASE_URL,
  PAYSTACK_WEBHOOK_CRYPTO_ALGO,
} from './constants';
import axios, { AxiosResponse } from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    private serviceService: ServiceMenuService,
    private userService: UserService,
    readonly configService: ConfigService,
  ) {}

  async initializeTransaction(
    userId: number,
    dto: any,
    // dto: InitializeTransactionDto,
  ): Promise<Transaction | null> {
    const service = await this.serviceService.getService(dto.serviceId);

    // const service = {
    //   id: 2,
    //   price: 30000,
    // };

    if (!service) throw new NotFoundException('service not found');

    const user = await this.userService.findById(userId);
    // const user = {
    //   id: 1,
    //   name: 'John Doe',
    //   email: 'someone@example.zestmade.com',
    //   favouriteColor: 'Blue',
    // };

    if (!user) throw new NotFoundException('user not found');

    const metadata: PaystackMetadata = {
      user_id: user.id,
      service_id: service.id,
      custom_fields: [
        {
          display_name: 'Name',
          variable_name: 'name',
          value: user.name,
        },
        {
          display_name: 'Email',
          variable_name: 'email',
          value: user.email,
        },
        // {
        //   display_name: 'Favourite Color',
        //   variable_name: 'favourite_color',
        //   value: user.,
        // },
        // {
        //   display_name: 'Discount',
        //   variable_name: 'discount',
        //   value: `60%`,
        // },
      ],
    };

    const paystackCreateTransactionDto: PaystackCreateTransactionDto = {
      email: user.email,
      amount: service.price,
      metadata,
    };

    const paystackCallbackUrl = this.configService.get('PAYSTACK_CALLBACK_URL');
    if (paystackCallbackUrl) {
      paystackCreateTransactionDto.callback_url = paystackCallbackUrl;
    }

    const payload = JSON.stringify(paystackCreateTransactionDto);

    let result: PaystackCreateTransactionResponseDto;

    try {
      const response = await axios.post<PaystackCreateTransactionResponseDto>(
        PAYSTACK_TRANSACTION_INI_URL,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>(
              'PAYSTACK_SECRET_KEY',
            )}`,
            'Content-Type': 'application/json',
          },
        },
      );

      result = response.data;
    } catch (error) {
      // handle case
      console.error('Paystack API error:', error);
      return null;
    }

    const data = result.data;

    if (result.status === true) {
      const transaction = this.transactionRepo.create({
        transactionReference: data.reference,
        paymentLink: data.authorization_url,
        serviceId: service.id,
      });

      return await this.transactionRepo.save(transaction);
    }

    return null;
  }

  async verifyTransaction(
    dto: PaystackCallbackDto,
  ): Promise<Transaction | null> {
    const transaction = await this.transactionRepo.findOne({
      where: {
        transactionReference: dto.reference,
      },
    });

    if (!transaction) {
      return null;
    }

    const reference = transaction.transactionReference;
    const url = `${PAYSTACK_TRANSACTION_VERIFY_BASE_URL}/${reference}`;
    let response: AxiosResponse<PaystackVerifyTransactionResponseDto>;

    try {
      response = await axios.get<PaystackVerifyTransactionResponseDto>(url, {
        headers: {
          Authorization: `Bearer ${this.configService.get<string>(
            'PAYSTACK_SECRET_KEY',
          )}`,
        },
      });
    } catch (error) {
      // handle case
      return null;
    }

    if (!response) {
      return null;
    }

    const result = response.data;

    const transactionStatus = result?.data?.status;
    const paymentConfirmed = transactionStatus === PAYSTACK_SUCCESS_STATUS;

    if (paymentConfirmed) {
      transaction.status = PaymentStatus.pain;
    } else {
      transaction.status = PaymentStatus.notPaid;
    }

    transaction.transactionStatus = transactionStatus;

    return await this.transactionRepo.save(transaction);
  }

  async handlePaystackWebhook(
    dto: PaystackWebhookDto,
    signature: string,
  ): Promise<boolean> {
    if (!dto.data) {
      return false;
    }

    let isValidEvent = false;

    // paystack create and send the hash -> tstdfgdgdgssjdf
    // create the hash of the same data -> tstdfgdgdgssjdf
    const paystackSk = this.configService.get<string>('PAYSTACK_SECRET_KEY');

    if (!paystackSk)
      throw new NotFoundException('paystack secret Key not found');
    try {
      const hash = createHmac(
        PAYSTACK_WEBHOOK_CRYPTO_ALGO,
        paystackSk,
        // this.configService.get<string>('PAYSTACK_SECRET_KEY'),
      )
        .update(JSON.stringify(dto))
        .digest('hex');

      isValidEvent =
        !!hash &&
        !!signature &&
        timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
    } catch (error) {
      // handle case
    }

    if (!isValidEvent) {
      return false;
    }

    const transaction = await this.transactionRepo.findOne({
      where: {
        transactionReference: dto.data.reference,
      },
    });

    if (!transaction) throw new NotFoundException('transaction not found');

    const transactionStatus = dto.data.status;
    const paymentConfirmed = transactionStatus === PAYSTACK_SUCCESS_STATUS;

    if (paymentConfirmed) {
      transaction.status = PaymentStatus.pain;
    } else {
      transaction.status = PaymentStatus.notPaid;
    }

    transaction.transactionStatus = transactionStatus;

    await this.transactionRepo.save(transaction);

    return true;
  }

  async findMany() {
    return this.transactionRepo.find();
  }
}
