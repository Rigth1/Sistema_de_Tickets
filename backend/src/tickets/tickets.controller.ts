import { Controller, Post, Body, Get, UseGuards, Req, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TicketsService } from './tickets.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';

@Controller('tickets')
@UseGuards(AuthGuard('jwt')) // <-- ¡Protege TODO el controlador exigiendo JWT!
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto, @Req() req: any) {
    // 1. Extraemos el ID del usuario directamente del token decodificado (req.user)
    const userId = req.user.userId; 

    // 2. Se lo pasamos al servicio junto con los datos del ticket
    return this.ticketsService.create(createTicketDto, userId);
  }

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return this.ticketsService.findAll(page, limit, status);
  }
}