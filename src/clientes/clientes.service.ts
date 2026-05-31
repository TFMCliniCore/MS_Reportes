import { Injectable } from '@nestjs/common';
import { MsClientService } from '../clientes-ms/ms-client.service';
import { ReporteClientesDto, ClientesSinVisitaDto, ClientesTopGastoDto } from './dto/reporte-clientes.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly msClient: MsClientService) {}

  async getClientes(dto: ReporteClientesDto) {
    const { items, fallido } = await this.msClient.getArray<unknown>(
      'entidades',
      'clientes',
      { sucursalId: dto.sucursalId },
    );

    return {
      data: items,
      resumen: { total: items.length },
      fuentesFallidas: fallido ? ['entidades'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  async getSinVisita(dto: ClientesSinVisitaDto) {
    // MS Entidades no tiene este endpoint aún; se devuelve aviso en fuentesFallidas
    const { items, fallido } = await this.msClient.getArray<unknown>(
      'entidades',
      'clientes/sin-visita',
      { dias: dto.diasSinVisita, sucursalId: dto.sucursalId },
    );

    return {
      data: items,
      resumen: { total: items.length, diasUmbral: dto.diasSinVisita },
      fuentesFallidas: fallido ? ['entidades'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  async getTopGasto(dto: ClientesTopGastoDto) {
    const { items, fallido } = await this.msClient.getArray<unknown>(
      'ventas',
      'ventas/top-clientes',
      { desde: dto.desde, hasta: dto.hasta, limite: dto.limite, sucursalId: dto.sucursalId },
    );

    return {
      data: items,
      resumen: { limite: dto.limite ?? 20 },
      fuentesFallidas: fallido ? ['ventas'] : [],
      generadoEn: new Date().toISOString(),
    };
  }
}
