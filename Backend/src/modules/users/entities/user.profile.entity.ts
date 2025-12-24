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
import { Gender } from '../enums/gender.enum';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ nullable: false })
  first_name: string;

  @Column({ nullable: false })
  last_name: string;

  @Column()
  @Column()
  avatar_url: string;
  @Column()
  birth_date: Date;

  @Column()
  gender: Gender;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
