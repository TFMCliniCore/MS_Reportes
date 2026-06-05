import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportePacientesDto {
  @IsOptional()
  @IsString()
  especie?: string;

  @IsOptional()
  @IsString()
  raza?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId?: number;
}

export class VacunasVencerDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  diasAlerta!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId?: number;
}

export class ReporteHistoriaClinicaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pacienteId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId?: number;

  @IsOptional()
  @IsString()
  desde?: string; // fecha ISO

  @IsOptional()
  @IsString()
  hasta?: string; // fecha ISO
}
