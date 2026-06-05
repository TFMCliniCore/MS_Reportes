import { IsDateString, IsIn, IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReporteBaseDto } from '../../common/dto/reporte-base.dto';

export class ReporteVentasDto extends ReporteBaseDto {
  @IsOptional()
  @IsIn(['dia', 'semana', 'mes'])
  agrupacion?: 'dia' | 'semana' | 'mes' = 'dia';
}

export class TopProductosDto extends ReporteBaseDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 20;
}

export class VentasCategoriaDto extends ReporteBaseDto {}

export class CajaDiariaDto {
  @IsDateString()
  fecha!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sucursalId!: number;
}
