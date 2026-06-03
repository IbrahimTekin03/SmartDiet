import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ai_semantic_cache')
export class AiSemanticCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  query_text: string;

  @Column('text')
  response_text: string;

  @Column({ type: 'varchar', length: 50 })
  role: string; // 'Diyetisyen' veya 'Danışan'

  @Column('text')
  embedding: string;

  @CreateDateColumn()
  created_at: Date;
}
