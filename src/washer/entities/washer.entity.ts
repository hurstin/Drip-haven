import { ServiceMenu } from 'src/service-menu/entities/service-menu.entity';
import { User } from 'src/user/entities/user.entity';
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

  @Column()
  idPhotoUrl: string;

  @OneToMany(() => ServiceMenu, (service) => service.washer)
  services: ServiceMenu[];
}
