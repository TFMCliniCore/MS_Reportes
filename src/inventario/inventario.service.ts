import { Injectable } from '@nestjs/common';
import { MsClientService } from '../clientes-ms/ms-client.service';
import { StockDto, MovimientosDto, ValoracionDto } from './dto/reporte-inventario.dto';

@Injectable()
export class InventarioService {
  constructor(private readonly msClient: MsClientService) {}

  async getStock(dto: StockDto) {
    const { items, fallido } = await this.msClient.getArray<Record<string, unknown>>(
      'inventario',
      'productos',
      {
        sucursalId: dto.sucursalId,
        categoriaId: dto.categoriaId,
        stockBajo: dto.stockBajo,
      },
    );

    const bajosStock = items.filter(
      (p) => Number(p['cantidadActual']) <= Number(p['cantidadMinima']),
    ).length;

    return {
      data: items,
      resumen: { total: items.length, bajosStock },
      fuentesFallidas: fallido ? ['inventario'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  async getMovimientos(dto: MovimientosDto) {
    const { items, fallido } = await this.msClient.getArray<unknown>(
      'inventario',
      'movimientos-stock',
      {
        productoId: dto.productoId,
        tipo: dto.tipo,
        sucursalId: dto.sucursalId,
        usuarioId: dto.usuarioId,
      },
    );

    return {
      data: items,
      resumen: { total: items.length },
      fuentesFallidas: fallido ? ['inventario'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  async getValoracion(dto: ValoracionDto) {
    const { items, fallido } = await this.msClient.getArray<Record<string, unknown>>(
      'inventario',
      'productos',
      { sucursalId: dto.sucursalId },
    );

    let totalCompra = 0;
    let totalVenta = 0;

    for (const p of items) {
      const qty = Number(p['cantidadActual'] ?? 0);
      totalCompra += qty * Number(p['precioCompra'] ?? 0);
      totalVenta  += qty * Number(p['precioVenta']  ?? 0);
    }

    return {
      data: items,
      resumen: {
        totalValorCompra: Number(totalCompra.toFixed(2)),
        totalValorVenta:  Number(totalVenta.toFixed(2)),
        margenPotencial:  Number((totalVenta - totalCompra).toFixed(2)),
        totalProductos:   items.length,
      },
      fuentesFallidas: fallido ? ['inventario'] : [],
      generadoEn: new Date().toISOString(),
    };
  }
}
