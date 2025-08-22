import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentStatus } from '../dto/paystack.dto';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  transactionReference: string;

  @Column({ nullable: true })
  paymentLink: string;

  @Column({
    type: 'varchar', // Explicitly set to string type
    nullable: true,
    length: 50, // Optional: add length constraint
  })
  transactionStatus: string | undefined; // Or just 'string' if undefined isn't needed

  @Column({ default: PaymentStatus.notPaid })
  status: PaymentStatus;

  @Column({ type: 'timestamptz', nullable: true })
  transactionDate: Date;

  @Column({ nullable: true })
  amount: number;

  @Column()
  serviceId: number;
}
