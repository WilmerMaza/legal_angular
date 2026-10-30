import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import {
  describirCambio,
  formatFechaHoraHistorial,
  tituloAccionHistorial,
  type HistorialCambio,
} from '../../core/historial-cambios';
import { DataService } from '../../core/services/data.service';
import { PqrsService, plazoPqr, type Pqr } from '../../core/services/pqrs.service';
import { diasHabilesEntre, todayBogotaYmd } from '../../core/utils/dias-habiles-co';
import { HistorialCambios } from '../../shared/historial-cambios/historial-cambios';
import { InformeDialog, type CampoInforme, type SeccionInforme } from '../informe-dialog/informe-dialog';

@Component({
  selector: 'app-pqr-detalle-dialog',
  standalone: true,
  imports: [HistorialCambios, InformeDialog],
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
            (click)="generarInforme()"
            class="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-primary text-primary px-4 py-2.5 text-sm font-medium hover:bg-primary/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>
            Generar informe
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
      @if (informeOpen()) {
        <app-informe-dialog
          [titulo]="tituloInforme()"
          [detalle]="detalleInforme()"
          [campos]="camposInforme()"
          [secciones]="seccionesInforme()"
          [nombreArchivo]="nombreArchivoInforme()"
          (openChange)="informeOpen.set($event)"
        />
      }
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
  readonly informeOpen = signal(false);

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

  generarInforme(): void {
    this.informeOpen.set(true);
  }

  readonly tituloInforme = computed(() => `Informe de PQR · ${this.pqr().radicado || this.pqr().solicitante}`);

  readonly nombreArchivoInforme = computed(() => {
    const base = this.pqr().radicado || this.pqr().solicitante || 'pqr';
    return `informe_pqr_${base}`;
  });

  readonly detalleInforme = computed(() => {
    if (this.historialLoading()) return 'La trazabilidad todavía se está cargando.';
    if (this.historialError()) return this.historialError() ?? '';
    return `${this.pqr().solicitante} ante ${this.pqr().entidad}.`;
  });

  readonly camposInforme = computed((): CampoInforme[] => {
    const p = this.pqr();
    const plazo = this.plazoTexto();
    const vencimiento = this.data.formatFechaCorta(p.vencimiento);
    return [
      { etiqueta: 'Solicitante', valor: p.solicitante },
      { etiqueta: 'Entidad', valor: p.entidad },
      { etiqueta: 'Radicado', valor: p.radicado || '—' },
      { etiqueta: 'Gestión', valor: p.responsable_email || 'Sin asignar' },
      { etiqueta: 'Asunto', valor: p.asunto },
      { etiqueta: 'Radicación', valor: this.data.formatFechaCorta(p.fecha_radicacion) },
      { etiqueta: 'Vencimiento', valor: plazo ? `${vencimiento} · ${plazo}` : vencimiento },
      { etiqueta: 'Estado', valor: p.estado || '—' },
      { etiqueta: 'Cerrada', valor: p.cerrada ? 'Sí, sin alertas' : 'No' },
    ];
  });

  readonly seccionesInforme = computed((): SeccionInforme[] => [
    {
      titulo: 'Trazabilidad',
      headers: ['Radicado', 'Fecha', 'Movimiento', 'Detalle'],
      rows: filasTrazabilidadPqr(this.pqr(), this.historial()),
    },
  ]);

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

function filasTrazabilidadPqr(pqr: Pqr, historial: HistorialCambio[]): string[][] {
  const radicado = pqr.radicado || 'Sin radicado';
  const rows: string[][] = [];
  const orden = [...historial].sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (!orden.some((item) => item.accion === 'creada')) {
    rows.push([radicado, formatFechaHoraHistorial(pqr.created_at), tituloAccionHistorial('pqr', 'creada'), '—']);
  }
  for (const item of orden) {
    rows.push([
      radicado,
      formatFechaHoraHistorial(item.created_at),
      tituloAccionHistorial('pqr', item.accion),
      item.cambios.map((cambio) => describirCambio('pqr', cambio)).join('\n') || '—',
    ]);
  }
  return rows;
}
