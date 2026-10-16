import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { fadeInUp, fadeInUpStagger } from '../../core/animations/animations';
import { DataService } from '../../core/services/data.service';
import { PqrsService, plazoPqr, type Pqr } from '../../core/services/pqrs.service';
import {
  filtroPlazoDesdeQuery,
  type FiltroPlazoTutela,
  type PlazoTutela,
} from '../../core/services/tutelas.service';
import { diasHabilesEntre, todayBogotaYmd } from '../../core/utils/dias-habiles-co';
import { PqrDetalleDialog } from '../../components/pqr-detalle-dialog/pqr-detalle-dialog';
import { PqrDialog } from '../../components/pqr-dialog/pqr-dialog';
import { FILAS_ESQUELETO, FilaEsqueleto, type CeldaEsqueleto } from '../../shared/esqueleto/fila-esqueleto';
import { TextoTooltip } from '../../shared/texto-tooltip/texto-tooltip';

type FiltroPlazoPqr = FiltroPlazoTutela | 'cerrada';

function compararMasRecientePrimero(a: Pqr, b: Pqr): number {
  if (a.fecha_radicacion !== b.fecha_radicacion) return b.fecha_radicacion.localeCompare(a.fecha_radicacion);
  return b.created_at.localeCompare(a.created_at);
}

