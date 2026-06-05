import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions, StyleDictionary, TFontDictionary, Content } from 'pdfmake/interfaces';

const fonts: TFontDictionary = {
  Roboto: {
    normal: 'node_modules/pdfmake/build/vfs_fonts.js',
    bold: 'node_modules/pdfmake/build/vfs_fonts.js',
    italics: 'node_modules/pdfmake/build/vfs_fonts.js',
    bolditalics: 'node_modules/pdfmake/build/vfs_fonts.js',
  },
};

export interface PdfReporteOptions {
  titulo: string;
  nombreClinica?: string;
  fechaInicio?: string;
  fechaFin?: string;
  usuarioGenerador?: string;
  sucursal?: string;
  marcaAgua?: boolean;
  columnas: string[];
  filas: (string | number)[][];
  resumen?: Record<string, string | number>;
}

const BRAND_COLOR = '#0E314D';
const BRAND_COLOR_LIGHT = '#E8EFF5';

@Injectable()
export class PdfService {
  private readonly printer: PdfPrinter;

  constructor() {
    this.printer = new PdfPrinter(fonts);
  }

  async generarReporte(options: PdfReporteOptions): Promise<Buffer> {
    const {
      titulo,
      nombreClinica = 'CliniCore Veterinaria',
      fechaInicio,
      fechaFin,
      usuarioGenerador,
      sucursal,
      marcaAgua = false,
      columnas,
      filas,
      resumen,
    } = options;

    const ahora = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

    const headerCols = [
      columnas.map((col) => ({ text: col, style: 'tableHeader' })),
    ];

    const dataRows = filas.map((fila) =>
      fila.map((celda) => ({ text: String(celda), style: 'tableCell' })),
    );

    const bodyContent: Content[] = [];

    if (fechaInicio && fechaFin) {
      bodyContent.push({
        text: `Período: ${fechaInicio} — ${fechaFin}`,
        fontSize: 10,
        color: '#555555',
        margin: [0, 0, 0, 10],
      } as Content);
    }

    if (marcaAgua) {
      bodyContent.push({
        text: 'DOCUMENTO CONFIDENCIAL — Historia Clínica',
        bold: true,
        color: '#CC0000',
        fontSize: 10,
        margin: [0, 0, 0, 8],
      } as Content);
    }

    if (resumen && Object.keys(resumen).length > 0) {
      const resumenRows = Object.entries(resumen).map(([k, v]) => [
        { text: k, bold: true, fontSize: 10 },
        { text: String(v), fontSize: 10 },
      ]);
      bodyContent.push({
        style: 'resumenBox',
        table: { widths: ['*', '*'], body: resumenRows },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      } as Content);
    }

    bodyContent.push({
      table: {
        headerRows: 1,
        widths: Array(columnas.length).fill('*') as string[],
        body: [...headerCols, ...dataRows],
      },
      layout: {
        fillColor: (rowIndex: number) => {
          if (rowIndex === 0) return BRAND_COLOR;
          return rowIndex % 2 === 0 ? BRAND_COLOR_LIGHT : null;
        },
      },
    } as Content);

    const docDefinition: TDocumentDefinitions = {
      pageMargins: [40, 80, 40, 60],
      watermark: marcaAgua
        ? { text: 'CONFIDENCIAL', color: '#CC0000', opacity: 0.08, bold: true, angle: 45 }
        : undefined,
      header: (currentPage: number, _pageCount: number): Content => ({
        margin: [40, 20, 40, 0],
        columns: [
          {
            stack: [
              { text: '[ CliniCore ]', fontSize: 18, bold: true, color: BRAND_COLOR },
              { text: nombreClinica, fontSize: 10, color: '#555555' },
            ],
          },
          {
            stack: [
              { text: titulo, fontSize: 12, bold: true, color: BRAND_COLOR, alignment: 'right' },
              ...(sucursal ? [{ text: `Sucursal: ${sucursal}`, fontSize: 9, color: '#666666', alignment: 'right' as const }] : []),
            ],
          },
        ],
      }),
      footer: (currentPage: number, pageCount: number): Content => ({
        margin: [40, 0, 40, 10],
        columns: [
          {
            text: [
              { text: 'Generado: ', bold: true },
              ahora,
              ...(usuarioGenerador ? [` | Usuario: ${usuarioGenerador}`] : []),
            ],
            fontSize: 8,
            color: '#888888',
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: 'right',
            fontSize: 8,
            color: '#888888',
          },
        ],
      }),
      content: bodyContent,
      styles: {
        tableHeader: {
          bold: true,
          fontSize: 9,
          color: 'white',
          fillColor: BRAND_COLOR,
          margin: [4, 4, 4, 4],
        },
        tableCell: {
          fontSize: 9,
          margin: [3, 3, 3, 3],
        },
        resumenBox: {
          fontSize: 10,
        },
      } as StyleDictionary,
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
      },
    };

    return new Promise((resolve, reject) => {
      const doc = this.printer.createPdfKitDocument(docDefinition);
      const chunks: Uint8Array[] = [];
      doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }
}
