import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';

export interface ExcelReporteOptions {
  titulo: string;
  nombreClinica?: string;
  fechaInicio?: string;
  fechaFin?: string;
  usuarioGenerador?: string;
  sucursal?: string;
  columnas: string[];
  filas: (string | number | null)[][];
  resumen?: Record<string, string | number>;
}

const HEADER_COLOR = '0E314D';
const HEADER_FONT_COLOR = 'FFFFFF';
const ALT_ROW_COLOR = 'E8EFF5';

@Injectable()
export class ExcelService {
  async generarReporte(options: ExcelReporteOptions): Promise<Buffer> {
    const {
      titulo,
      nombreClinica = 'CliniCore Veterinaria',
      fechaInicio,
      fechaFin,
      usuarioGenerador,
      sucursal,
      columnas,
      filas,
      resumen,
    } = options;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MS Reportes CliniCore';
    workbook.created = new Date();

    this.crearHojaResumen(workbook, {
      titulo,
      nombreClinica,
      fechaInicio,
      fechaFin,
      usuarioGenerador,
      sucursal,
      resumen,
    });

    this.crearHojaDatos(workbook, titulo, columnas, filas);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private crearHojaResumen(
    workbook: ExcelJS.Workbook,
    info: {
      titulo: string;
      nombreClinica?: string;
      fechaInicio?: string;
      fechaFin?: string;
      usuarioGenerador?: string;
      sucursal?: string;
      resumen?: Record<string, string | number>;
    },
  ) {
    const sheet = workbook.addWorksheet('Resumen');

    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = info.titulo;
    titleCell.font = { bold: true, size: 16, color: { argb: HEADER_FONT_COLOR } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 36;

    sheet.mergeCells('A2:D2');
    const clinicaCell = sheet.getCell('A2');
    clinicaCell.value = info.nombreClinica ?? 'CliniCore Veterinaria';
    clinicaCell.font = { size: 12, color: { argb: HEADER_FONT_COLOR } };
    clinicaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2B5F8E' } };
    clinicaCell.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 24;

    let rowIdx = 4;
    const metaRows: [string, string][] = [
      ['Período', [info.fechaInicio, info.fechaFin].filter(Boolean).join(' — ')],
      ['Sucursal', info.sucursal ?? 'Todas'],
      ['Generado por', info.usuarioGenerador ?? 'Sistema'],
      ['Fecha de generación', new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })],
    ];

    for (const [label, value] of metaRows) {
      const labelCell = sheet.getCell(`A${rowIdx}`);
      labelCell.value = label;
      labelCell.font = { bold: true };
      sheet.getCell(`B${rowIdx}`).value = value;
      rowIdx++;
    }

    if (info.resumen && Object.keys(info.resumen).length > 0) {
      rowIdx++;
      const hdr = sheet.getCell(`A${rowIdx}`);
      hdr.value = 'Resumen Ejecutivo';
      hdr.font = { bold: true, size: 12, color: { argb: HEADER_FONT_COLOR } };
      hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
      sheet.mergeCells(`A${rowIdx}:B${rowIdx}`);
      rowIdx++;

      for (const [k, v] of Object.entries(info.resumen)) {
        sheet.getCell(`A${rowIdx}`).value = k;
        sheet.getCell(`A${rowIdx}`).font = { bold: true };
        sheet.getCell(`B${rowIdx}`).value = v;
        rowIdx++;
      }
    }

    sheet.getColumn('A').width = 28;
    sheet.getColumn('B').width = 40;

    this.agregarPiePagina(sheet);
  }

  private crearHojaDatos(
    workbook: ExcelJS.Workbook,
    titulo: string,
    columnas: string[],
    filas: (string | number | null)[][],
  ) {
    const sheet = workbook.addWorksheet('Datos');

    const headerRow = sheet.addRow(columnas);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
      cell.font = { bold: true, color: { argb: HEADER_FONT_COLOR }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        bottom: { style: 'medium', color: { argb: HEADER_FONT_COLOR } },
      };
    });
    headerRow.height = 24;

    filas.forEach((fila, idx) => {
      const row = sheet.addRow(fila);
      if (idx % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALT_ROW_COLOR } };
        });
      }
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
      });
    });

    columnas.forEach((_, i) => {
      sheet.getColumn(i + 1).width = 20;
    });

    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columnas.length },
    };

    this.agregarPiePagina(sheet);
  }

  private agregarPiePagina(sheet: ExcelJS.Worksheet) {
    const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    sheet.headerFooter.oddFooter = `&LCliniCore — Documento generado el ${fecha}&RPágina &P de &N`;
  }
}
