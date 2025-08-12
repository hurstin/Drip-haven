import { Booking } from 'src/booking/entities/booking.entity';
import { Washer } from 'src/washer/entities/washer.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ServiceMenu {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Washer, (washer) => washer.services, {
    onDelete: 'CASCADE',
    // eager: true,
  })
  washer: Washer;

  @OneToMany(() => Booking, (booking) => booking.service)
  booking: Booking[];

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isActive: boolean;
}
