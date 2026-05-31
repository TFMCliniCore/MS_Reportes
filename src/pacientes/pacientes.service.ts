import { Injectable } from '@nestjs/common';
import { MsClientService } from '../clientes-ms/ms-client.service';
import { ReportePacientesDto, VacunasVencerDto, ReporteHistoriaClinicaDto } from './dto/reporte-pacientes.dto';

@Injectable()
export class PacientesService {
  constructor(private readonly msClient: MsClientService) {}

  async getPacientes(dto: ReportePacientesDto) {
    const { items, fallido } = await this.msClient.getArray<unknown>(
      'entidades',
      'pacientes',
      { especie: dto.especie, raza: dto.raza, sucursalId: dto.sucursalId },
    );

    return {
      data: items,
      resumen: { total: items.length },
      fuentesFallidas: fallido ? ['entidades'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  // Ficha completa de un paciente: paciente + historias + citas + recordatorios
  async getFichaClinica(pacienteId: number) {
    const fuentesFallidas: string[] = [];

    const [fichaRes, pacienteRes] = await Promise.all([
      this.msClient.get<{
        paciente: unknown;
        historias: unknown[];
        citas: unknown[];
        recordatorios: unknown[];
      }>('historia', `historia-clinica/ficha/${pacienteId}`),
      this.msClient.get<Record<string, unknown>>('entidades', `pacientes/${pacienteId}`),
    ]);

    if (fichaRes.fallido) fuentesFallidas.push('historia');
    if (pacienteRes.fallido) fuentesFallidas.push('entidades');

    const ficha = fichaRes.data;

    return {
      paciente: ficha?.paciente ?? pacienteRes.data ?? null,
      historias: ficha?.historias ?? [],
      citas: ficha?.citas ?? [],
      recordatorios: ficha?.recordatorios ?? [],
      fuentesFallidas,
      generadoEn: new Date().toISOString(),
    };
  }

  // Listado general de historias clínicas con filtros
  async getHistoriasClinicas(dto: ReporteHistoriaClinicaDto) {
    const { items, fallido } = await this.msClient.getArray<unknown>(
      'historia',
      'historia-clinica',
      {
        pacienteId: dto.pacienteId,
        sucursalId: dto.sucursalId,
        desde: dto.desde,
        hasta: dto.hasta,
      },
    );

    return {
      data: items,
      resumen: { total: items.length },
      fuentesFallidas: fallido ? ['historia'] : [],
      generadoEn: new Date().toISOString(),
    };
  }

  async getVacunasVencer(dto: VacunasVencerDto) {
    const { items, fallido } = await this.msClient.getArray<unknown>(
      'entidades',
      'pacientes/vacunas-vencer',
      { dias: dto.diasAlerta, sucursalId: dto.sucursalId },
    );

    return {
      data: items,
      resumen: { total: items.length, diasAlerta: dto.diasAlerta },
      fuentesFallidas: fallido ? ['entidades'] : [],
      generadoEn: new Date().toISOString(),
    };
  }
}
