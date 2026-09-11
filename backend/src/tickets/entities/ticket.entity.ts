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
import { Comment } from './comment.entity.js'; // <--- Importa la entidad Comment

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

  @ManyToOne('User', { eager: true })
  @JoinColumn({ name: 'created_by' })
  creator: any;

  @Column({ nullable: true })
  assigned_to: number;

  @ManyToOne('User', { nullable: true, eager: true })
  @JoinColumn({ name: 'assigned_to' })
  assignee: any;

  @Column()
  area_id: number;

  @ManyToOne('Area', { eager: true })
  @JoinColumn({ name: 'area_id' })
  area: any;

  @Column({ nullable: true })
  reassignment_count: number; // <--- Añadido para el control de reasignaciones

  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date; // <--- Añadido para métricas de resolución

  @OneToMany(() => Comment, (comment) => comment.ticket, { cascade: true })
  comments: Comment[]; // <--- Relación con la nueva tabla de comentarios

  @OneToMany('TicketHistory', (history: any) => history.ticket, { cascade: true })
  history: any[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}