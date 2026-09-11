import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity.js';
import { TicketHistory } from './entities/ticket-history.entity.js';
import { Comment } from './entities/comment.entity.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';

@Injectable()
export class TicketsService {
    constructor(
        @InjectRepository(Ticket)
        private readonly ticketRepository: Repository<Ticket>,
        @InjectRepository(TicketHistory)
        private readonly historyRepository: Repository<TicketHistory>,
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
    ) { }

    async create(createTicketDto: CreateTicketDto, userId: number): Promise<Ticket> {
        // 1. Instanciar y guardar el ticket
        const ticket = this.ticketRepository.create({
            ...createTicketDto,
            created_by: userId,
            status: 'Abierto', // Estado inicial por defecto
        });

        const savedTicket = await this.ticketRepository.save(ticket);

        // 2. Primer registro en el ciclo: Creación del ticket
        await this.historyRepository.save({
            ticket_id: savedTicket.id,
            changed_by: userId,
            action_description: `Se crea el ticket con estado 'Abierto' y prioridad '${savedTicket.priority}'`,
            field_changed: 'created',
            old_value: null,
            new_value: 'Abierto',
        });

        // 3. Segundo registro en el ciclo (si viene asignado desde el inicio): Asignación inicial
        if (savedTicket.assigned_to) {
            await this.historyRepository.save({
                ticket_id: savedTicket.id,
                changed_by: userId,
                action_description: `Se asigna el ticket al usuario ID: ${savedTicket.assigned_to}`,
                field_changed: 'assigned_to',
                old_value: null,
                new_value: String(savedTicket.assigned_to), // Guardamos el ID exacto en la base de datos
            });
        }

        return savedTicket;
    }

    async findAll(page: number = 1, limit: number = 10, status?: string) {
        const skip = (page - 1) * limit;

        const [results, total] = await this.ticketRepository.findAndCount({
            where: status ? { status } : {},
            relations: {
                creator: true,
                assignee: true,
                area: true,
            },
            take: limit,
            skip: skip,
            order: { created_at: 'DESC' },
        });

        return {
            data: results,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    async findOne(id: number): Promise<Ticket> {
        const ticket = await this.ticketRepository.findOne({
            where: { id },
            relations: { creator: true, assignee: true, area: true, history: true },
        });

        if (!ticket) {
            throw new NotFoundException(`El ticket con ID ${id} no fue encontrado.`);
        }

        return ticket;
    }

    async update(id: number, updateTicketDto: UpdateTicketDto, userId: number): Promise<Ticket> {
    const ticket = await this.findOne(id);

    const previousAssignee = ticket.assigned_to;
    const previousStatus = ticket.status;
    const previousArea = ticket.area_id;

    // 1. Extraemos el comentario para guardarlo en su propia tabla y no mezclarlo con el ticket
    const { comment, is_internal, ...ticketUpdates } = updateTicketDto;

    // Actualizamos los campos directos del ticket con el DTO restante
    Object.assign(ticket, ticketUpdates);

    // Automatizar fecha de resolución si el estado pasa a resuelto o cerrado
    if (updateTicketDto.status && ['Resuelto', 'Cerrado'].includes(updateTicketDto.status) && previousStatus !== updateTicketDto.status) {
        ticket.resolved_at = new Date();
    }

    const updatedTicket = await this.ticketRepository.save(ticket);

    // 2. Si enviaron un comentario o nota de gestión, se guarda en la tabla 'comments'
    if (comment) {
        const newComment = this.commentRepository.create({
            ticket_id: ticket.id,
            user_id: userId,
            content: comment,
            is_internal: is_internal ?? false,
        });
        await this.commentRepository.save(newComment);
    }

    // 3. Registrar cambio de ÁREA en el historial y actualizar ticket si aplica
    if (updateTicketDto.area_id !== undefined && previousArea !== updateTicketDto.area_id) {
        await this.historyRepository.save({
            ticket_id: ticket.id,
            changed_by: userId,
            field_changed: 'area_id',
            old_value: String(previousArea),
            new_value: String(updateTicketDto.area_id),
            action_description: `El ticket fue movido del área ID ${previousArea} al área ID ${updateTicketDto.area_id}`,
        });
    }

    // 4. Registrar reasignación de AGENTE y aumentar el contador optimizado 'reassignment_count'
    if (updateTicketDto.assigned_to !== undefined && previousAssignee !== updateTicketDto.assigned_to) {
        ticket.reassignment_count = (ticket.reassignment_count || 0) + 1;
        await this.ticketRepository.save(ticket); // Guardamos el incremento del contador

        await this.historyRepository.save({
            ticket_id: ticket.id,
            changed_by: userId,
            field_changed: 'assigned_to',
            old_value: previousAssignee ? String(previousAssignee) : null,
            new_value: updateTicketDto.assigned_to !== null && updateTicketDto.assigned_to !== undefined ? String(updateTicketDto.assigned_to) : null,
            action_description: `El ticket fue reasignado del usuario ${previousAssignee ?? 'Ninguno'} al usuario ${updateTicketDto.assigned_to ?? 'Ninguno'}`,
        });
    }

    // 5. Registrar cambio de ESTADO
    if (updateTicketDto.status && previousStatus !== updateTicketDto.status) {
        await this.historyRepository.save({
            ticket_id: ticket.id,
            changed_by: userId,
            field_changed: 'status',
            old_value: previousStatus,
            new_value: updateTicketDto.status,
            action_description: `El estado cambió de '${previousStatus}' a '${updateTicketDto.status}'`,
        });
    }

    return updatedTicket;
}
}