@Component({
  selector: 'app-pqrs-page',
  standalone: true,
  imports: [FilaEsqueleto, PqrDetalleDialog, PqrDialog, TextoTooltip],
  animations: [fadeInUp, fadeInUpStagger],
  template: `
    <div class="min-h-screen">
      <div class="gradient-hero page-container pt-6 sm:pt-8 pb-10 sm:pb-12 rounded-b-[2rem]">
        <div
          class="w-full"
          [@fadeInUp]="{ value: '', params: { delay: 0, duration: 500, offset: 10, ease: 'ease-out' } }"
        >
          <h1 class="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
            Radicados y PQR
          </h1>
          <p class="text-primary-foreground/70 mb-6">Derechos de petición radicados ante entidades y su término de respuesta</p>
        </div>
      </div>

      <div class="page-container -mt-6 space-y-4 pb-10">
        @if (error()) {
          <div class="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {{ error() }}
          </div>
        }

        <div class="interactive-card rounded-2xl border border-border/50 bg-card shadow-card p-4 sm:p-5">
          <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div class="relative flex-1 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input
                type="text"
                placeholder="Buscar por radicado, solicitante, entidad, asunto o estado..."
                class="w-full min-w-0 rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                [value]="search()"
                (input)="search.set($any($event.target).value)"
              />
            </div>
            <div class="relative shrink-0 sm:w-[260px]">
              <select
                [value]="filtroGestion()"
                (change)="filtroGestion.set($any($event.target).value)"
                class="w-full appearance-none rounded-xl border border-input bg-background px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todas">Gestión</option>
                @for (g of gestiones(); track g) {
                  <option [value]="g">{{ g }}</option>
                }
              </select>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"><path d="m6 9 6 6 6-6" /></svg>
            </div>
            <div class="relative shrink-0 sm:w-[200px]">
              <select
                [value]="filtroPlazo()"
                (change)="filtroPlazo.set($any($event.target).value)"
                class="w-full appearance-none rounded-xl border border-input bg-background px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todos">Todos los plazos</option>
                <option value="vencida">Vencidas</option>
                <option value="por_vencer">Por vencer (≤ 2 días hábiles)</option>
                <option value="en_plazo">En plazo</option>
                <option value="cerrada">Cerradas</option>
              </select>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>
        </div>

        <div class="bg-card rounded-2xl shadow-card border border-border/50">
          <div class="flex flex-col gap-3 px-5 sm:px-6 py-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap items-center gap-3">
              <h2 class="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Peticiones
              </h2>
              @if (resumen().vencidas > 0) {
                <span class="rounded-full bg-red-100 text-red-800 px-2.5 py-0.5 text-xs font-semibold">
                  {{ resumen().vencidas }} vencida{{ resumen().vencidas === 1 ? '' : 's' }}
                </span>
              }
              @if (resumen().porVencer > 0) {
                <span class="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-semibold">
                  {{ resumen().porVencer }} por vencer
                </span>
              }
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                (click)="abrirNueva()"
                class="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Nueva PQR
              </button>
            </div>
          </div>

          @if (!loading() && filtradas().length === 0) {
            <div class="px-6 py-10 text-center text-sm text-muted-foreground">
              {{ service.pqrs().length === 0 ? 'Aún no hay PQR registradas.' : 'Ninguna PQR coincide con los filtros.' }}
            </div>
          } @else {
            <div class="table-wrap cabecera-fija">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-border bg-muted/20">
                    <th class="col-fija text-left px-3 sm:px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Radicado</th>
                    <th class="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Radicación</th>
                    <th class="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[7rem] max-w-[7rem]">Gestión</th>
                    <th class="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Solicitante</th>
                    <th class="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entidad</th>
                    <th class="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Asunto</th>
                    <th class="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vencimiento</th>
                    <th class="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[10rem] max-w-[10rem]">Estado</th>
                    <th class="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody [attr.aria-busy]="loading()">
                  @if (loading() && service.pqrs().length === 0) {
                    @for (fila of filasEsqueleto; track fila) {
                      <tr [appFilaEsqueleto]="esqueleto" class="border-b border-border/40 last:border-0"></tr>
                    }
                  }
                  @for (p of filtradas(); track p.id; let i = $index) {
                    <tr
                      [@fadeInUpStagger]="{ value: '', params: { delay: i * 30, duration: 200, offset: 5, ease: 'ease-out' } }"
                      class="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td class="col-fija px-3 sm:px-5 py-4 text-xs font-mono text-foreground max-w-[8.5rem] sm:max-w-[14rem] break-all">
                        {{ p.radicado || '—' }}
                      </td>
                      <td class="px-5 py-4 text-sm tabular-nums text-foreground whitespace-nowrap">{{ data.formatFechaCorta(p.fecha_radicacion) }}</td>
                      <td class="px-5 py-4 text-sm text-muted-foreground w-[7rem] max-w-[7rem]">
                        <p class="truncate cursor-default" [appTextoTooltip]="p.responsable_email || 'Sin asignar'">{{ p.responsable_email || 'Sin asignar' }}</p>
                      </td>
                      <td class="px-5 py-4 text-sm font-medium text-foreground">{{ p.solicitante }}</td>
                      <td class="px-5 py-4 text-sm text-foreground">{{ p.entidad }}</td>
                      <td class="px-5 py-4 text-sm text-muted-foreground max-w-[14rem]">{{ p.asunto }}</td>
                      <td class="px-5 py-4 text-right text-sm whitespace-nowrap" [class]="plazoClass(p)">
                        <div class="font-medium tabular-nums">{{ data.formatFechaCorta(p.vencimiento) }}</div>
                        @if (plazoTexto(p); as texto) {
                          <div class="text-xs mt-0.5">{{ texto }}</div>
                        }
                      </td>
                      <td class="px-5 py-4 text-sm text-muted-foreground w-[10rem] max-w-[10rem]">
                        @if (p.estado) {
                          <p class="truncate text-foreground cursor-default" [appTextoTooltip]="p.estado">{{ p.estado }}</p>
                        } @else {
                          —
                        }
                      </td>
                      <td class="px-5 py-4">
                        <div class="flex justify-end gap-2">
                          <button
                            type="button"
                            (click)="detalleTarget.set(p)"
                            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                            title="Ver PQR"
                            aria-label="Ver PQR"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                          </button>
                          <button
                            type="button"
                            (click)="abrirEditar(p)"
                            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                            title="Editar"
                            aria-label="Editar PQR"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                          </button>
                          <button
                            type="button"
                            (click)="deleteTarget.set(p)"
                            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Eliminar"
                            aria-label="Eliminar PQR"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>

      @if (dialogOpen()) {
        <app-pqr-dialog [pqr]="editing()" (openChange)="dialogOpen.set($event)" (saved)="error.set(null)" />
      }

      @if (detalleTarget(); as target) {
        <app-pqr-detalle-dialog
          [pqr]="target"
          (openChange)="detalleTarget.set(null)"
          (editar)="detalleTarget.set(null); abrirEditar($event)"
        />
      }

      @if (deleteTarget(); as target) {
        <div class="fixed inset-0 z-40 bg-black/50"></div>
        <section class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 class="font-display text-xl font-semibold text-foreground mb-2">Eliminar PQR</h2>
            <p class="text-sm text-muted-foreground mb-6">
              ¿Eliminar la petición de <strong>{{ target.solicitante }}</strong> ante <strong>{{ target.entidad }}</strong>?
              Dejará de aparecer en la tabla y en las alertas, pero queda guardada en el sistema con la fecha y el usuario que la eliminó.
            </p>
            <div class="flex justify-end gap-3">
              <button
                type="button"
                (click)="deleteTarget.set(null)"
                class="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="eliminar(target)"
                [disabled]="deleting()"
                class="rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Eliminar
              </button>
            </div>
          </div>
        </section>
      }
    </div>
  `,
})
export class PqrsPage implements OnInit {
  protected readonly service = inject(PqrsService);
  protected readonly data = inject(DataService);

