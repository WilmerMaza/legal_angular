import { Component, input } from '@angular/core';

/** Página de detalle en carga: encabezado, tarjetas de saldo y un bloque de contenido. */
@Component({
  selector: 'app-detalle-esqueleto',
  standalone: true,
  host: { 'aria-busy': 'true', class: 'block' },
  template: `
    @if (hero()) {
      <div class="gradient-hero page-container pt-6 pb-10 rounded-b-[2rem]">
        <div class="w-full animate-pulse">
          <div class="h-8 w-28 rounded-xl bg-primary-foreground/20 mb-4"></div>
          <div class="h-8 w-72 max-w-full rounded-lg bg-primary-foreground/25"></div>
          <div class="h-4 w-96 max-w-full rounded bg-primary-foreground/20 mt-3"></div>
        </div>
      </div>
    } @else {
      <div class="animate-pulse mb-6">
        <div class="h-8 w-56 max-w-full rounded-lg bg-muted"></div>
        <div class="h-4 w-80 max-w-full rounded bg-muted mt-3"></div>
      </div>
    }

    <div class="animate-pulse space-y-6" [class]="hero() ? 'page-container -mt-6' : ''">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        @for (card of tarjetas; track card) {
          <div class="rounded-2xl border border-border/50 border-l-4 border-l-muted bg-card shadow-card p-4 sm:p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-9 w-9 rounded-full bg-muted"></div>
              <div class="h-4 w-28 rounded bg-muted"></div>
            </div>
            <div class="h-8 w-36 max-w-full rounded-md bg-muted"></div>
          </div>
        }
      </div>
      <div class="rounded-2xl border border-border/50 bg-card shadow-card p-4 sm:p-6">
        <div class="h-5 w-52 rounded bg-muted mb-5"></div>
        <div class="space-y-4">
          @for (fila of filas; track fila) {
            <div class="h-4 rounded bg-muted" [class]="fila"></div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DetalleEsqueleto {
  /** Con franja de color superior (páginas internas) o encabezado simple (portal del cliente). */
  hero = input(true);

  readonly tarjetas = [1, 2, 3];
  readonly filas = ['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-2/3'];
}
