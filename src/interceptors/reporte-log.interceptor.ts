import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export interface ReporteMeta {
  tipo: string;
  parametros: Record<string, unknown>;
  usuarioId: number;
  sucursalId?: number;
  fuentesFallidas?: string[];
}

@Injectable()
export class ReporteLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { reporteMeta?: ReporteMeta }>();
    const inicio = Date.now();

    return next.handle().pipe(
      tap(async () => {
        const meta = req.reporteMeta;
        if (!meta) return;

        const duracionMs = Date.now() - inicio;
        const estado = (meta.fuentesFallidas?.length ?? 0) > 0 ? 'PARCIAL' : 'EXITOSO';

        await this.prisma.reportLog.create({
          data: {
            tipo: meta.tipo,
            formato: 'JSON',
            parametros: meta.parametros as object,
            estado,
            fuentesFallidas: meta.fuentesFallidas ?? [],
            duracionMs,
            usuarioId: meta.usuarioId,
            sucursalId: meta.sucursalId,
          },
        });
      }),
      catchError(async (err: Error) => {
        const meta = req.reporteMeta;
        if (meta) {
          await this.prisma.reportLog.create({
            data: {
              tipo: meta.tipo,
              formato: 'JSON',
              parametros: meta.parametros as object,
              estado: 'FALLIDO',
              fuentesFallidas: meta.fuentesFallidas ?? [],
              duracionMs: Date.now() - inicio,
              usuarioId: meta.usuarioId,
              sucursalId: meta.sucursalId,
              errorDetalle: err.message?.slice(0, 1000),
            },
          });
        }
        return throwError(() => err);
      }),
    );
  }
}
