import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { CarModule } from './car/car.module';
import { Car } from './car/entities/car.entity';
import { ServiceMenuModule } from './service-menu/service-menu.module';
import { WasherModule } from './washer/washer.module';
import { Washer } from './washer/entities/washer.entity';
import { RolesGuard } from './auth/guards/role.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    UserModule,
    AuthModule,
    CarModule,
    WasherModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [User, Car, Washer],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],

      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('EMAIL_HOST'),
          port: configService.get('EMAIL_PORT'),
          secure: false,
          auth: {
            user: configService.get('EMAIL_USERNAME'),
            pass: configService.get('EMAIL_PASSWORD'),
          },
        },
      }),

      inject: [ConfigService],
    }),
    ServiceMenuModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true, // Auto-transform payloads to DTO instances
        whitelist: true, // Remove non-whitelisted properties
        forbidNonWhitelisted: true, // Return 400 for unknown properties
        forbidUnknownValues: true, // Reject objects with unknown values
      }),
    },
  ],
})
export class AppModule {}

//  MailerModule.forRoot({
//       transport: {
//         host: 'sandbox.smtp.mailtrap.io',
//         auth: {
//           user: 'ee97ab706e6d7e',
//           pass: 'd2557f93b8992d',
//         },
//       },
//     }),

// MailerModule.forRootAsync({
//       imports: [ConfigModule],
//       useFactory: (configService: ConfigService) => ({
//         transport: {
//           host: configService.get('EMAIL_HOST'),
//           port: configService.get<number>('EMAIL_PORT', 587),
//           auth: {
//             user: configService.get('EMAIL_USER'),
//             pass: configService.get('EMAIL_PASSWORD'),
//           },
//         },
//       }),
//       inject: [ConfigService],
//     }),
