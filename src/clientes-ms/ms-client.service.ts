import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MsClientService {
  private readonly logger = new Logger(MsClientService.name);

  private readonly urls: Record<string, string> = {
    entidades: process.env.MS_ENTIDADES_URL ?? 'http://localhost:3001/api/v1',
    inventario: process.env.MS_INVENTARIO_URL ?? 'http://localhost:3007/api/v1',
    agenda:     process.env.MS_AGENDA_URL     ?? 'http://localhost:3003/api/v1',
    historia:   process.env.MS_HISTORIA_URL   ?? 'http://localhost:3005/api/v1',
    ventas:     process.env.MS_VENTAS_URL     ?? 'http://localhost:3008/api/v1',
  };

  // ── Petición genérica ────────────────────────────────────────────────────

  async get<T>(
    ms: string,
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<{ data: T | null; fallido: boolean }> {
    const baseUrl = this.urls[ms];
    if (!baseUrl) {
      this.logger.error(`MS desconocido: ${ms}`);
      return { data: null, fallido: true };
    }

    const url = new URL(`${baseUrl}/${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    try {
      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        this.logger.warn(`MS ${ms} respondió ${res.status} en ${url.toString()}`);
        return { data: null, fallido: true };
      }

      const data = (await res.json()) as T;
      return { data, fallido: false };
    } catch (err) {
      this.logger.error(`MS ${ms} no disponible (${url.toString()}): ${(err as Error).message}`);
      return { data: null, fallido: true };
    }
  }

  // ── Petición que siempre devuelve un array normalizado ───────────────────
  // Maneja: array plano [], { data: [] }, { items: [] }, { data: { data: [] } }

  async getArray<T>(
    ms: string,
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<{ items: T[]; fallido: boolean }> {
    const { data, fallido } = await this.get<unknown>(ms, path, params);

    if (fallido || data === null || data === undefined) {
      return { items: [], fallido };
    }

    // Respuesta es directamente un array
    if (Array.isArray(data)) {
      return { items: data as T[], fallido: false };
    }

    if (typeof data === 'object') {
      const obj = data as Record<string, unknown>;

      // { data: [...] }
      if (Array.isArray(obj['data'])) {
        return { items: obj['data'] as T[], fallido: false };
      }

      // { items: [...] }
      if (Array.isArray(obj['items'])) {
        return { items: obj['items'] as T[], fallido: false };
      }

      // { data: { data: [...] } }  (paginación anidada)
      if (obj['data'] && typeof obj['data'] === 'object') {
        const inner = obj['data'] as Record<string, unknown>;
        if (Array.isArray(inner['data'])) {
          return { items: inner['data'] as T[], fallido: false };
        }
      }
    }

    this.logger.warn(`MS ${ms} — formato de respuesta inesperado en ${path}`);
    return { items: [], fallido: false };
  }
}
