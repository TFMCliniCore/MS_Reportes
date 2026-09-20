import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CitasService } from './citas.service';
import { ReporteCitasDto, ReporteRecordatoriosDto, ReporteSalaEsperaDto } from './dto/reporte-citas.dto';
import { ReporteMeta } from '../interceptors/reporte-log.interceptor';

@ApiTags('Reportes - Citas y Agenda')
@Controller('reportes')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Get('citas')
  @ApiOperation({ summary: 'Obtener reporte general de citas médicas, estados de reserva y ausentismo' })
  async citas(@Query() query: ReporteCitasDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'CITAS',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
    };
    const result = await this.citasService.getCitas(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  @Get('citas/tasa-asistencia')
  @ApiOperation({ summary: 'Calcular la tasa de asistencia, cancelaciones y efectividad de la agenda' })
  async tasaAsistencia(@Query() query: ReporteCitasDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'CITAS',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
    };
    const result = await this.citasService.getTasaAsistencia(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  @Get('recordatorios')
  @ApiOperation({ summary: 'Analizar el historial de recordatorios enviados y su impacto en las confirmaciones' })
  async recordatorios(@Query() query: ReporteRecordatoriosDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'CITAS',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
    };
    const result = await this.citasService.getRecordatorios(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  @Get('sala-espera')
  @ApiOperation({ summary: 'Auditar tiempos de espera en sala física desde el check-in hasta la atención' })
  async salaEspera(@Query() query: ReporteSalaEsperaDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'CITAS',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
    };
    const result = await this.citasService.getSalaEspera(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }
}