import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AreasService } from './areas.service.js';
import { CreateAreaDto } from './dto/create-area.dto.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('Áreas') // <-- Esto agrupa los endpoints de este controlador bajo la etiqueta "Áreas" en Swagger
@Controller('areas')
@UseGuards(AuthGuard('jwt')) // Todo el módulo requiere autenticación por defecto
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  // Cualquier usuario autenticado puede ver las áreas
  @Get()
  @ApiOperation({ summary: 'Obtener todas las áreas corporativas' })
  @ApiResponse({ status: 200, description: 'Lista de áreas corporativas obtenida exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado. Se requiere autenticación.' })
  findAll() {
    return this.areasService.findAll();
  }

  // Solo los administradores pueden crear nuevas áreas corporativas
  @Post()
  @ApiOperation({ summary: 'Crear una nueva área corporativa' })
  @ApiResponse({ status: 201, description: 'Área corporativa creada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado. Se requiere autenticación.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Solo los administradores pueden crear áreas.' })
  @UseGuards(RolesGuard)
  @Roles('Administrador')
  create(@Body() createAreaDto: CreateAreaDto) {
    return this.areasService.create(createAreaDto);
  }
}