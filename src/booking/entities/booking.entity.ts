import { Car } from 'src/car/entities/car.entity';
import { ServiceMenu } from 'src/service-menu/entities/service-menu.entity';
import { User } from 'src/user/entities/user.entity';
import { Washer } from 'src/washer/entities/washer.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum WasherResponse {
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.booking)
  user: User;

  @ManyToOne(() => Car)
  car: Car;

  @ManyToOne(() => ServiceMenu, (service) => service.booking)
  service: ServiceMenu;

  // @ManyToOne(() => Washer, (washer) => washer.booking) // Add inverse relation
  // washer: Washer;

  @Column()
  scheduledTime: Date;

  @Column({ default: 'pending' })
  status:
    | 'pending'
    | 'assigned'
    | 'accepted'
    | 'declined'
    | 'in-progress'
    | 'completed'
    | 'cancelled';

  @Column({ default: 'unpaid' })
  paymentStatus: 'paid' | 'unpaid';

  @Column('double precision', { nullable: true })
  latitude: number;

  @Column('double precision', { nullable: true })
  longitude: number;

  @Column({ default: null, enum: WasherResponse, nullable: true })
  washerResponse: WasherResponse;
}
