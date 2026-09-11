import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  // 1. Resumen adaptativo según el rol del usuario (Ideal para el Dashboard)
  async getDashboardSummary(user: { userId: number; role: string; area_id: number }) {
    let whereCondition: any = {};

    // Aplicamos la misma regla de negocio estricta de datos (Scoping)
    if (user.role === 'Agente') {
      whereCondition.area_id = user.area_id;
    } else if (user.role === 'Cliente') {
      whereCondition.created_by = user.userId;
    }
    // Si es Admin, whereCondition se queda vacío y trae todo.

    const totalOpen = await this.ticketRepository.count({
      where: { ...whereCondition, status: 'Abierto' },
    });
    const totalInProgress = await this.ticketRepository.count({
      where: { ...whereCondition, status: 'En Progreso' },
    });
    const totalResolved = await this.ticketRepository.count({
      where: { ...whereCondition, status: 'Resuelto' },
    });
    const totalUrgent = await this.ticketRepository.count({
      where: { ...whereCondition, priority: 'Urgente' },
    });

    return {
      role: user.role,
      metrics: {
        totalOpen,
        totalInProgress,
        totalResolved,
        totalUrgent,
      },
    };
  }

  // 2. Exportación global (Esta sí se queda estrictamente global para el Admin)
  async getTicketsForExport() {
    const tickets = await this.ticketRepository.find({
      relations: { creator: true, assignee: true, area: true },
      order: { created_at: 'DESC' },
    });

    return tickets.map((ticket) => ({
      ID: ticket.id,
      Title: ticket.title,
      Status: ticket.status,
      Priority: ticket.priority,
      Area: ticket.area ? ticket.area.name : 'Sin Área',
      Creator: ticket.creator ? ticket.creator.email : 'Desconocido',
      CreatedAt: ticket.created_at,
    }));
  }
}