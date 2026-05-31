import { Injectable } from '@nestjs/common';
import { MsClientService } from '../clientes-ms/ms-client.service';
import { ReporteCitasDto, ReporteRecordatoriosDto, ReporteSalaEsperaDto } from './dto/reporte-citas.dto';

@Injectable()
export class CitasService {
  constructor(private readonly msClient: MsClientService) {}

  async getCitas(dto: ReporteCitasDto) {
    const { items, fallido } = await this.msClient.getArray<Record<string, unknown>>(
      'agenda',
      'citas',
      {
        desde: dto.desde,
        hasta: dto.hasta,
        estado: dto.estado,
        tipo: dto.tipo,
        pacienteId: dto.pacienteId,
      },
    );

    const resumen = this.calcularResumenCitas(items);

    return {
      data: items,
      resumen,
      fuentesFallidas: fallido ? ['agenda'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  async getTasaAsistencia(dto: ReporteCitasDto) {
    // MS Agenda no tiene endpoint propio de tasa de asistencia.
    // Se calcula aquí agregando todas las citas del período.
    const { items, fallido } = await this.msClient.getArray<Record<string, unknown>>(
      'agenda',
      'citas',
      { desde: dto.desde, hasta: dto.hasta, pacienteId: dto.pacienteId },
    );

    const resumen = this.calcularResumenCitas(items);
    const total = items.length;

    return {
      data: items,
      resumen: {
        ...resumen,
        tasaCompletadas: total > 0 ? Number(((resumen.completadas / total) * 100).toFixed(1)) : 0,
        tasaCanceladas:  total > 0 ? Number(((resumen.canceladas  / total) * 100).toFixed(1)) : 0,
        tasaPendientes:  total > 0 ? Number(((resumen.pendientes  / total) * 100).toFixed(1)) : 0,
      },
      fuentesFallidas: fallido ? ['agenda'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  async getRecordatorios(dto: ReporteRecordatoriosDto) {
    const { items, fallido } = await this.msClient.getArray<unknown>(
      'agenda',
      'recordatorios',
      { desde: dto.desde, hasta: dto.hasta, estado: dto.estado, pacienteId: dto.pacienteId },
    );

    return {
      data: items,
      resumen: { total: items.length },
      fuentesFallidas: fallido ? ['agenda'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  async getSalaEspera(dto: ReporteSalaEsperaDto) {
    const { items, fallido } = await this.msClient.getArray<unknown>(
      'agenda',
      'sala-espera',
      { desde: dto.desde, hasta: dto.hasta, pacienteId: dto.pacienteId },
    );

    return {
      data: items,
      resumen: { total: items.length },
      fuentesFallidas: fallido ? ['agenda'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  // ── Helper privado ─────────────────────────────────────────────────────────

  private calcularResumenCitas(citas: Record<string, unknown>[]) {
    const completadas = citas.filter((c) => c['estado'] === 'COMPLETADO').length;
    const canceladas  = citas.filter((c) => c['estado'] === 'CANCELADO').length;
    const pendientes  = citas.filter((c) => c['estado'] === 'NO_COMPLETADO').length;

    const porTipo = citas.reduce<Record<string, number>>((acc, c) => {
      const tipo = String(c['tipo'] ?? 'Sin tipo');
      acc[tipo] = (acc[tipo] ?? 0) + 1;
      return acc;
    }, {});

    return { total: citas.length, completadas, canceladas, pendientes, porTipo };
  }
}
