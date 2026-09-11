import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    ticket_id: number;

    @ManyToOne('Ticket', (ticket: any) => ticket.comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ticket_id' })
    ticket: any;

    @Column()
    user_id: number;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'text' })
    content: string;

    @Column({ default: false })
    is_internal: boolean;

    @CreateDateColumn()
    created_at: Date;
}