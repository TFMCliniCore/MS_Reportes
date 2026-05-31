import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CacheService {
  private readonly ttlMs: number;

  constructor(private readonly prisma: PrismaService) {
    const ttlMinutes = Number(process.env.CACHE_TTL_MINUTES ?? 5);
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  buildHash(tipo: string, params: Record<string, unknown>): string {
    const normalized = JSON.stringify({ tipo, ...params }, Object.keys({ tipo, ...params }).sort());
    return createHash('sha256').update(normalized).digest('hex');
  }

  async get(claveHash: string): Promise<Buffer | null> {
    const entry = await this.prisma.reporteCache.findUnique({ where: { claveHash } });
    if (!entry) return null;
    if (entry.expiresAt < new Date()) {
      await this.prisma.reporteCache.delete({ where: { claveHash } });
      return null;
    }
    return Buffer.from(entry.datos);
  }

  async set(
    claveHash: string,
    tipo: string,
    formato: string,
    datos: Buffer,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + this.ttlMs);
    await this.prisma.reporteCache.upsert({
      where: { claveHash },
      update: { datos: new Uint8Array(datos), bytesArchivo: datos.length, expiresAt },
      create: { claveHash, tipo, formato, datos: new Uint8Array(datos), bytesArchivo: datos.length, expiresAt },
    });
  }

  async purgeExpired(): Promise<void> {
    await this.prisma.reporteCache.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }
}
