import { Booking } from '../../booking/entities/booking.entity';
import { User } from '../../user/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum CarType {
  SEDAN = 'sedan',
  SUV = 'suv',
  TRUCK = 'truck',
  VAN = 'van',
  COUPE = 'coupe',
  HATCHBACK = 'hatchback',
  WAGON = 'wagon',
  CONVERTIBLE = 'convertible',
}

@Entity()
export class Car {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.cars)
  user: User;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column()
  color: string;

  @Column({ unique: true })
  plateNumber: string;

  @Column({ type: 'enum', enum: CarType, default: CarType.SEDAN })
  type: CarType;

  @Column({ type: 'varchar', nullable: true })
  pictureUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  picturePublicId: string | null;
}
