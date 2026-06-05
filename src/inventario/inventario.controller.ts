import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { InventarioService } from './inventario.service';
import { StockDto, MovimientosDto, ValoracionDto } from './dto/reporte-inventario.dto';
import { ReporteMeta } from '../interceptors/reporte-log.interceptor';

@Controller('reportes/inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get('stock')
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
