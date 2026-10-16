import { Component, computed, input } from '@angular/core';
import {
  describirCambio,
  formatFechaHoraHistorial,
  tituloAccionHistorial,
  type EntidadHistorial,
  type HistorialCambio,
} from '../../core/historial-cambios';

@Component({
  selector: 'app-historial-cambios',
  standalone: true,
  template: `
    <section>
      <h3 class="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-3">Trazabilidad</h3>
      @if (loading()) {
        <ol class="relative border-l border-border ml-1.5 space-y-4 animate-pulse" aria-busy="true">
          @for (ancho of ['w-2/3', 'w-1/2', 'w-3/5']; track $index) {
            <li class="pl-4 relative">
              <span class="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-muted"></span>
              <div class="h-3.5 w-40 rounded bg-muted"></div>
              <div class="mt-2 h-3 rounded bg-muted" [class]="ancho"></div>
            </li>
          }
        </ol>
      } @else if (error()) {
        <p class="text-sm text-destructive">{{ error() }}</p>
      } @else {
        <ol class="relative border-l border-border ml-1.5 space-y-4">
          @for (item of ordenados(); track $index) {
            <li class="pl-4 relative">
              <span
                class="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full"
                [class]="item.accion === 'eliminada' ? 'bg-destructive' : item.accion === 'creada' ? 'bg-primary' : 'bg-muted-foreground/60'"
              ></span>
              <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p class="text-sm font-medium text-foreground">{{ titulo(item) }}</p>
                <p class="text-xs text-muted-foreground tabular-nums">{{ fecha(item.created_at) }}</p>
              </div>
              @if (item.usuario_email) {
                <p class="text-xs text-muted-foreground">por {{ item.usuario_email }}</p>
              }
              @if (item.cambios.length > 0) {
                <ul class="mt-1.5 space-y-0.5">
                  @for (c of item.cambios; track c.campo) {
                    <li class="text-xs text-foreground/90 leading-relaxed break-words">{{ describir(c) }}</li>
                  }
                </ul>
              }
            </li>
          }
          @if (!tieneAlta()) {
            <li class="pl-4 relative">
              <span class="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary"></span>
              <div class="flex flex-wrap items-baseline gap-x-2">
                <p class="text-sm font-medium text-foreground">{{ tituloAlta() }}</p>
                <p class="text-xs text-muted-foreground tabular-nums">{{ fecha(creadoAt()) }}</p>
              </div>
              <p class="text-xs text-muted-foreground">Registrada antes de activar la trazabilidad; los cambios se registran desde el 14/10/2026.</p>
            </li>
          }
        </ol>
      }
    </section>
  `,
})
export class HistorialCambios {
  entidad = input.required<EntidadHistorial>();
  items = input<HistorialCambio[]>([]);
  /** Fecha de alta del registro, para los creados antes de la trazabilidad. */
  creadoAt = input.required<string>();
  loading = input(false);
  error = input<string | null>(null);

  /** Más reciente primero. */
  readonly ordenados = computed(() =>
    [...this.items()].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  );
  readonly tieneAlta = computed(() => this.items().some((i) => i.accion === 'creada'));
  readonly tituloAlta = computed(() => tituloAccionHistorial(this.entidad(), 'creada'));

  titulo(item: HistorialCambio): string {
    return tituloAccionHistorial(this.entidad(), item.accion);
  }

  describir(c: HistorialCambio['cambios'][number]): string {
    return describirCambio(this.entidad(), c);
  }

  fecha(iso: string): string {
    return formatFechaHoraHistorial(iso);
  }
}
