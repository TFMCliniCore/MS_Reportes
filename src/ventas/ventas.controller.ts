import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { VentasService } from './ventas.service';
import { ReporteVentasDto, TopProductosDto, VentasCategoriaDto, CajaDiariaDto } from './dto/reporte-ventas.dto';
import { ReporteMeta } from '../interceptors/reporte-log.interceptor';

@ApiTags('Reportes - Ventas y Caja')
@Controller('reportes/ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener reporte detallado de facturación, ventas totales e impuestos acumulados' })
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
  @ApiOperation({ summary: 'Analizar volúmenes de facturación discriminados por producto o servicio médico' })
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
  @ApiOperation({ summary: 'Visualizar la distribución de ingresos por categorías comerciales del ecosistema' })
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
  @ApiOperation({ summary: 'Generar reportes de flujos de efectivo, entradas, salidas y cierres de caja diaria' })
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