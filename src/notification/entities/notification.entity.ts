import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum MssgStatus {
  READ = 'read',
  UNREAD = 'unread',
}

export enum NotificationType {
  NEW_BOOKING = 'NEW_BOOKING',
  BOOKING_ACCEPTED = 'BOOKING_ACCEPTED',
  WASHER_ARRIVING = 'WASHER_ARRIVING',
  COMPLETED = 'COMPLETED',
  PAYMENT = 'PAYMENT',
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.notification)
  user: User;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ enum: MssgStatus, default: MssgStatus.UNREAD })
  status: MssgStatus;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.NEW_BOOKING,
  })
  type: NotificationType;

  @CreateDateColumn()
  createdAt: Date;
}
