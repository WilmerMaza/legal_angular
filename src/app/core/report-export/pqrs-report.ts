import {
  describirCambio,
  formatFechaHoraHistorial,
  formatValorHistorial,
  tituloAccionHistorial,
} from '../historial-cambios';
import type { PqrInforme } from '../services/pqrs.service';

export const PQRS_INFORME_HEADERS = [
  'Radicado',
  'Solicitante',
  'Entidad',
  'Asunto',
  'Estado',
  'Radicación',
  'Vencimiento',
  'Cerrada',
] as const;

export const PQRS_TRAZABILIDAD_HEADERS = ['Radicado', 'Fecha', 'Movimiento', 'Detalle'] as const;

export function buildPqrsInformeRows(pqrs: PqrInforme[]): string[][] {
  return pqrs.map((p) => [
    p.radicado || '—',
    p.solicitante,
    p.entidad,
    p.asunto,
    p.estado || '—',
    formatValorHistorial('fecha_radicacion', p.fecha_radicacion),
    formatValorHistorial('vencimiento', p.vencimiento),
    p.cerrada ? 'Sí' : 'No',
  ]);
}

/** Movimientos de cada PQR en orden cronológico. */
export function buildPqrsTrazabilidadRows(pqrs: PqrInforme[]): string[][] {
  const rows: string[][] = [];
  for (const p of pqrs) {
    const radicado = p.radicado || 'Sin radicado';
    const historial = [...p.historial].sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (!historial.some((h) => h.accion === 'creada')) {
      rows.push([radicado, formatFechaHoraHistorial(p.created_at), tituloAccionHistorial('pqr', 'creada'), '—']);
    }
    for (const h of historial) {
      rows.push([
        radicado,
        formatFechaHoraHistorial(h.created_at),
        tituloAccionHistorial('pqr', h.accion),
        h.cambios.map((c) => describirCambio('pqr', c)).join('\n') || '—',
      ]);
    }
  }
  return rows;
}
