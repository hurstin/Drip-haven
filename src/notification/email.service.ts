import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT');
    const user = this.configService.get<string>('EMAIL_USERNAME');
    const pass = this.configService.get<string>('EMAIL_PASSWORD');
    const from = this.configService.get<string>('MAIL_FROM');

    this.logger.log(`Initializing EmailService with Host: ${host}, User: ${user}, From: ${from}`);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    const fromAddress = this.configService.get<string>('MAIL_FROM') || this.configService.get<string>('EMAIL_USERNAME') || 'Drip Haven';
    const fromName = 'Drip Haven';
    
    const info = await this.transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      html, // html body
    });

    return info;
  }
}
