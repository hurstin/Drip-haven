import { User } from '../../user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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
}
