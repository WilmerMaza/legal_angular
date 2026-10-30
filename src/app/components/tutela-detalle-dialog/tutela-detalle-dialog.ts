import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import type { HistorialCambio } from '../../core/historial-cambios';
import {
  TUTELAS_TRAZABILIDAD_HEADERS,
  buildTutelasTrazabilidadRows,
} from '../../core/report-export/tutelas-report';
import { DataService } from '../../core/services/data.service';
import { TutelasService, plazoTutela, type Tutela } from '../../core/services/tutelas.service';
import { labelEtapaTutela } from '../../core/tutela-etapas';
import { diasHabilesEntre, todayBogotaYmd } from '../../core/utils/dias-habiles-co';
import { HistorialCambios } from '../../shared/historial-cambios/historial-cambios';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { InformeDialog, type CampoInforme, type SeccionInforme } from '../informe-dialog/informe-dialog';

@Component({
  selector: 'app-tutela-detalle-dialog',
  standalone: true,
  imports: [HistorialCambios, InformeDialog, StatusBadge],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" (click)="openChange.emit(false)"></div>
      <div
        class="relative z-50 flex flex-col bg-card rounded-2xl shadow-lg border border-border w-full max-w-2xl max-h-[90vh]"
        (click)="$event.stopPropagation()"
      >
        <div class="shrink-0 border-b border-border px-5 sm:px-6 py-4 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Tutela</p>
            <h2 class="font-display text-lg font-bold text-foreground leading-snug break-words">
              {{ tutela().accionante }} <span class="text-muted-foreground font-normal">vs.</span> {{ tutela().accionado }}
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
              <p class="text-sm font-medium font-mono text-foreground break-all">{{ tutela().radicado || '—' }}</p>
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Juzgado</p>
              <p class="text-sm font-medium text-foreground">{{ tutela().juzgado || '—' }}</p>
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Fecha de radicación</p>
              <p class="text-sm font-medium tabular-nums text-foreground">{{ data.formatFechaCorta(tutela().fecha_radicacion) }}</p>
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Vencimiento</p>
              <p class="text-sm font-semibold tabular-nums" [class]="plazoClass()">
                {{ data.formatFechaCorta(tutela().vencimiento) }}
                @if (plazoTexto()) {
                  <span class="font-normal text-xs"> · {{ plazoTexto() }}</span>
                }
              </p>
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Etapa</p>
              <app-status-badge [label]="etapaLabel()" [variant]="'tutela_' + tutela().etapa" />
              @if (tutela().fecha_etapa) {
                <p class="text-xs text-muted-foreground mt-1">Desde {{ data.formatFechaCorta(tutela().fecha_etapa) }}</p>
              }
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Derecho</p>
              <p class="text-sm font-medium text-foreground">{{ tutela().derecho }}</p>
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Cliente</p>
              <p class="text-sm font-medium text-foreground">{{ tutela().cliente_nombre || 'Sin cliente asociado' }}</p>
            </div>
            <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
              <p class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Alertas automáticas</p>
              <p class="text-xs text-foreground leading-relaxed">
                Por vencer: {{ tutela().alerta_por_vencer_enviada_at ? data.formatFechaHora(tutela().alerta_por_vencer_enviada_at) : 'no enviada' }}<br />
                Vencida: {{ tutela().alerta_vencida_enviada_at ? data.formatFechaHora(tutela().alerta_vencida_enviada_at) : 'no enviada' }}
              </p>
            </div>
          </div>

          @if (tutela().nota) {
            <div class="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <p class="text-[11px] uppercase tracking-wide text-primary font-semibold mb-1">Nota (sale en el correo)</p>
              <p class="text-sm text-foreground leading-relaxed whitespace-pre-line">{{ tutela().nota }}</p>
            </div>
          }

          <div class="border-t border-border pt-5">
            <app-historial-cambios
              entidad="tutela"
              [items]="historial()"
              [creadoAt]="tutela().created_at"
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
            (click)="editar.emit(tutela())"
            class="w-full rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90"
          >
            Editar tutela
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
export class TutelaDetalleDialog implements OnInit {
  protected readonly data = inject(DataService);
  private readonly service = inject(TutelasService);

  tutela = input.required<Tutela>();
  openChange = output<boolean>();
  editar = output<Tutela>();

  readonly historial = signal<HistorialCambio[]>([]);
  readonly historialLoading = signal(true);
  readonly historialError = signal<string | null>(null);
  readonly informeOpen = signal(false);

  private readonly hoy = todayBogotaYmd();

  async ngOnInit(): Promise<void> {
    try {
      this.historial.set(await this.service.historial(this.tutela().id));
    } catch (error: unknown) {
      this.historialError.set(this.service.extractErrorMessage(error, 'No se pudo cargar la trazabilidad.'));
    } finally {
      this.historialLoading.set(false);
    }
  }

  generarInforme(): void {
    this.informeOpen.set(true);
  }

  readonly tituloInforme = computed(() => `Informe de tutela · ${this.tutela().radicado || this.tutela().accionante}`);

  readonly nombreArchivoInforme = computed(() => {
    const base = this.tutela().radicado || this.tutela().accionante || 'tutela';
    return `informe_tutela_${base}`;
  });

  readonly detalleInforme = computed(() => {
    if (this.historialLoading()) return 'La trazabilidad todavía se está cargando.';
    if (this.historialError()) return this.historialError() ?? '';
    return `${this.tutela().accionante} contra ${this.tutela().accionado}.`;
  });

  readonly camposInforme = computed((): CampoInforme[] => {
    const t = this.tutela();
    const plazo = this.plazoTexto();
    const vencimiento = this.data.formatFechaCorta(t.vencimiento);
    return [
      { etiqueta: 'Accionante', valor: t.accionante },
      { etiqueta: 'Accionado', valor: t.accionado },
      { etiqueta: 'Radicado', valor: t.radicado || '—' },
      { etiqueta: 'Juzgado', valor: t.juzgado || '—' },
      { etiqueta: 'Radicación', valor: this.data.formatFechaCorta(t.fecha_radicacion) },
      { etiqueta: 'Vencimiento', valor: plazo ? `${vencimiento} · ${plazo}` : vencimiento },
      {
        etiqueta: 'Etapa',
        valor: t.fecha_etapa ? `${this.etapaLabel()} (desde ${this.data.formatFechaCorta(t.fecha_etapa)})` : this.etapaLabel(),
      },
      { etiqueta: 'Derecho', valor: t.derecho },
      { etiqueta: 'Cliente', valor: t.cliente_nombre || 'Sin cliente asociado' },
      { etiqueta: 'Nota', valor: t.nota || '—' },
    ];
  });

  readonly seccionesInforme = computed((): SeccionInforme[] => {
    const t = this.tutela();
    return [
      {
        titulo: 'Trazabilidad',
        headers: [...TUTELAS_TRAZABILIDAD_HEADERS],
        rows: buildTutelasTrazabilidadRows([
          {
            id: t.id,
            radicado: t.radicado,
            juzgado: t.juzgado,
            accionante: t.accionante,
            accionado: t.accionado,
            derecho: t.derecho,
            etapa: t.etapa,
            fecha_radicacion: t.fecha_radicacion,
            fecha_etapa: t.fecha_etapa,
            vencimiento: t.vencimiento,
            created_at: t.created_at,
            historial: this.historial(),
          },
        ]),
      },
    ];
  });

  readonly etapaLabel = computed(() => labelEtapaTutela(this.tutela().etapa));

  readonly plazoClass = computed(() => {
    const p = plazoTutela(this.tutela(), this.hoy);
    if (p === 'vencida') return 'text-red-700 dark:text-red-400';
    if (p === 'por_vencer') return 'text-amber-700 dark:text-amber-400';
    return 'text-foreground';
  });

  readonly plazoTexto = computed(() => {
    const t = this.tutela();
    const p = plazoTutela(t, this.hoy);
    if (!t.vencimiento || p === 'cerrada' || p === 'sin_vencimiento') return null;
    if (p === 'vencida') return 'Vencida';
    const restantes = diasHabilesEntre(this.hoy, t.vencimiento);
    if (restantes === 0) return 'Vence hoy';
    return restantes === 1 ? 'Falta 1 día hábil' : `Faltan ${restantes} días hábiles`;
  });
}
