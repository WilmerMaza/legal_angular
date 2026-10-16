import { Component, input } from '@angular/core';

export type CeldaEsqueleto = {
  /** Clase de ancho de la barra (ej. `w-24`). */
  ancho?: string;
  forma?: 'texto' | 'etiqueta' | 'botones';
  /** Cantidad de botones cuando `forma` es `botones`. */
  botones?: number;
  alinear?: 'derecha' | 'centro';
  /** Columna sticky (`col-fija`) como en la tabla real. */
  fija?: boolean;
};

/** Cantidad de filas de relleno mientras carga una tabla. */
export const FILAS_ESQUELETO = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Fila de tabla con barras pulsantes que imitan las columnas reales mientras carga. */
@Component({
  selector: 'tr[appFilaEsqueleto]',
  standalone: true,
  host: { class: 'animate-pulse', 'aria-hidden': 'true' },
  template: `
    @for (c of celdas(); track $index) {
      <td [class]="celdaClass()" [class.col-fija]="!!c.fija">
        @switch (c.forma) {
          @case ('botones') {
            <div
              class="flex gap-2"
              [class.justify-end]="c.alinear === 'derecha'"
              [class.justify-center]="c.alinear === 'centro'"
            >
              @for (b of botones(c); track b) {
                <div class="h-9 w-9 rounded-xl bg-muted"></div>
              }
            </div>
          }
          @case ('etiqueta') {
            <div
              class="h-6 rounded-full bg-muted"
              [class]="c.ancho ?? 'w-20'"
              [class.ml-auto]="c.alinear === 'derecha'"
              [class.mx-auto]="c.alinear === 'centro'"
            ></div>
          }
          @default {
            <div
              class="h-3 rounded bg-muted"
              [class]="c.ancho ?? 'w-24'"
              [class.ml-auto]="c.alinear === 'derecha'"
              [class.mx-auto]="c.alinear === 'centro'"
            ></div>
          }
        }
      </td>
    }
  `,
})
export class FilaEsqueleto {
  celdas = input.required<readonly CeldaEsqueleto[]>({ alias: 'appFilaEsqueleto' });
  /** Padding de cada celda; debe coincidir con el de la tabla real. */
  celdaClass = input('px-5 py-4');

  botones(c: CeldaEsqueleto): number[] {
    return Array.from({ length: c.botones ?? 3 }, (_, i) => i);
  }
}
