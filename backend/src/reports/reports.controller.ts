import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { type Response } from 'express';
import { ReportsService } from './reports.service.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reportes')
@Controller('reports')
@UseGuards(AuthGuard('jwt')) // Todos deben estar autenticados para consultar reportes/dashboard
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Accesible para Admin, Agente y Cliente (Los datos se filtran por su rol automáticamente)
  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener resumen del dashboard' })
  @ApiResponse({ status: 200, description: 'Resumen del dashboard obtenido exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado. Se requiere autenticación.' })
  getDashboard(@Req() req: any) {
    return this.reportsService.getDashboardSummary(req.user);
  }

  // Estrictamente exclusivo para Administradores
  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar reporte de tickets en formato CSV' })
  @ApiResponse({ status: 200, description: 'Reporte exportado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado. Se requiere autenticación.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Solo los administradores pueden exportar reportes.' })
  @UseGuards(RolesGuard)
  @Roles('Admin')
  async exportCsv(@Res() res: Response) {
    const data = await this.reportsService.getTicketsForExport();

    if (data.length === 0) {
      return res.status(404).json({ message: 'No hay datos disponibles para exportar' });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((field) => JSON.stringify((row as any)[field] ?? '')).join(','),
      ),
    ];
    const csvString = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets-report.csv"');
    
    return res.send(csvString);
  }
}