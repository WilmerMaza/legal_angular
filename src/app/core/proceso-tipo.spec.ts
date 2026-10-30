import { clasificarProcesoCuenta } from './proceso-tipo';
import type { ProcesoLegal } from './models';

function proceso(partial: Partial<ProcesoLegal> & Pick<ProcesoLegal, 'id' | 'cuenta_id' | 'tipo'>): ProcesoLegal {
  return {
    cliente_id: 'c1',
    numero_cuenta: '2026-1',
    estado: 'en_proceso',
    etapa_proceso: 'radicacion',
    created_at: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('clasificarProcesoCuenta', () => {
  it('sin radicado vinculado → PRE-JURÍDICO', () => {
    expect(clasificarProcesoCuenta('u1', [])).toEqual({
      codigo: 'pre_juridico',
      label: 'PRE-JURÍDICO',
    });
    expect(
      clasificarProcesoCuenta('u1', [proceso({ id: 'p1', cuenta_id: 'otra', tipo: 'juridica' })]),
    ).toEqual({ codigo: 'pre_juridico', label: 'PRE-JURÍDICO' });
  });

  it('con radicado jurídico → RADICADO', () => {
    expect(
      clasificarProcesoCuenta('u1', [proceso({ id: 'p1', cuenta_id: 'u1', tipo: 'juridica' })]),
    ).toEqual({ codigo: 'juridica', label: 'RADICADO' });
  });

  it('con acuerdo de pago → ACUERDO DE PAGO', () => {
    expect(
      clasificarProcesoCuenta('u1', [
        proceso({ id: 'p1', cuenta_id: 'u1', tipo: 'acuerdo_de_pago' }),
      ]),
    ).toEqual({ codigo: 'acuerdo_de_pago', label: 'ACUERDO DE PAGO' });
  });
});
