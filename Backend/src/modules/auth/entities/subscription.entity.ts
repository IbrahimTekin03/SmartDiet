import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SubscriptionStatus {
  Active = 'active',
  Paused = 'paused',
  Cancelled = 'cancelled',
  Pending = 'pending',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  dietitian_id: string;

  @Column('uuid')
  client_id: string;

  @Column('uuid', { nullable: true })
  clinic_id: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  start_date: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_date: Date | null;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.Pending,
  })
  status: SubscriptionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
