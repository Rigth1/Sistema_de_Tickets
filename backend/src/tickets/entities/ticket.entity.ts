import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Area } from '../../areas/entities/area.entity.js';
import { TicketHistory } from './ticket-history.entity.js';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'Abierto' })
  status: string; // Abierto, En Progreso, Resuelto, Cerrado

  @Column({ default: 'Media' })
  priority: string; // Baja, Media, Alta, Urgente

  @Column()
  created_by: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ nullable: true })
  assigned_to: number;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'assigned_to' })
  assignee: User;

  @Column()
  area_id: number;

  @ManyToOne(() => Area, { eager: true })
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @OneToMany(() => TicketHistory, (history) => history.ticket)
  history: TicketHistory[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}