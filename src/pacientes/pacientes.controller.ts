import { Controller, Get, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PacientesService } from './pacientes.service';
import { ReportePacientesDto, VacunasVencerDto, ReporteHistoriaClinicaDto } from './dto/reporte-pacientes.dto';
import { ReporteMeta } from '../interceptors/reporte-log.interceptor';

@ApiTags('Reportes - Pacientes e Historias Clínicas')
@Controller('reportes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get('pacientes')
  @ApiOperation({ summary: 'Obtener reportes estadísticos y demográficos consolidados de los pacientes' })
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
  @ApiOperation({ summary: 'Monitorear cronogramas epidemiológicos e inmunizaciones próximas a expirar' })
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

  @Get('pacientes/:id/ficha')
  @ApiOperation({ summary: 'Generar la ficha clínica consolidada del paciente (Datos, Historias, Citas y Alertas)' })
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

  @Get('historia-clinica')
  @ApiOperation({ summary: 'Listar y filtrar de forma masiva registros y evoluciones cargadas en historias clínicas' })
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