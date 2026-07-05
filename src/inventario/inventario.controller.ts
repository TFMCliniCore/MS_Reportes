import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { InventarioService } from './inventario.service';
import { StockDto, MovimientosDto, ValoracionDto } from './dto/reporte-inventario.dto';
import { ReporteMeta } from '../interceptors/reporte-log.interceptor';

@ApiTags('Reportes - Inventario')
@Controller('reportes/inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get('stock')
  @ApiOperation({ summary: 'Consultar niveles de stock actuales, stock crítico y alertas de reposición' })
  async stock(@Query() query: StockDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'INVENTARIO',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.inventarioService.getStock(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  @Get('movimientos')
  @ApiOperation({ summary: 'Auditar el flujo de movimientos de stock (entradas, salidas y ajustes por merma)' })
  async movimientos(@Query() query: MovimientosDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'INVENTARIO',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.inventarioService.getMovimientos(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  @Get('valoracion')
  @ApiOperation({ summary: 'Generar balance de la valoración monetaria del inventario disponible en almacenes' })
  async valoracion(@Query() query: ValoracionDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'INVENTARIO',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.inventarioService.getValoracion(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }
}