import { Controller, Get, Query } from '@nestjs/common';
import { MetricasService } from './metricas.service';

@Controller('reportes/metricas')
export class MetricasController {
  constructor(private readonly metricasService: MetricasService) {}

  @Get('dashboard')
  getDashboard(@Query('sucursalId') sucursalId?: string) {
    return this.metricasService.getDashboard(
      sucursalId ? Number(sucursalId) : undefined,
    );
  }

  @Get('ventas')
  getVentas(
    @Query('sucursalId') sucursalId?: string,
    @Query('periodo') periodo?: string,
  ) {
    return this.metricasService.getMetricasVentas(
      sucursalId ? Number(sucursalId) : undefined,
      periodo,
    );
  }

  @Get('citas')
  getCitas(@Query('sucursalId') sucursalId?: string) {
    return this.metricasService.getMetricasCitas(
      sucursalId ? Number(sucursalId) : undefined,
    );
  }

  @Get('inventario')
  getInventario(@Query('sucursalId') sucursalId?: string) {
    return this.metricasService.getMetricasInventario(
      sucursalId ? Number(sucursalId) : undefined,
    );
  }
}
