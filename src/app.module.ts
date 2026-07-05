import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { MsClientModule } from './clientes-ms/ms-client.module';
import { ReporteLogInterceptor } from './interceptors/reporte-log.interceptor';

import { MetricasModule } from './metricas/metricas.module';
import { ClientesModule } from './clientes/clientes.module';
import { PacientesModule } from './pacientes/pacientes.module';
import { CitasModule } from './citas/citas.module';
import { InventarioModule } from './inventario/inventario.module';
import { VentasModule } from './ventas/ventas.module';

import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    MsClientModule,
    MetricasModule,
    ClientesModule,
    PacientesModule,
    CitasModule,
    InventarioModule,
    VentasModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ReporteLogInterceptor,
    },
  ],
})
export class AppModule {}
