import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { VentasService } from './ventas.service';
import { ReporteVentasDto, TopProductosDto, VentasCategoriaDto, CajaDiariaDto } from './dto/reporte-ventas.dto';
import { ReporteMeta } from '../interceptors/reporte-log.interceptor';

@Controller('reportes/ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get()
  async ventas(@Query() query: ReporteVentasDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'VENTAS',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.ventasService.getVentas(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  @Get('por-producto')
  async porProducto(@Query() query: TopProductosDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'VENTAS',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.ventasService.getTopProductos(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  @Get('por-categoria')
  async porCategoria(@Query() query: VentasCategoriaDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'VENTAS',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.ventasService.getPorCategoria(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }

  @Get('caja-diaria')
  async cajaDiaria(@Query() query: CajaDiariaDto, @Req() req: Request & { reporteMeta?: ReporteMeta }) {
    req.reporteMeta = {
      tipo: 'CAJA',
      parametros: query as unknown as Record<string, unknown>,
      usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
      sucursalId: query.sucursalId,
    };
    const result = await this.ventasService.getCajaDiaria(query);
    req.reporteMeta.fuentesFallidas = result.fuentesFallidas;
    return result;
  }
}
