import { IsIn, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

// Estados reales del MS Agenda
export const ESTADOS_CITA = ['NO_COMPLETADO', 'COMPLETADO', 'CANCELADO'] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

export class ReporteCitasDto {
  @IsOptional()
  @IsString()
  desde?: string; // fecha ISO: filtro fecha >= desde

  @IsOptional()
  @IsString()
  hasta?: string; // fecha ISO: filtro fecha <= hasta

  @IsOptional()
  @IsIn(ESTADOS_CITA)
  estado?: EstadoCita;

  @IsOptional()
  @IsString()
  tipo?: string; // Consulta, Vacunacion, Cirugia, etc.

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pacienteId?: number;
}

export class ReporteRecordatoriosDto {
  @IsOptional()
  @IsString()
  desde?: string;

  @IsOptional()
  @IsString()
  hasta?: string;

  @IsOptional()
  @IsIn(ESTADOS_CITA)
  estado?: EstadoCita;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pacienteId?: number;
}

export class ReporteSalaEsperaDto {
  @IsOptional()
  @IsString()
  desde?: string;

  @IsOptional()
  @IsString()
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pacienteId?: number;
}
