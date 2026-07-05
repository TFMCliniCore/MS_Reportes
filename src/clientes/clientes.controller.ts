import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ClientesService } from './clientes.service';
import { ReporteClientesDto, ClientesSinVisitaDto, ClientesTopGastoDto } from './dto/reporte-clientes.dto';
import { ReporteMeta } from '../interceptors/reporte-log.interceptor';

@ApiTags('Reportes - Clientes')
@Controller('reportes/clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar reportes consolidados de cuentas de clientes, registros y sucursales' })
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
  @ApiOperation({ summary: 'Identificar clientes inactivos o que no han agendado citas en un periodo de tiempo' })
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
  @ApiOperation({ summary: 'Consultar ranking de los clientes con mayor volumen de facturación o inversión' })
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