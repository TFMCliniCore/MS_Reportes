import { IsIn, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

// Tipos reales de movimiento en MS Inventario
export const TIPOS_MOVIMIENTO = ['ENTRADA', 'SALIDA', 'AJUSTE'] as const;

export class StockDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoriaId?: number;

  // stockBajo=true filtra cantidadActual <= cantidadMinima
  @IsOptional()
  @IsString()
  stockBajo?: string;
}

export class MovimientosDto {
  // MS Inventario acepta: productoId, tipo, sucursalId, usuarioId
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  productoId?: number;

  @IsOptional()
  @IsIn(TIPOS_MOVIMIENTO)
  tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  usuarioId?: number;
}

export class ValoracionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId?: number;
}
