import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('foods')
export class Food {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  calories: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  protein: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  fat: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  carbohydrates: number;

  @Column({ nullable: true })
  unit: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
