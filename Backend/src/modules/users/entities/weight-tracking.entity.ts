import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('weight_tracking')
export class WeightTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'float' })
  weight: number;

  @CreateDateColumn()
  createdAt: Date;
}


