import { Controller, Get, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { PacientesService } from './pacientes.service';
import { ReportePacientesDto, VacunasVencerDto, ReporteHistoriaClinicaDto } from './dto/reporte-pacientes.dto';
import { ReporteMeta } from '../interceptors/reporte-log.interceptor';

@Controller('reportes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get('pacientes')
  async pacientes(@Query() query: ReportePacientesDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'PACIENTES',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.pacientesService.getPacientes(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  @Get('pacientes/vacunas-vencer')
  async vacunasVencer(@Query() query: VacunasVencerDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'PACIENTES',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.pacientesService.getVacunasVencer(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  // Ficha completa de un paciente individual: datos + historias + citas + recordatorios
  @Get('pacientes/:id/ficha')
  async fichaClinica(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { reporteMeta?: ReporteMeta },
  ) {
    req.reporteMeta = {
      tipo: 'HISTORIA_CLINICA',
      parametros: { pacienteId: id },
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
    };
    const result = await this.pacientesService.getFichaClinica(id);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  // Listado general de historias clínicas con filtros
  @Get('historia-clinica')
  async historiasClinicas(@Query() query: ReporteHistoriaClinicaDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'HISTORIA_CLINICA',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.pacientesService.getHistoriasClinicas(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }
}
