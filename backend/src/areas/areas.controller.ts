import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AreasService } from './areas.service.js';
import { CreateAreaDto } from './dto/create-area.dto.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('areas')
@UseGuards(AuthGuard('jwt')) // Todo el módulo requiere autenticación por defecto
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  // Cualquier usuario autenticado puede ver las áreas
  @Get()
  findAll() {
    return this.areasService.findAll();
  }

  // Solo los administradores pueden crear nuevas áreas corporativas
  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin')
  create(@Body() createAreaDto: CreateAreaDto) {
    return this.areasService.create(createAreaDto);
  }
}