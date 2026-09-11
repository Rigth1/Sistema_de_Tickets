import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from '../tickets/entities/ticket.entity.js';
import { describe, it, expect, vi } from 'vitest';

describe('ReportsService', () => {
  let service: ReportsService;
  let mockTicketRepository: any;

  beforeEach(async () => {
    mockTicketRepository = {
      count: (vi.fn() as any).mockResolvedValue(5), // Simulamos que devuelve 5 registros por defecto
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketRepository,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return dashboard summary filtered by agent area', async () => {
    const agentUser = { userId: 2, role: 'Agente', area_id: 3 };
    const result = await service.getDashboardSummary(agentUser);

    expect(result).toBeDefined();
    expect(result.role).toEqual('Agente');
    expect(result.metrics).toHaveProperty('totalOpen');
    // Verificamos que se llamó al repositorio aplicando el filtro de área
    expect(mockTicketRepository.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ area_id: 3 }) }),
    );
  });
});