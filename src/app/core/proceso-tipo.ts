import type { ProcesoLegal, TipoProcesoLegal } from './models';
import { coerceEstadoProcesoLegal } from './proceso-estado';

/** Tipos que se eligen al crear/editar un radicado. */
export const TIPOS_PROCESO_LEGAL_UI: Array<{ value: TipoProcesoLegal; label: string }> = [
  { value: 'juridica', label: 'RADICADO' },
  { value: 'acuerdo_de_pago', label: 'ACUERDO DE PAGO' },
];

export const TIPO_PROCESO_LEGAL_LABELS: Record<TipoProcesoLegal, string> = {
  juridica: 'RADICADO',
  /** Legado: ya no se crea; se muestra si quedó en BD. */
  extrajudicial: 'PRE-JURÍDICO',
  acuerdo_de_pago: 'ACUERDO DE PAGO',
};

export type ClasificacionProcesoCuenta = {
  /** `pre_juridico` = la propiedad aún no tiene radicado vinculado. */
  codigo: 'pre_juridico' | TipoProcesoLegal;
  label: string;
};

function pickProcesoPreferido(procesos: readonly ProcesoLegal[]): ProcesoLegal | null {
  if (!procesos.length) return null;
  const enCurso = procesos.filter((p) => coerceEstadoProcesoLegal(p.estado) === 'en_proceso');
  const pool = enCurso.length ? enCurso : procesos;
  return [...pool].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0] ?? null;
}

/**
 * Clasificación de cobro de una propiedad:
 * - Sin radicado vinculado → PRE-JURÍDICO
 * - Con radicado → RADICADO o ACUERDO DE PAGO (según el tipo del proceso)
 */
export function clasificarProcesoCuenta(
  cuentaId: string,
  procesos: readonly ProcesoLegal[],
): ClasificacionProcesoCuenta {
  const linked = procesos.filter((p) => p.cuenta_id === cuentaId);
  if (!linked.length) {
    return { codigo: 'pre_juridico', label: 'PRE-JURÍDICO' };
  }
  const proceso = pickProcesoPreferido(linked);
  if (!proceso) {
    return { codigo: 'pre_juridico', label: 'PRE-JURÍDICO' };
  }
  return {
    codigo: proceso.tipo,
    label: TIPO_PROCESO_LEGAL_LABELS[proceso.tipo] ?? String(proceso.tipo),
  };
}

export function variantTipoProcesoCuenta(codigo: ClasificacionProcesoCuenta['codigo']): string {
  if (codigo === 'juridica') return 'juridica';
  if (codigo === 'acuerdo_de_pago') return 'parcial';
  return 'pendiente';
}
