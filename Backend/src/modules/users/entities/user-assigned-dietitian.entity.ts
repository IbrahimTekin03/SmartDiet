import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user_assigned_dietitian')
export class UserAssignedDietitian {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'dietitianId' })
  dietitianId: string;

  @Column({ name: 'clinicId', nullable: true })
  clinicId: string | null;

  @Column({ name: 'clientId' })
  clientId: string;

  @CreateDateColumn({ name: 'assignedAt' })
  assignedAt: Date;
}
