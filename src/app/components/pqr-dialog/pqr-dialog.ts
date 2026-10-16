import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import {
  DIAS_HABILES_TERMINO_PQR,
  PqrsService,
  calcularVencimientoPqr,
  type Pqr,
  type ResponsablePqr,
} from '../../core/services/pqrs.service';
import { todayBogotaYmd } from '../../core/utils/dias-habiles-co';

@Component({
  selector: 'app-pqr-dialog',
  standalone: true,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" (click)="openChange.emit(false)"></div>
      <div class="relative z-50 bg-card rounded-2xl shadow-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 class="font-display text-lg font-bold text-foreground">
            {{ pqr() ? 'Editar PQR' : 'Nueva PQR' }}
          </h2>
          <button
            type="button"
            (click)="openChange.emit(false)"
            class="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form (submit)="onSubmit($event)" class="p-6 space-y-4">
          @if (errorMsg()) {
            <div class="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {{ errorMsg() }}
            </div>
          }

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Radicado</label>
              <input
                type="text"
                [value]="radicado()"
                (input)="radicado.set($any($event.target).value)"
                placeholder="Ej: EXT-AMC-26-0041905"
                class="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Gestión</label>
              <select
                [value]="responsableId()"
                (change)="responsableId.set($any($event.target).value)"
                [disabled]="cargandoResponsables()"
                class="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                <option value="">{{ cargandoResponsables() ? 'Cargando equipo…' : 'Sin asignar' }}</option>
                @for (r of responsables(); track r.id) {
                  <option [value]="r.id" [selected]="r.id === responsableId()">{{ r.email }}</option>
                }
              </select>
              @if (iniciales()) {
                <p class="text-xs text-muted-foreground mt-1">Del Excel: {{ iniciales() }}. Elige quién la lleva.</p>
              }
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Solicitante *</label>
              <input
                type="text"
                [value]="solicitante()"
                (input)="solicitante.set($any($event.target).value)"
                class="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Entidad *</label>
              <input
                type="text"
                [value]="entidad()"
                (input)="entidad.set($any($event.target).value)"
                placeholder="Ej: Secretaría de Planeación"
                class="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">Asunto *</label>
            <input
              type="text"
              [value]="asunto()"
              (input)="asunto.set($any($event.target).value)"
              placeholder="Ej: Información de medidas EP"
              class="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Fecha de radicación *</label>
              <input
                type="date"
                [value]="fechaRadicacion()"
                (input)="onFechaRadicacion($any($event.target).value)"
                class="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Vencimiento</label>
              <input
                type="date"
                [value]="vencimiento()"
                (input)="vencimiento.set($any($event.target).value)"
                class="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              @if (vencimientoAuto() && vencimiento() !== vencimientoAuto()) {
                <p class="text-xs text-muted-foreground mt-1">
                  Calculado: {{ data.formatFechaCorta(vencimientoAuto()) }} ·
                  <button type="button" (click)="vencimiento.set(vencimientoAuto())" class="font-medium text-primary hover:underline">
                    Usar calculado
                  </button>
                </p>
              } @else {
                <p class="text-xs text-muted-foreground mt-1">{{ diasTermino }} días hábiles desde la radicación; puedes cambiarlo.</p>
              }
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">Estado</label>
            <textarea
              rows="2"
              maxlength="500"
              [value]="estado()"
              (input)="estado.set($any($event.target).value)"
              placeholder="Ej: Ya respondió / Pendiente respuesta de la entidad"
              class="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>

          <label class="flex items-start gap-3 rounded-xl border border-border px-4 py-3 cursor-pointer hover:bg-muted/40">
            <input
              type="checkbox"
              class="mt-0.5 h-4 w-4 accent-[var(--primary)]"
              [checked]="cerrada()"
              (change)="cerrada.set($any($event.target).checked)"
            />
            <span class="text-sm">
              <span class="font-medium text-foreground">Cerrada</span>
              <span class="block text-xs text-muted-foreground">La entidad ya respondió o no hay nada pendiente: no se envían más alertas.</span>
            </span>
          </label>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              (click)="openChange.emit(false)"
              class="flex-1 rounded-xl border-2 border-primary text-primary px-4 py-2.5 text-sm font-medium hover:bg-primary/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="saving()"
              class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              @if (saving()) {
                Guardando…
              } @else {
                {{ pqr() ? 'Guardar cambios' : 'Crear PQR' }}
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class PqrDialog implements OnInit {
  private readonly service = inject(PqrsService);
  protected readonly data = inject(DataService);

  pqr = input<Pqr | null>(null);
  openChange = output<boolean>();
  saved = output<Pqr>();

  readonly diasTermino = DIAS_HABILES_TERMINO_PQR;

  responsableId = signal('');
  responsables = signal<ResponsablePqr[]>([]);
  cargandoResponsables = signal(true);
  solicitante = signal('');
  entidad = signal('');
  asunto = signal('');
  fechaRadicacion = signal('');
  radicado = signal('');
  vencimiento = signal('');
  estado = signal('');
  cerrada = signal(false);
  readonly vencimientoAuto = computed(() => calcularVencimientoPqr(this.fechaRadicacion()));

  /** Iniciales heredadas del Excel cuando la PQR aún no tiene un usuario asignado. */
  readonly iniciales = computed(() => {
    const p = this.pqr();
    return p && !p.responsable_id && !this.responsableId() ? p.responsable_email : null;
  });

  saving = signal(false);
  errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    void this.cargarResponsables();
    const p = this.pqr();
    if (!p) {
      this.onFechaRadicacion(todayBogotaYmd());
      return;
    }
    this.responsableId.set(p.responsable_id ?? '');
    this.solicitante.set(p.solicitante);
    this.entidad.set(p.entidad);
    this.asunto.set(p.asunto);
    this.fechaRadicacion.set(p.fecha_radicacion);
    this.radicado.set(p.radicado ?? '');
    this.vencimiento.set(p.vencimiento ?? '');
    this.estado.set(p.estado ?? '');
    this.cerrada.set(p.cerrada);
  }

  private async cargarResponsables(): Promise<void> {
    try {
      this.responsables.set(await this.service.responsables());
    } catch (error: unknown) {
      this.errorMsg.set(this.service.extractErrorMessage(error, 'No se pudo cargar el equipo.'));
    } finally {
      this.cargandoResponsables.set(false);
    }
  }

  onFechaRadicacion(value: string): void {
    this.fechaRadicacion.set(value);
    this.vencimiento.set(this.vencimientoAuto());
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    void this.guardar();
  }

  private async guardar(): Promise<void> {
    const solicitante = this.solicitante().trim();
    const entidad = this.entidad().trim();
    const asunto = this.asunto().trim();
    const fechaRadicacion = this.fechaRadicacion().trim();
    if (!solicitante || !entidad || !asunto || !fechaRadicacion) {
      this.errorMsg.set('Indica el solicitante, la entidad, el asunto y la fecha de radicación.');
      return;
    }
    const orNull = (v: string) => (v.trim() === '' ? null : v.trim());
    const payload = {
      responsable_id: orNull(this.responsableId()),
      solicitante,
      entidad,
      asunto,
      fecha_radicacion: fechaRadicacion,
      radicado: orNull(this.radicado()),
      vencimiento: orNull(this.vencimiento()),
      estado: orNull(this.estado()),
      cerrada: this.cerrada(),
    };

    this.errorMsg.set(null);
    this.saving.set(true);
    try {
      const current = this.pqr();
      const result = current
        ? await this.service.update(current.id, payload)
        : await this.service.create(payload);
      this.saved.emit(result);
      this.openChange.emit(false);
    } catch (error: unknown) {
      this.errorMsg.set(this.service.extractErrorMessage(error, 'No se pudo guardar la PQR.'));
    } finally {
      this.saving.set(false);
    }
  }
}
