import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, In } from 'typeorm';
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

    async create(createTicketDto: CreateTicketDto, user: { userId: number; role: string }): Promise<Ticket> {
        let affectedUser = user.userId;
        let assignedTo: number | undefined = undefined;

        // Validar permisos según el rol al crear
        if (['Administrador', 'Supervisor'].includes(user.role)) {
            affectedUser = createTicketDto.affected_user ?? user.userId;
            assignedTo = createTicketDto.assigned_to ?? undefined;
        } else if (user.role === 'Agente') {
            // El agente puede elegir el usuario afectado (ej. llamada de soporte)
            affectedUser = createTicketDto.affected_user ?? user.userId;
            assignedTo = createTicketDto.assigned_to ?? undefined;
        } else {
            // Cliente: Forzosamente es él mismo y sin asignar
            affectedUser = user.userId;
            assignedTo = undefined;
        }

        // 1. Instanciar y guardar el ticket usando las variables validadas
        const ticket = this.ticketRepository.create({
            ...createTicketDto,
            created_by: user.userId,
            affected_user: affectedUser,
            assigned_to: assignedTo,
            status: 'Abierto', // Estado inicial por defecto
        });

        const savedTicket = await this.ticketRepository.save(ticket);

        // 2. Primer registro en el ciclo: Creación del ticket
        await this.historyRepository.save({
            ticket_id: savedTicket.id,
            changed_by: user.userId,
            action_description: `Se crea el ticket con estado 'Abierto' y prioridad '${savedTicket.priority}'`,
            field_changed: 'created',
            old_value: null,
            new_value: 'Abierto',
        });

        // 3. Segundo registro en el ciclo (si viene asignado desde el inicio): Asignación inicial
        if (savedTicket.assigned_to) {
            await this.historyRepository.save({
                ticket_id: savedTicket.id,
                changed_by: user.userId, // Corregido de userId a user.userId
                action_description: `Se asigna el ticket al usuario ID: ${savedTicket.assigned_to}`,
                field_changed: 'assigned_to',
                old_value: null,
                new_value: String(savedTicket.assigned_to),
            });
        }

        return savedTicket;
    }

    async findAll(page: number = 1, limit: number = 10, status?: string, user?: { userId: number; role: string; area_id: number }) {
        const skip = (page - 1) * limit;
        const query = this.ticketRepository.createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.creator', 'creator')
            .leftJoinAndSelect('ticket.affectedUser', 'affectedUser')
            .leftJoinAndSelect('ticket.assignee', 'assignee')
            .leftJoinAndSelect('ticket.area', 'area');

        if (status) {
            query.andWhere('ticket.status = :status', { status });
        }

        // Aplicar restricciones estrictas por rol según la especificación
        if (user) {
            if (user.role === 'Cliente') {
                // El cliente solo ve sus propios tickets (creados por él o donde es el usuario afectado)
                query.andWhere('(ticket.created_by = :userId OR ticket.affected_user = :userId)', { userId: user.userId });
            } else if (user.role === 'Agente') {
                // El agente ve los tickets de su área asignada o los que tiene directamente a su cargo
                query.andWhere('(ticket.area_id = :areaId OR ticket.assigned_to = :userId)', {
                    areaId: user.area_id,
                    userId: user.userId,
                });
            }
            // Administrador y Supervisor ven todo (sin filtros adicionales)
        }

        query.orderBy('ticket.created_at', 'DESC')
            .skip(skip)
            .take(limit);

        const [results, total] = await query.getManyAndCount();

        return {
            data: results,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    async findOne(id: number, user?: { userId: number; role: string }): Promise<Ticket> {
        const ticket = await this.ticketRepository.findOne({
            where: { id },
            relations: {
                creator: true,
                affectedUser: true,
                assignee: true,
                area: true,
                history: { user: true },
                comments: { user: true }
            },
        });

        if (!ticket) {
            throw new NotFoundException(`El ticket con ID ${id} no fue encontrado.`);
        }

        // REGLA DE SEGURIDAD: Si es Cliente, validar que el ticket le pertenezca
        if (user && user.role === 'Cliente') {
            if (ticket.created_by !== user.userId && ticket.affected_user !== user.userId) {
                throw new ForbiddenException('No tienes permisos para ver este ticket.');
            }
            // Solo ven notas públicas/expuestas, se ocultan las internas
            ticket.comments = ticket.comments.filter(c => !c.is_internal);

            // 2. SANEAMIENTO DE HISTORIAL PARA CLIENTES (Cierre de brecha)
            ticket.history = [];
        }

        return ticket;
    }

    // 2. MÉTODO ESPECIAL PARA SUPERVISOR: Revisar tickets vencidos o sin actualización
    async findStaleTickets(daysWithoutUpdate: number = 3) {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - daysWithoutUpdate);

        return await this.ticketRepository.find({
            where: {
                status: Not(In(['Resuelto', 'Cerrado'])), // Tickets que aún siguen abiertos o en progreso
                updated_at: LessThan(thresholdDate),
            },
            relations: { assignee: true, area: true },
        });
    }

    async update(id: number, updateTicketDto: UpdateTicketDto, user: { userId: number; role: string }): Promise<Ticket> {
        const ticket = await this.findOne(id);

        if (user.role === 'Cliente') {
            // El cliente solo puede agregar comentarios públicos, jamás cambiar estados, áreas, prioridades o asignaciones
            const modifyingRestrictedFields =
                updateTicketDto.status !== undefined ||
                updateTicketDto.area_id !== undefined ||
                updateTicketDto.assigned_to !== undefined;

            if (modifyingRestrictedFields) {
                throw new ForbiddenException('Los clientes no tienen permisos para modificar propiedades del ticket.');
            }
        }

        // 1. REGLA DE SEGURIDAD PARA EL AGENTE
        if (user.role === 'Agente' && ticket.assigned_to !== user.userId) {
            throw new ForbiddenException('No tienes permisos para modificar este ticket ya que no está asignado a ti.');
        }

        if (updateTicketDto.assigned_to !== undefined && user.role === 'Agente') {
            throw new ForbiddenException('Los agentes no pueden reasignar tickets a otros usuarios.');
        }

        // 1. REGLA DE SEGURIDAD PARA EL AGENTE
        if (user.role === 'Agente' && ticket.assigned_to !== user.userId) {
            throw new ForbiddenException('No tienes permisos para modificar este ticket ya que no está asignado a ti.');
        }

        if (updateTicketDto.assigned_to !== undefined && user.role === 'Agente') {
            throw new ForbiddenException('Los agentes no pueden reasignar tickets a otros usuarios.');
        }

        const previousAssignee = ticket.assigned_to;
        const previousStatus = ticket.status;
        const previousArea = ticket.area_id;

        const { comment, is_internal, assigned_to, ...ticketUpdates } = updateTicketDto;

        // Preparamos los campos que se van a actualizar directamente en la BD
        const updateFields: any = { ...ticketUpdates };

        // Si cambia a Resuelto o Cerrado
        if (ticketUpdates.status && ['Resuelto', 'Cerrado'].includes(ticketUpdates.status) && previousStatus !== ticketUpdates.status) {
            updateFields.resolved_at = new Date();
        }

        // Procesamiento seguro de la reasignación
        let assigneeChanged = false;
        let newAssignedValue: number | null = null;

        if (assigned_to !== undefined) {
            newAssignedValue = (assigned_to !== null && assigned_to !== undefined && (assigned_to as any) !== '')
                ? Number(assigned_to)
                : null;

            if (previousAssignee !== newAssignedValue) {
                assigneeChanged = true;
                updateFields.reassignment_count = (ticket.reassignment_count || 0) + 1;
            }

            updateFields.assigned_to = newAssignedValue;
        }

        // 2. ACTUALIZACIÓN DIRECTA EN BASE DE DATOS (Evita problemas de relaciones en caché)
        if (Object.keys(updateFields).length > 0) {
            await this.ticketRepository.update(id, updateFields);
        }

        // 3. Manejo de Comentarios
        if (comment && comment.trim() !== '') {
            if (user.role === 'Cliente' && is_internal) {
                throw new ForbiddenException('Los clientes no pueden crear notas internas.');
            }

            const newComment = this.commentRepository.create({
                ticket_id: ticket.id,
                user_id: user.userId,
                content: comment.trim(),
                // Forzar que si es cliente, la nota sea siempre pública (is_internal: false)
                is_internal: user.role === 'Cliente' ? false : (is_internal ?? false),
            });
            await this.commentRepository.save(newComment);
        }

        // 4. Historial de cambios de área
        if (updateTicketDto.area_id !== undefined && Number(previousArea) !== Number(updateTicketDto.area_id)) {
            await this.historyRepository.save({
                ticket_id: ticket.id,
                changed_by: user.userId,
                field_changed: 'area_id',
                old_value: previousArea !== null ? String(previousArea) : null,
                new_value: updateTicketDto.area_id !== null ? String(updateTicketDto.area_id) : null,
                action_description: `El ticket fue movido del área ID ${previousArea ?? 'Ninguna'} al área ID ${updateTicketDto.area_id ?? 'Ninguna'}`,
            });
        }

        // 5. Historial de reasignación
        if (assigneeChanged) {
            await this.historyRepository.save({
                ticket_id: ticket.id,
                changed_by: user.userId,
                field_changed: 'assigned_to',
                old_value: previousAssignee ? String(previousAssignee) : null,
                new_value: newAssignedValue !== null ? String(newAssignedValue) : null,
                action_description: `El ticket fue reasignado del usuario ID ${previousAssignee ?? 'Ninguno'} al usuario ID ${newAssignedValue ?? 'Ninguno'}`,
            });
        }

        // 6. Historial de estado
        if (updateTicketDto.status && previousStatus !== updateTicketDto.status) {
            await this.historyRepository.save({
                ticket_id: ticket.id,
                changed_by: user.userId,
                field_changed: 'status',
                old_value: previousStatus,
                new_value: updateTicketDto.status,
                action_description: `El estado cambió de '${previousStatus}' a '${updateTicketDto.status}'`,
            });
        }

        // Retornamos el ticket fresco con todas sus relaciones actualizadas
        return await this.findOne(id);
    }
}