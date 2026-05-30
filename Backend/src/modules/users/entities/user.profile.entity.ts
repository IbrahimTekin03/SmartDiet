import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gender } from '../enums/gender.enum';

export enum AccountType {
  Client = 'client',
  Dietitian = 'Diyetisyen',
  OldDietitian = 'dietitian',
}

export enum DietitianVerificationStatus {
  NotSubmitted = 'not_submitted',
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn('uuid')
  user_id: string;

  @Column({ nullable: false })
  first_name: string;

  @Column({ nullable: false })
  last_name: string;

  @Column({ nullable: true })
  avatar_url: string | null;

  @Column({ type: 'date', nullable: true })
  birth_date: Date | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender | null;

  @Column({ type: 'enum', enum: AccountType, default: AccountType.Client })
  account_type: AccountType;

  @Column({
    type: 'enum',
    enum: DietitianVerificationStatus,
    default: DietitianVerificationStatus.NotSubmitted,
  })
  dietitian_verification_status: DietitianVerificationStatus;

  @Column({ nullable: true })
  clinic_id: string | null;

  @Column({ nullable: true })
  clinic_name: string | null;

  @Column({ nullable: true })
  clinic_city: string | null;

  @Column({ nullable: true })
  clinic_address: string | null;

  @Column({ nullable: true })
  verification_note: string | null;

  @Column({ nullable: true })
  verification_review_note: string | null;

  @Column({ nullable: true })
  certificate_url: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verification_submitted_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  verification_reviewed_at: Date | null;

  @Column({ nullable: true })
  verification_reviewed_by: string | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ type: 'varchar', default: 'pending' })
  client_verification_status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
