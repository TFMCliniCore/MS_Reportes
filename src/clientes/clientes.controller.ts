import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ClientesService } from './clientes.service';
import { ReporteClientesDto, ClientesSinVisitaDto, ClientesTopGastoDto } from './dto/reporte-clientes.dto';
import { ReporteMeta } from '../interceptors/reporte-log.interceptor';

@Controller('reportes/clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  async clientes(@Query() query: ReporteClientesDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'CLIENTES',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.clientesService.getClientes(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  @Get('sin-visita')
  async sinVisita(@Query() query: ClientesSinVisitaDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'CLIENTES',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.clientesService.getSinVisita(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  @Get('top-gasto')
  async topGasto(@Query() query: ClientesTopGastoDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'CLIENTES',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.clientesService.getTopGasto(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }
}