  search = signal('');
  filtroGestion = signal<string>('todas');
  filtroPlazo = signal<FiltroPlazoPqr>('todos');

  loading = signal(true);
  readonly filasEsqueleto = FILAS_ESQUELETO;
  readonly esqueleto: CeldaEsqueleto[] = [
    { ancho: 'w-28', fija: true },
    { ancho: 'w-20' },
    { ancho: 'w-20' },
    { ancho: 'w-32' },
    { ancho: 'w-28' },
    { ancho: 'w-36' },
    { ancho: 'w-20', alinear: 'derecha' },
    { ancho: 'w-28' },
    { forma: 'botones', alinear: 'derecha' },
  ];
  error = signal<string | null>(null);
  deleting = signal(false);

  dialogOpen = signal(false);
  editing = signal<Pqr | null>(null);
  deleteTarget = signal<Pqr | null>(null);
  detalleTarget = signal<Pqr | null>(null);

  private readonly hoy = todayBogotaYmd();

  constructor() {
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const filtro = filtroPlazoDesdeQuery(params.get('filtro'));
        if (filtro) this.filtroPlazo.set(filtro);
      });
  }

  gestiones = computed(() =>
    [...new Set(this.service.pqrs().map((p) => p.responsable_email).filter((g): g is string => !!g))].sort(),
  );

  resumen = computed(() => {
    let vencidas = 0;
    let porVencer = 0;
    for (const p of this.service.pqrs()) {
      const plazo = plazoPqr(p, this.hoy);
      if (plazo === 'vencida') vencidas += 1;
      else if (plazo === 'por_vencer') porVencer += 1;
    }
    return { vencidas, porVencer };
  });

  filtradas = computed(() => {
    const q = this.search().trim().toLowerCase();
    const gestion = this.filtroGestion();
    const plazo = this.filtroPlazo();
    return this.service
      .pqrs()
      .filter((p) => {
        if (gestion !== 'todas' && p.responsable_email !== gestion) return false;
        if (plazo !== 'todos' && plazoPqr(p, this.hoy) !== plazo) return false;
        if (!q) return true;
        return [p.radicado, p.solicitante, p.entidad, p.asunto, p.estado, p.responsable_email]
          .some((v) => (v ?? '').toLowerCase().includes(q));
      })
      .sort(compararMasRecientePrimero);
  });

  async ngOnInit(): Promise<void> {
    try {
      await this.service.load();
    } catch (error: unknown) {
      this.error.set(this.service.extractErrorMessage(error, 'No se pudieron cargar las PQR.'));
    } finally {
      this.loading.set(false);
    }
  }

  private plazo(p: Pqr): PlazoTutela {
    return plazoPqr(p, this.hoy);
  }

  plazoClass(p: Pqr): string {
    const plazo = this.plazo(p);
    if (plazo === 'vencida') return 'text-red-700 dark:text-red-400';
    if (plazo === 'por_vencer') return 'text-amber-700 dark:text-amber-400';
    if (plazo === 'cerrada') return 'text-muted-foreground';
    return 'text-foreground';
  }

  plazoTexto(p: Pqr): string | null {
    const plazo = this.plazo(p);
    if (plazo === 'cerrada') return 'Cerrada';
    if (!p.vencimiento || plazo === 'sin_vencimiento') return null;
    if (plazo === 'vencida') return 'Vencida';
    const restantes = diasHabilesEntre(this.hoy, p.vencimiento);
    if (restantes === 0) return 'Vence hoy';
    return restantes === 1 ? 'Falta 1 día hábil' : `Faltan ${restantes} días hábiles`;
  }

  abrirNueva(): void {
    this.editing.set(null);
    this.dialogOpen.set(true);
  }

  abrirEditar(p: Pqr): void {
    this.editing.set(p);
    this.dialogOpen.set(true);
  }

  async eliminar(p: Pqr): Promise<void> {
    this.deleting.set(true);
    try {
      await this.service.remove(p.id);
      this.deleteTarget.set(null);
    } catch (error: unknown) {
      this.error.set(this.service.extractErrorMessage(error, 'No se pudo eliminar la PQR.'));
    } finally {
      this.deleting.set(false);
    }
  }
}
