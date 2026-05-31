import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MsClientService } from '../clientes-ms/ms-client.service';
import { Prisma } from '@prisma/client';

interface Producto {
  cantidadActual?: number;
  cantidadMinima?: number;
  precioCompra?: number;
  precioVenta?: number;
  nombre?: string;
  [key: string]: unknown;
}

interface Cita {
  estado?: string;
  fecha?: string;
  [key: string]: unknown;
}

@Injectable()
export class MetricasService {
  private readonly logger = new Logger(MetricasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly msClient: MsClientService,
  ) {}

  // ── Dashboard en tiempo real ───────────────────────────────────────────────

  async getDashboard(sucursalId?: number) {
    const params: Record<string, number | undefined> = { sucursalId };

    const hoyInicio = this.fechaHoy('inicio');
    const hoyFin    = this.fechaHoy('fin');
    const mesInicio = this.fechaMes('inicio');
    const mesFin    = this.fechaMes('fin');

    const [
      productosRes,
      pacientesRes,
      clientesRes,
      citasHoyRes,
      citasMesRes,
    ] = await Promise.all([
      this.msClient.getArray<Producto>('inventario', 'productos', params),
      this.msClient.getArray<unknown>('entidades', 'pacientes', params),
      this.msClient.getArray<unknown>('entidades', 'clientes', params),
      this.msClient.getArray<Cita>('agenda', 'citas', {
        desde: hoyInicio,
        hasta: hoyFin,
      }),
      this.msClient.getArray<Cita>('agenda', 'citas', {
        desde: mesInicio,
        hasta: mesFin,
      }),
    ]);

    const fuentesFallidas: string[] = [];
    if (productosRes.fallido) fuentesFallidas.push('inventario');
    if (pacientesRes.fallido || clientesRes.fallido) fuentesFallidas.push('entidades');
    if (citasHoyRes.fallido) fuentesFallidas.push('agenda');

    const productos = productosRes.items;
    const resumenInventario = this.calcularInventario(productos);

    const citasHoy = citasHoyRes.items;
    const citasMes = citasMesRes.items;
    const resumenCitasMes = this.calcularCitas(citasMes);

    return {
      inventario: resumenInventario,
      pacientes: { total: pacientesRes.items.length },
      clientes: { total: clientesRes.items.length },
      agenda: {
        citasHoy: citasHoy.length,
        citasMes: citasMes.length,
        completadasMes: resumenCitasMes.completadas,
        canceladasMes:  resumenCitasMes.canceladas,
        pendientesMes:  resumenCitasMes.pendientes,
        tasaCompletadasMes: resumenCitasMes.tasaCompletadas,
      },
      fuentesFallidas,
      generadoEn: new Date().toISOString(),
    };
  }

  // ── Métricas de inventario en tiempo real ─────────────────────────────────

