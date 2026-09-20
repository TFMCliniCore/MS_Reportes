import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { swaggerDocument } from '../main'; // 👈 Importamos el JSON generado en el bootstrap

@ApiTags('Health Check')
@Controller() // Dejar vacío si el global prefix es suficiente o pon 'health' si usas subrutas
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // 🚀 ENDPOINT PROXY COMPATIBLE: Fuerza la ruta exacta que el Gateway busca
  @Get('reportes/docs-json')
  @ApiOperation({ summary: 'Proxy JSON Swagger para el API Gateway' })
  getSwaggerJson() {
    return swaggerDocument;
  }

  @Get('health')
  @ApiOperation({ summary: 'Verificar el estado operativo del MS Reportes y su conectividad a la Base de Datos' })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', service: 'ms-reportes', db: 'connected' };
    } catch {
      return { status: 'degraded', service: 'ms-reportes', db: 'disconnected' };
    }
  }
}