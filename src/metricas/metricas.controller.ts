import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MetricasService } from './metricas.service';

@ApiTags('Reportes - Cuadros de Mando (KPIs)')
@Controller('reportes/metricas')
export class MetricasController {
  constructor(private readonly metricasService: MetricasService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Consolidar KPIs estratégicos globales para la vista principal de la gerencia' })
  getDashboard(@Query('sucursalId') sucursalId?: string) {
    return this.metricasService.getDashboard(
      sucursalId ? Number(sucursalId) : undefined,
    );
  }

  @Get('ventas')
  @ApiOperation({ summary: 'Obtener un desglose rápido del rendimiento comercial en un periodo definido' })
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
  @ApiOperation({ summary: 'Extraer indicadores de desempeño operativo basados en la gestión de citas' })
  getCitas(@Query('sucursalId') sucursalId?: string) {
    return this.metricasService.getMetricasCitas(
      sucursalId ? Number(sucursalId) : undefined,
    );
  }

  @Get('inventario')
  @ApiOperation({ summary: 'Obtener indicadores de rotación de productos e índices de desabastecimiento' })
  getInventario(@Query('sucursalId') sucursalId?: string) {
    return this.metricasService.getMetricasInventario(
      sucursalId ? Number(sucursalId) : undefined,
    );
  }
}