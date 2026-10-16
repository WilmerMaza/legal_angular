import { labelEtapaTutela } from './tutela-etapas';

export type EntidadHistorial = 'tutela' | 'pqr';
export type AccionHistorial = 'creada' | 'actualizada' | 'eliminada';
export type ValorHistorial = string | number | boolean | null;
export type CambioCampo = { campo: string; antes: ValorHistorial; despues: ValorHistorial };

export type HistorialCambio = {
  id?: string;
  accion: AccionHistorial;
  cambios: CambioCampo[];
  /** No viene en el informe del propietario. */
  usuario_email?: string | null;
  created_at: string;
};

const LABELS: Record<EntidadHistorial, Record<string, string>> = {
  tutela: {
    fecha_radicacion: 'Fecha de radicación',
    radicado: 'Radicado',
    juzgado: 'Juzgado',
    accionante: 'Accionante',
    accionado: 'Accionado',
    derecho: 'Derecho',
    cliente_nombre: 'Cliente',
    etapa: 'Etapa',
    fecha_etapa: 'Inicio de la etapa',
    vencimiento: 'Vencimiento',
    nota: 'Nota',
  },
  pqr: {
    gestion: 'Gestión',
    responsable_email: 'Gestión',
    solicitante: 'Solicitante',
    entidad: 'Entidad',
    asunto: 'Asunto',
    fecha_radicacion: 'Fecha de radicación',
    radicado: 'Radicado',
    vencimiento: 'Vencimiento',
    estado: 'Estado',
    cerrada: 'Cerrada',
  },
};

const ACCIONES: Record<EntidadHistorial, Record<AccionHistorial, string>> = {
  tutela: { creada: 'Tutela registrada', actualizada: 'Tutela actualizada', eliminada: 'Tutela eliminada' },
  pqr: { creada: 'PQR registrada', actualizada: 'PQR actualizada', eliminada: 'PQR eliminada' },
};

export function labelCampoHistorial(entidad: EntidadHistorial, campo: string): string {
  return LABELS[entidad][campo] ?? campo;
}

export function tituloAccionHistorial(entidad: EntidadHistorial, accion: AccionHistorial): string {
  return ACCIONES[entidad][accion] ?? accion;
}

function formatYmd(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

export function formatValorHistorial(campo: string, valor: ValorHistorial): string {
  if (valor === null || valor === '') return '—';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (campo === 'etapa') return labelEtapaTutela(String(valor));
  return formatYmd(String(valor)) ?? String(valor);
}

/** "Etapa: ADMISIÓN → SENTENCIA"; en el alta solo el valor inicial. */
export function describirCambio(entidad: EntidadHistorial, cambio: CambioCampo): string {
  const label = labelCampoHistorial(entidad, cambio.campo);
  const despues = formatValorHistorial(cambio.campo, cambio.despues);
  if (cambio.antes === null) return `${label}: ${despues}`;
  return `${label}: ${formatValorHistorial(cambio.campo, cambio.antes)} → ${despues}`;
}

/** Fecha y hora en Bogotá, p. ej. "14/10/2026 11:32 a. m.". */
export function formatFechaHoraHistorial(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
