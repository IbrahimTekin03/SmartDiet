import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum OtpIdentityType {
  Email = 1,
  Phone = 2,
}

export enum OtpPurpose {
  Signup = 1,
  Login = 2,
}

@Entity('otp_codes')
@Index('idx_otp_expiry', ['expires_at'])
@Index('idx_otp_lookup', ['identity_type', 'identity', 'purpose', 'created_at'])
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'smallint' })
  identity_type: OtpIdentityType;

  @Column({ type: 'text' })
  identity: string;

  @Column({ type: 'smallint' })
  purpose: OtpPurpose;

  // Bcrypt hash metni olarak saklayacağız
  @Column({ type: 'text' })
  code_hash: string;

  // Scrypt kullanılırsa gerekecek; bcrypt için boş bırakılabilir
  @Column({ type: 'bytea', nullable: true })
  salt: Buffer | null;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'int', default: 0 })
  attempt_count: number;

  @Column({ type: 'int', default: 1 })
  sent_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  locked_until: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  consumed_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}


