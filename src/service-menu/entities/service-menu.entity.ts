import { ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export class ServiceMenu {
  @PrimaryGeneratedColumn()
  id: number;

  // @ManyToOne(()=>Washer)
}
