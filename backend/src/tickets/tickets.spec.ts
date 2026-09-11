import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity.js';
import { TicketHistory } from './entities/ticket-history.entity.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TicketsService (Lógica Esencial de Negocio)', () => {
  let service: TicketsService;
  let mockTicketRepository: any;
  let mockTicketHistoryRepository: any; 

  beforeEach(async () => {
    // 1. Definimos los mocks para ambos repositorios
    mockTicketRepository = {
      find: vi.fn(),
      findAndCount: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      count: (vi.fn() as any).mockResolvedValue(5),
    };

    mockTicketHistoryRepository = {
      create: vi.fn(),
      save: vi.fn(),
    };

    // 2. Registramos ambos en el módulo de prueba
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketRepository,
        },
        {
          provide: getRepositoryToken(TicketHistory), 
          useValue: mockTicketHistoryRepository,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('ESPERADO: Obtener una lista de tickets existentes. RESULTADO: Retorna el array de tickets correctamente', async () => {
    const ticketsPrueba = [
      { id: 1, title: 'Fallo en VPN', status: 'open' },
      { id: 2, title: 'Error de correo', status: 'in_progress' },
    ];

    mockTicketRepository.findAndCount.mockResolvedValue([ticketsPrueba, ticketsPrueba.length]);

    console.log('--- EJECUTANDO PRUEBA: Listar Tickets ---');
    console.log('>> SE ESPERA: Un arreglo con 2 elementos');

    const resultado = await service.findAll();

    console.log('>> RESULTADO OBTENIDO:', resultado);

    expect(resultado).toEqual({
      data: ticketsPrueba,
      total: 2,
      page: 1,       // Ajusta el número de página por defecto si tu servicio usa otro (ej. 1)
      lastPage: 1,   // Ajusta según la lógica de tu servicio
    });
    expect(mockTicketRepository.findAndCount).toHaveBeenCalledTimes(1);
  });

  it('ESPERADO: Crear un ticket nuevo con estado inicial "open". RESULTADO: Guarda y retorna el ticket creado', async () => {
    const nuevoTicketDto = { title: 'Nuevo fallo', description: 'No enciende la PC', clientId: 1, areaId: 1 };
    const ticketGuardado = { id: 10, ...nuevoTicketDto, status: 'open' };

    mockTicketRepository.create.mockReturnValue(ticketGuardado);
    mockTicketRepository.save.mockResolvedValue(ticketGuardado);

    console.log('--- EJECUTANDO PRUEBA: Crear Ticket ---');
    console.log('>> SE ESPERA: El objeto guardado con ID 10 y status "open"');

    const resultado = await service.create(nuevoTicketDto as any, 1);

    console.log('>> RESULTADO OBTENIDO:', resultado);

    expect(resultado).toHaveProperty('id', 10);
    expect(resultado.status).toBe('open');
    expect(mockTicketRepository.save).toHaveBeenCalled();
  });
});