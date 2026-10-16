import {
  describirCambio,
  formatFechaHoraHistorial,
  formatValorHistorial,
  tituloAccionHistorial,
} from '../historial-cambios';
import type { TutelaInforme } from '../services/tutelas.service';
import { labelEtapaTutela } from '../tutela-etapas';

export const TUTELAS_INFORME_HEADERS = [
  'Radicado',
  'Juzgado',
  'Accionante',
  'Accionado',
  'Derecho',
  'Etapa',
  'Radicación',
  'Vencimiento',
] as const;

export const TUTELAS_TRAZABILIDAD_HEADERS = ['Radicado', 'Fecha', 'Movimiento', 'Detalle'] as const;

export function buildTutelasInformeRows(tutelas: TutelaInforme[]): string[][] {
  return tutelas.map((t) => [
    t.radicado || '—',
    t.juzgado || '—',
    t.accionante,
    t.accionado,
    t.derecho,
    labelEtapaTutela(t.etapa),
    formatValorHistorial('fecha_radicacion', t.fecha_radicacion),
    formatValorHistorial('vencimiento', t.vencimiento),
  ]);
}

/** Movimientos de cada tutela en orden cronológico; las registradas antes de la trazabilidad muestran su alta. */
export function buildTutelasTrazabilidadRows(tutelas: TutelaInforme[]): string[][] {
  const rows: string[][] = [];
  for (const t of tutelas) {
    const radicado = t.radicado || 'Sin radicado';
    const historial = [...t.historial].sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (!historial.some((h) => h.accion === 'creada')) {
      rows.push([radicado, formatFechaHoraHistorial(t.created_at), tituloAccionHistorial('tutela', 'creada'), '—']);
    }
    for (const h of historial) {
      rows.push([
        radicado,
        formatFechaHoraHistorial(h.created_at),
        tituloAccionHistorial('tutela', h.accion),
        h.cambios.map((c) => describirCambio('tutela', c)).join('\n') || '—',
      ]);
    }
  }
  return rows;
}
