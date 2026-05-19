import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatRoom } from '../../auth/entities/chat-room.entity';
import { DietPlan } from '../../diet-plans/entities/diet-plan.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  room_id: string;

  @ManyToOne(() => ChatRoom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: ChatRoom;

  @Column('uuid')
  sender_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column('text')
  content: string;

  @Column({ type: 'uuid', nullable: true })
  plan_id: string | null;

  @ManyToOne(() => DietPlan, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan?: DietPlan;

  @Column({ default: false })
  is_delivered: boolean;

  @Column({ default: false })
  is_read: boolean;

  @CreateDateColumn()
  created_at: Date;
}
