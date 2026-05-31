import { Injectable } from '@nestjs/common';
import { MsClientService } from '../clientes-ms/ms-client.service';
import { validarRangoFechas } from '../common/helpers/reporte.helper';
import { ReporteVentasDto, TopProductosDto, VentasCategoriaDto, CajaDiariaDto } from './dto/reporte-ventas.dto';

@Injectable()
export class VentasService {
  constructor(private readonly msClient: MsClientService) {}

  async getVentas(dto: ReporteVentasDto) {
    validarRangoFechas(dto.fechaInicio, dto.fechaFin);

    const { items, fallido } = await this.msClient.getArray<unknown>(
      'ventas',
      'ventas',
      { fechaInicio: dto.fechaInicio, fechaFin: dto.fechaFin, sucursalId: dto.sucursalId, agrupacion: dto.agrupacion },
    );

    return {
      data: items,
      resumen: { total: items.length },
      fuentesFallidas: fallido ? ['ventas'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  async getTopProductos(dto: TopProductosDto) {
    validarRangoFechas(dto.fechaInicio, dto.fechaFin);

    const { items, fallido } = await this.msClient.getArray<unknown>(
      'ventas',
      'ventas/top-productos',
      { fechaInicio: dto.fechaInicio, fechaFin: dto.fechaFin, limite: dto.limite, sucursalId: dto.sucursalId },
    );

    return {
      data: items,
      resumen: { limite: dto.limite ?? 20 },
      fuentesFallidas: fallido ? ['ventas'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  async getPorCategoria(dto: VentasCategoriaDto) {
    validarRangoFechas(dto.fechaInicio, dto.fechaFin);

    const { items, fallido } = await this.msClient.getArray<unknown>(
      'ventas',
      'ventas/por-categoria',
      { fechaInicio: dto.fechaInicio, fechaFin: dto.fechaFin, sucursalId: dto.sucursalId },
    );

    return {
      data: items,
      resumen: { total: items.length },
      fuentesFallidas: fallido ? ['ventas'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  async getCajaDiaria(dto: CajaDiariaDto) {
    const { items, fallido } = await this.msClient.getArray<unknown>(
      'ventas',
      'ventas/caja-diaria',
      { fecha: dto.fecha, sucursalId: dto.sucursalId },
    );

    return {
      data: items,
      resumen: { total: items.length },
      fuentesFallidas: fallido ? ['ventas'] : [],
      generadoEn: new Date().toISOString(),
    };
  }
}
