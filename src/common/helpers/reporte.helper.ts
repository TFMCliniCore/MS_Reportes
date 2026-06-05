export function validarRangoFechas(fechaInicio: string, fechaFin: string, maxDias: number = 366) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diffDias = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDias < 0) throw new Error('fechaFin debe ser posterior a fechaInicio');
  if (diffDias > maxDias) throw new Error(`El rango no puede superar ${maxDias} días`);
}
