import { Washer } from 'src/washer/entities/washer.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ServiceMenu {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Washer, (washer) => washer.services, {
    onDelete: 'CASCADE',
    // eager: true,
  })
  washer: Washer;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isActive: boolean;
}