  async getMetricasInventario(sucursalId?: number) {
    const { items, fallido } = await this.msClient.getArray<Producto>(
      'inventario',
      'productos',
      { sucursalId },
    );

    return {
      ...this.calcularInventario(items),
      fuentesFallidas: fallido ? ['inventario'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  // ── Métricas de citas en tiempo real ──────────────────────────────────────

  async getMetricasCitas(sucursalId?: number) {
    const mesInicio = this.fechaMes('inicio');
    const mesFin    = this.fechaMes('fin');

    const { items, fallido } = await this.msClient.getArray<Cita>(
      'agenda',
      'citas',
      { desde: mesInicio, hasta: mesFin },
    );

    const resumen = this.calcularCitas(items);

    // Agrupación por tipo de servicio
    const porTipo = items.reduce<Record<string, number>>((acc, c) => {
      const tipo = String(c['tipo'] ?? 'Sin tipo');
      acc[tipo] = (acc[tipo] ?? 0) + 1;
      return acc;
    }, {});

    return {
      periodo: 'MES',
      total: resumen.total,
      completadas: resumen.completadas,
      canceladas: resumen.canceladas,
      pendientes: resumen.pendientes,
      tasaCompletadas: resumen.tasaCompletadas,
      tasaCanceladas: resumen.tasaCanceladas,
      porTipo,
      fuentesFallidas: fallido ? ['agenda'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  // ── Métricas de ventas en tiempo real ────────────────────────────────────

  async getMetricasVentas(sucursalId?: number, periodo?: string) {
    const { inicio, fin } = this.rangoParaPeriodo(periodo ?? 'MES');

    const { items, fallido } = await this.msClient.getArray<Record<string, unknown>>(
      'ventas',
      'ventas',
      { desde: inicio, hasta: fin, sucursalId, agrupacion: 'dia' },
    );

    const totalVentas = items.reduce(
      (sum, v) => sum + Number(v['total'] ?? v['monto'] ?? 0),
      0,
    );
    const totalTransacciones = items.reduce(
      (sum, v) => sum + Number(v['transacciones'] ?? v['count'] ?? 1),
      0,
    );

    return {
      periodo: periodo ?? 'MES',
      totalVentas: Number(totalVentas.toFixed(2)),
      totalTransacciones,
      ticketPromedio: totalTransacciones > 0
        ? Number((totalVentas / totalTransacciones).toFixed(2))
        : 0,
      detalle: items,
      fuentesFallidas: fallido ? ['ventas'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  // ── Cron: persiste snapshots cada 10 minutos ──────────────────────────────

  @Cron(CronExpression.EVERY_10_MINUTES)
  async recalcularSnapshots() {
    this.logger.log('Recalculando snapshots de métricas...');
    try {
      const dashboard = await this.getDashboard();
      const now = new Date();

      await this.prisma.metricaSnapshot.updateMany({
        where: { vigente: true },
        data: { vigente: false },
      });

      const snapshots: Prisma.MetricaSnapshotCreateManyInput[] = [
        {
          clave: 'total_productos',
          valor: new Prisma.Decimal(dashboard.inventario.totalProductos),
          periodo: 'HOY', calculadoEn: now, vigente: true,
        },
        {
          clave: 'valor_inventario',
          valor: new Prisma.Decimal(dashboard.inventario.valorInventarioVenta),
          periodo: 'HOY', calculadoEn: now, vigente: true,
        },
        {
          clave: 'stock_critico',
          valor: new Prisma.Decimal(dashboard.inventario.stockBajo),
          periodo: 'HOY', calculadoEn: now, vigente: true,
        },
        {
          clave: 'total_pacientes',
          valor: new Prisma.Decimal(dashboard.pacientes.total),
          periodo: 'HOY', calculadoEn: now, vigente: true,
        },
        {
          clave: 'total_clientes',
          valor: new Prisma.Decimal(dashboard.clientes.total),
          periodo: 'HOY', calculadoEn: now, vigente: true,
        },
        {
          clave: 'citas_hoy',
          valor: new Prisma.Decimal(dashboard.agenda.citasHoy),
          periodo: 'HOY', calculadoEn: now, vigente: true,
        },
        {
          clave: 'citas_mes',
          valor: new Prisma.Decimal(dashboard.agenda.citasMes),
          periodo: 'MES', calculadoEn: now, vigente: true,
        },
      ];

      await this.prisma.metricaSnapshot.createMany({ data: snapshots });
      this.logger.log(`Snapshots actualizados: ${snapshots.length} métricas`);
    } catch (err) {
      this.logger.error('Error recalculando snapshots', (err as Error).message);
    }
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  private calcularInventario(productos: Producto[]) {
    let valorCompra = 0;
    let valorVenta  = 0;
    let stockBajo   = 0;

    for (const p of productos) {
      const qty = Number(p.cantidadActual ?? 0);
      valorCompra += qty * Number(p.precioCompra ?? 0);
      valorVenta  += qty * Number(p.precioVenta  ?? 0);
      if (qty <= Number(p.cantidadMinima ?? 0)) stockBajo++;
    }

    return {
      totalProductos: productos.length,
      valorInventarioCompra: Number(valorCompra.toFixed(2)),
      valorInventarioVenta:  Number(valorVenta.toFixed(2)),
      stockBajo,
    };
  }

  private calcularCitas(citas: Cita[]) {
    const total      = citas.length;
    const completadas = citas.filter((c) => c['estado'] === 'COMPLETADO').length;
    const canceladas  = citas.filter((c) => c['estado'] === 'CANCELADO').length;
    const pendientes  = citas.filter((c) => c['estado'] === 'NO_COMPLETADO').length;

    return {
      total,
      completadas,
      canceladas,
      pendientes,
      tasaCompletadas: total > 0 ? Number(((completadas / total) * 100).toFixed(1)) : 0,
      tasaCanceladas:  total > 0 ? Number(((canceladas  / total) * 100).toFixed(1)) : 0,
    };
  }

  private fechaHoy(extremo: 'inicio' | 'fin'): string {
    const d = new Date();
    if (extremo === 'inicio') {
      d.setHours(0, 0, 0, 0);
    } else {
      d.setHours(23, 59, 59, 999);
    }
    return d.toISOString();
  }

  private fechaMes(extremo: 'inicio' | 'fin'): string {
    const d = new Date();
    if (extremo === 'inicio') {
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
    } else {
      d.setMonth(d.getMonth() + 1, 0);
      d.setHours(23, 59, 59, 999);
    }
    return d.toISOString();
  }

  private rangoParaPeriodo(periodo: string): { inicio: string; fin: string } {
    const ahora = new Date();
    const fin   = new Date(ahora);
    fin.setHours(23, 59, 59, 999);
    const inicio = new Date(ahora);

    switch (periodo.toUpperCase()) {
      case 'HOY':
        inicio.setHours(0, 0, 0, 0);
        break;
      case 'SEMANA':
        inicio.setDate(ahora.getDate() - 7);
        inicio.setHours(0, 0, 0, 0);
        break;
      case 'TRIMESTRE':
        inicio.setMonth(ahora.getMonth() - 3, 1);
        inicio.setHours(0, 0, 0, 0);
        break;
      case 'ANUAL':
        inicio.setFullYear(ahora.getFullYear(), 0, 1);
        inicio.setHours(0, 0, 0, 0);
        break;
      default: // MES
        inicio.setDate(1);
        inicio.setHours(0, 0, 0, 0);
    }

    return { inicio: inicio.toISOString(), fin: fin.toISOString() };
  }
}
