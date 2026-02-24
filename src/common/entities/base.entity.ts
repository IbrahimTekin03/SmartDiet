import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export abstract class BaseEntity {
  @ApiProperty({ description: 'Benzersiz tanımlayıcı' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Oluşturulma tarihi' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Güncellenme tarihi' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Silinme tarihi', required: false })
  @DeleteDateColumn()
  deletedAt?: Date;
} 