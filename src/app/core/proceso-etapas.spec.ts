import {
  ETAPA_PROCESO_DEFAULT,
  ETAPAS_PROCESO_ORDENADAS,
  coerceEtapaProceso,
  etiquetaEtapaProceso,
  isEtapaProceso,
} from './proceso-etapas';

describe('proceso-etapas', () => {
  it('define 18 etapas en orden del flujo', () => {
    expect(ETAPAS_PROCESO_ORDENADAS).toHaveLength(18);
    expect(ETAPAS_PROCESO_ORDENADAS[0].value).toBe('radicacion');
    expect(ETAPAS_PROCESO_ORDENADAS.some((e) => e.value === 'admision')).toBe(true);
    expect(ETAPAS_PROCESO_ORDENADAS.some((e) => e.value === 'recurso')).toBe(true);
    expect(ETAPAS_PROCESO_ORDENADAS.some((e) => e.value === 'traslado')).toBe(true);
    expect(ETAPAS_PROCESO_ORDENADAS.some((e) => e.value === 'otro')).toBe(true);
    expect(ETAPAS_PROCESO_ORDENADAS.some((e) => e.value === 'suspendido')).toBe(true);
    expect(ETAPAS_PROCESO_ORDENADAS.at(-1)?.value).toBe('terminacion');
  });

  it('default es radicacion', () => {
    expect(ETAPA_PROCESO_DEFAULT).toBe('radicacion');
  });

  it('isEtapaProceso reconoce slugs válidos', () => {
    expect(isEtapaProceso('mandamiento_de_pago')).toBe(true);
    expect(isEtapaProceso('inicial')).toBe(false);
  });

  it('coerceEtapaProceso mapea legacy y fallback', () => {
    expect(coerceEtapaProceso('sentencia')).toBe('sentencia');
    expect(coerceEtapaProceso('inicial')).toBe('radicacion');
    expect(coerceEtapaProceso('conciliacion')).toBe('subsanacion');
    expect(coerceEtapaProceso('demanda')).toBe('mandamiento_de_pago');
    expect(coerceEtapaProceso(null)).toBe('radicacion');
    expect(coerceEtapaProceso('invalido')).toBe('radicacion');
  });

  it('etiquetaEtapaProceso devuelve labels y fallback', () => {
    expect(etiquetaEtapaProceso('radicacion')).toBe('RADICACIÓN');
    expect(etiquetaEtapaProceso('inicial')).toBe('INICIAL');
    expect(etiquetaEtapaProceso(null)).toBe('—');
    expect(etiquetaEtapaProceso('foo_bar')).toBe('FOO BAR');
  });
});
