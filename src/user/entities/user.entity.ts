import { Exclude } from 'class-transformer';
import { Car } from '../../car/entities/car.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Washer } from '../../washer/entities/washer.entity';
import { Booking } from '../../booking/entities/booking.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { Review } from '../../review/entities/review.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  WASHER = 'washer',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @OneToOne(() => Washer, (washer) => washer.user)
  washerProfile: Washer; // Optional: for eager loader or reverse access

  @Column() // Field is excluded by default in queries
  @Exclude()
  password: string;

  @Column({ type: 'varchar', nullable: true })
  profilePictureUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  profilePicturePublicId: string | null; // To store Cloudinary public ID for deletion

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  phoneNumber: string | null;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  address: string | null;

  @Column({ type: 'varchar', nullable: true, length: 30 })
  accountNumber: string | null;

  @Column({ type: 'varchar', nullable: true, length: 120 })
  accountName: string | null;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationTokenExpires: Date | null;

  @CreateDateColumn()
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  updatedAt: Date;

  @Column({ nullable: true, type: 'varchar' })
  @Exclude()
  passwordResetToken: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  @Exclude()
  passwordResetExpires: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  @Exclude()
  passwordChangedAt: Date | null;

  // 1. Define the inverse relationship
  @OneToMany(() => Car, (car) => car.user, {
    cascade: true, // Auto-save cars when user is saved
    onDelete: 'CASCADE', // Delete cars when user is deleted
  })
  cars: Car[];

  @OneToMany(() => Booking, (booking) => booking.user)
  booking: Booking[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notification: Notification[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];
}
