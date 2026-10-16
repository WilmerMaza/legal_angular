import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import type { HistorialCambio } from '../../core/historial-cambios';
import { DataService } from '../../core/services/data.service';
import { PqrsService, plazoPqr, type Pqr } from '../../core/services/pqrs.service';
import { diasHabilesEntre, todayBogotaYmd } from '../../core/utils/dias-habiles-co';
import { HistorialCambios } from '../../shared/historial-cambios/historial-cambios';

@Component({
  selector: 'app-pqr-detalle-dialog',
  standalone: true,
  imports: [HistorialCambios],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" (click)="openChange.emit(false)"></div>
      <div
        class="relative z-50 flex flex-col bg-card rounded-2xl shadow-lg border border-border w-full max-w-2xl max-h-[90vh]"
        (click)="$event.stopPropagation()"
      >
        <div class="shrink-0 border-b border-border px-5 sm:px-6 py-4 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">PQR</p>
            <h2 class="font-display text-lg font-bold text-foreground leading-snug break-words">
              {{ pqr().solicitante }} <span class="text-muted-foreground font-normal">ante</span> {{ pqr().entidad }}
            </h2>
          </div>
          <button
            type="button"
            (click)="openChange.emit(false)"
            class="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Radicado</p>
              <p class="text-sm font-medium font-mono text-foreground break-all">{{ pqr().radicado || '—' }}</p>
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Gestión</p>
              <p class="text-sm font-medium text-foreground break-all">{{ pqr().responsable_email || 'Sin asignar' }}</p>
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3 sm:col-span-2">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Asunto</p>
              <p class="text-sm font-medium text-foreground">{{ pqr().asunto }}</p>
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Fecha de radicación</p>
              <p class="text-sm font-medium tabular-nums text-foreground">{{ data.formatFechaCorta(pqr().fecha_radicacion) }}</p>
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Vencimiento</p>
              <p class="text-sm font-semibold tabular-nums" [class]="plazoClass()">
                {{ data.formatFechaCorta(pqr().vencimiento) }}
                @if (plazoTexto()) {
                  <span class="font-normal text-xs"> · {{ plazoTexto() }}</span>
                }
              </p>
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Cerrada</p>
              <p class="text-sm font-medium text-foreground">{{ pqr().cerrada ? 'Sí, sin alertas' : 'No' }}</p>
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Alertas automáticas</p>
              <p class="text-xs text-foreground leading-relaxed">
                Por vencer: {{ pqr().alerta_por_vencer_enviada_at ? data.formatFechaHora(pqr().alerta_por_vencer_enviada_at) : 'no enviada' }}<br />
                Vencida: {{ pqr().alerta_vencida_enviada_at ? data.formatFechaHora(pqr().alerta_vencida_enviada_at) : 'no enviada' }}
              </p>
            </div>
          </div>

          @if (pqr().estado) {
            <div class="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <p class="text-[11px] uppercase tracking-wide text-primary font-semibold mb-1">Estado</p>
              <p class="text-sm text-foreground leading-relaxed whitespace-pre-line">{{ pqr().estado }}</p>
            </div>
          }

          <div class="border-t border-border pt-5">
            <app-historial-cambios
              entidad="pqr"
              [items]="historial()"
              [creadoAt]="pqr().created_at"
              [loading]="historialLoading()"
              [error]="historialError()"
            />
          </div>
        </div>

        <div class="shrink-0 border-t border-border px-5 sm:px-6 py-4 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            (click)="openChange.emit(false)"
            class="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cerrar
          </button>
          <button
            type="button"
            (click)="editar.emit(pqr())"
            class="w-full rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90"
          >
            Editar PQR
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PqrDetalleDialog implements OnInit {
  protected readonly data = inject(DataService);
  private readonly service = inject(PqrsService);

  pqr = input.required<Pqr>();
  openChange = output<boolean>();
  editar = output<Pqr>();

  readonly historial = signal<HistorialCambio[]>([]);
  readonly historialLoading = signal(true);
  readonly historialError = signal<string | null>(null);

  private readonly hoy = todayBogotaYmd();

  async ngOnInit(): Promise<void> {
    try {
      this.historial.set(await this.service.historial(this.pqr().id));
    } catch (error: unknown) {
      this.historialError.set(this.service.extractErrorMessage(error, 'No se pudo cargar la trazabilidad.'));
    } finally {
      this.historialLoading.set(false);
    }
  }

  readonly plazoClass = computed(() => {
    const p = plazoPqr(this.pqr(), this.hoy);
    if (p === 'vencida') return 'text-red-700 dark:text-red-400';
    if (p === 'por_vencer') return 'text-amber-700 dark:text-amber-400';
    return 'text-foreground';
  });

  readonly plazoTexto = computed(() => {
    const p = this.pqr();
    const plazo = plazoPqr(p, this.hoy);
    if (plazo === 'cerrada') return 'Cerrada';
    if (!p.vencimiento || plazo === 'sin_vencimiento') return null;
    if (plazo === 'vencida') return 'Vencida';
    const restantes = diasHabilesEntre(this.hoy, p.vencimiento);
    if (restantes === 0) return 'Vence hoy';
    return restantes === 1 ? 'Falta 1 día hábil' : `Faltan ${restantes} días hábiles`;
  });
}
