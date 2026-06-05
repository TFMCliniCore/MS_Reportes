import { IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReporteClientesDto {
  // MS Entidades no filtra por fecha; devuelve todos los clientes activos
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId?: number;
}

export class ClientesSinVisitaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  diasSinVisita!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId?: number;
}

export class ClientesTopGastoDto {
  @IsOptional()
  @IsString()
  desde?: string; // fecha ISO

  @IsOptional()
  @IsString()
  hasta?: string; // fecha ISO

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 20;
}
