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

  @Column({ unique: true })
  display_name: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  avatar_url: string;

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

  @Column()
  verification_code: string;

  @Column({ default: false })
  is_active: boolean;

  @Column()
  last_login: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

} 