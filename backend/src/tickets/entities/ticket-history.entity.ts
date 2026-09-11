import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';

@Entity('ticket_history')
export class TicketHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    ticket_id: number;

    @ManyToOne('Ticket', (ticket: any) => ticket.history, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ticket_id' })
    ticket: any; // O puedes usar 'import type { Ticket } ...' arriba para mantener tipado estricto

    @Column()
    changed_by: number;
    @ManyToOne('User', { eager: true })
    @JoinColumn({ name: 'changed_by' })
    user: any;

    @Column({ type: 'text' })
    action_description: string;

    @Column({ nullable: true })
    field_changed?: string | null;

    @Column({ nullable: true, type: 'text' })
    old_value?: string | null;

    @Column({ nullable: true, type: 'text' })
    new_value?: string | null;

    @CreateDateColumn()
    created_at: Date;
}