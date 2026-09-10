import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity.js';
import { TicketHistory } from './entities/ticket-history.entity.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';

@Injectable()
export class TicketsService {
    constructor(
        @InjectRepository(Ticket)
        private readonly ticketRepository: Repository<Ticket>,
        @InjectRepository(TicketHistory)
        private readonly historyRepository: Repository<TicketHistory>,
    ) { }

    async create(createTicketDto: CreateTicketDto, userId: number): Promise<Ticket> {
        // 1. Instanciar y guardar el ticket asignando el creador extraído del token JWT
        const ticket = this.ticketRepository.create({
            ...createTicketDto,
            created_by: userId,
            status: 'Abierto', // Estado inicial por defecto
        });

        const savedTicket = await this.ticketRepository.save(ticket);

        // 2. Registrar automáticamente el evento en la tabla de auditoría (TicketHistory)
        const history = this.historyRepository.create({
            ticket_id: savedTicket.id,
            changed_by: userId,
            action_description: `Creó el ticket con estado 'Abierto' y prioridad '${savedTicket.priority}'`,
        });

        await this.historyRepository.save(history);

        return savedTicket;
    }

    async findAll(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;

    // Construimos dinámicamente la consulta con filtros y paginación
    const [results, total] = await this.ticketRepository.findAndCount({
      where: status ? { status } : {}, // Si envían un estado, filtramos por él
      relations: {
        creator: true,
        assignee: true,
        area: true,
      },
      take: limit, // Cantidad máxima de registros por página (ej. 10)
      skip: skip,  // Cuántos registros salta (paginación)
      order: { created_at: 'DESC' }, // Los más nuevos primero
    });

    return {
      data: results,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
}