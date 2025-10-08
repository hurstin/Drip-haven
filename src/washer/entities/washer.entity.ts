import { Booking } from '../../booking/entities/booking.entity';
import { ServiceMenu } from '../../service-menu/entities/service-menu.entity';
import { User } from '../../user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Washer {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.washerProfile)
  @JoinColumn() //this decorator is needed on one side of the one-to-one
  user: User;

  @Column({ default: 'pending' })
  kycStatus: 'pending' | 'approved' | 'rejected';

  @Column({ nullable: true })
  idPhotoUrl: string;

  @OneToMany(() => ServiceMenu, (service) => service.washer)
  services: ServiceMenu[];

  // @OneToMany(() => Booking, (booking) => booking.washer)
  // booking: Booking[];

  @Column('double precision', { nullable: true })
  latitude: number;

  @Column('double precision', { nullable: true })
  longitude: number;

  @Column({ default: true })
  isAvailable: boolean;
}
