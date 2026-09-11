import { Controller, Post, Body, Get, Patch, Param, UseGuards, Req, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TicketsService } from './tickets.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ApiTags, ApiResponse, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Tickets')
@ApiBearerAuth() // Indica en Swagger que todos los endpoints requieren token JWT de autenticación
@Controller('tickets')
@UseGuards(AuthGuard('jwt')) // Protege todo el controlador exigiendo JWT
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) { }

    @Post()
    @ApiOperation({
        summary: 'Crear un nuevo ticket',
        description: 'Permite a cualquier usuario autenticado registrar un nuevo ticket de soporte en el sistema.'
    })
    @ApiResponse({ status: 201, description: 'Ticket creado exitosamente y registrado en el historial.' })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos (Error de validación en DTO).' })
    @ApiResponse({ status: 401, description: 'No autorizado. Token JWT ausente o inválido.' })
    create(@Body() createTicketDto: CreateTicketDto, @Req() req: any) {
        return this.ticketsService.create(createTicketDto, req.user);
    }

    @Get()
    @ApiOperation({
        summary: 'Obtener lista de tickets filtrada por rol',
        description: 'Retorna una lista paginada de tickets. Aplica control de acceso basado en roles (Scoping): Los administradores ven todo, los agentes ven los asignados a ellos, y los clientes solo sus propios tickets.'
    })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página para la paginación (Por defecto: 1)', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Cantidad de elementos por página (Por defecto: 10)', type: Number })
    @ApiQuery({ name: 'status', required: false, description: 'Filtrar opcionalmente por estado (Ej. Abierto, En Progreso, Resuelto)', type: String })
    @ApiResponse({ status: 200, description: 'Lista de tickets obtenida correctamente con metadatos de paginación.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('status') status?: string,
        @Req() req?: any,
    ) {
        // Pasamos el objeto user completo (userId, role, area_id) para el scoping
        return this.ticketsService.findAll(page, limit, status, req.user);
    }

    @Get('stale')
    @Roles('Administrador', 'Supervisor')
    @ApiOperation({
        summary: 'Revisar tickets vencidos o sin actualización',
        description: 'Endpoint enfocado en supervisores y administradores para identificar tickets abiertos/en progreso que llevan más de un tiempo determinado sin recibir actualizaciones.'
    })
    @ApiResponse({ status: 200, description: 'Listado de tickets estancados o sin actualización reciente.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    findStale() {
        return this.ticketsService.findStaleTickets(2); // Por defecto más de 48 horas sin actualizar
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Actualizar ticket o cambiar estado con validación de rol',
        description: 'Permite modificar propiedades del ticket, cambiar estados, reasignarlo o agregar comentarios/notas internas aplicando las restricciones estrictas del rol (ej. el agente solo actualiza sus tickets asignados).'
    })
    @ApiParam({ name: 'id', description: 'ID numérico único del ticket a actualizar', type: Number })
    @ApiResponse({ status: 200, description: 'Ticket actualizado correctamente y cambios registrados en el historial.' })
    @ApiResponse({ status: 400, description: 'Datos de actualización inválidos.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 403, description: 'Prohibido. El rol del usuario no tiene permisos para realizar esta acción o modificar este ticket específico.' })
    @ApiResponse({ status: 404, description: 'El ticket especificado no fue encontrado.' })
    update(
        @Param('id') id: string,
        @Body() updateTicketDto: UpdateTicketDto,
        @Req() req: any,
    ) {
        return this.ticketsService.update(+id, updateTicketDto, req.user);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Obtener un ticket por ID',
        description: 'Retorna el detalle completo de un ticket incluyendo sus relaciones (creador, asignado, área, historial y comentarios).'
    })
    @ApiParam({ name: 'id', description: 'ID numérico único del ticket a buscar', type: Number })
    @ApiResponse({ status: 200, description: 'Ticket encontrado exitosamente con todos sus detalles.' })
    @ApiResponse({ status: 401, description: 'No autorizado. Token JWT ausente o inválido.' })
    @ApiResponse({ status: 404, description: 'El ticket especificado no fue encontrado.' })
    findOne(@Param('id') id: string, @Req() req: any,) {
        return this.ticketsService.findOne(+id, req.user);
    }
}