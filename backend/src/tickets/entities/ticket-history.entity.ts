import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('ticket_history')
export class TicketHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ticket_id: number;

  @ManyToOne(() => Ticket, (ticket) => ticket.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column()
  changed_by: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'changed_by' })
  user: User;

  @Column({ type: 'text' })
  action_description: string; // Ejemplo: "Cambió el estado de Abierto a En Progreso"

  @CreateDateColumn()
  created_at: Date;
}