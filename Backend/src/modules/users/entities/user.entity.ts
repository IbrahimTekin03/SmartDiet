import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  DeleteDateColumn,
  Timestamp,
} from 'typeorm';
import { Role } from '../../acl/entities/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone_number: string;

  @Column({ nullable: false})
  password_hash: string;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @Column({ default: false })
  is_verified: boolean;

  @Column({ default: null })
  verification_code: string;

  @Column({ default: false })
  is_active: boolean;

  @Column({default: null})
  last_login: Date;

  @Column({ type: 'int', default: 0 })
  failed_login_attempts: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  password_reset_token: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  password_reset_expires_at: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

} 
