import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type { HistorialCambio } from '../historial-cambios';
import { HttpService } from '../http/http.service';
import { diasHabilesEntre, sumarDiasHabiles, todayBogotaYmd } from '../utils/dias-habiles-co';
import type { PlazoTutela } from './tutelas.service';

export type Pqr = {
  id: string;
  responsable_id: string | null;
  /** Correo del responsable (o iniciales heredadas del Excel si no tiene usuario asignado). */
  responsable_email: string | null;
  solicitante: string;
  entidad: string;
  asunto: string;
  fecha_radicacion: string;
  radicado: string | null;
  vencimiento: string | null;
  estado: string | null;
  cerrada: boolean;
  alerta_por_vencer_enviada_at: string | null;
  alerta_vencida_enviada_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ResponsablePqr = {
  id: string;
  email: string;
};

export type PqrInput = {
  responsable_id: string | null;
  solicitante: string;
  entidad: string;
  asunto: string;
  fecha_radicacion: string;
  radicado: string | null;
  vencimiento: string | null;
  estado: string | null;
  cerrada: boolean;
};

/** Término legal del derecho de petición (Ley 1755 de 2015, art. 14). */
export const DIAS_HABILES_TERMINO_PQR = 15;
export const DIAS_HABILES_AVISO_PQR = 2;

export function calcularVencimientoPqr(fechaRadicacionYmd: string): string {
  return fechaRadicacionYmd ? sumarDiasHabiles(fechaRadicacionYmd, DIAS_HABILES_TERMINO_PQR) : '';
}

/** Mismo criterio que la alerta del backend: ≤ 2 días hábiles = por vencer. */
export function plazoPqr(p: Pick<Pqr, 'vencimiento' | 'cerrada'>, hoyYmd = todayBogotaYmd()): PlazoTutela {
  if (p.cerrada) return 'cerrada';
  if (!p.vencimiento) return 'sin_vencimiento';
  if (p.vencimiento < hoyYmd) return 'vencida';
  return diasHabilesEntre(hoyYmd, p.vencimiento) <= DIAS_HABILES_AVISO_PQR ? 'por_vencer' : 'en_plazo';
}

@Injectable({ providedIn: 'root' })
export class PqrsService {
  private readonly http = inject(HttpService);
  private readonly pqrsSignal = signal<Pqr[]>([]);

  readonly pqrs = this.pqrsSignal.asReadonly();

  async load(): Promise<Pqr[]> {
    const items = await this.http.getItems<Pqr>('/pqrs');
    this.pqrsSignal.set(items);
    return items;
  }

  async create(input: PqrInput): Promise<Pqr> {
    const created = await this.http.post<Pqr>('/pqrs', input);
    this.pqrsSignal.update((list) => [created, ...list]);
    return created;
  }

  async update(id: string, input: Partial<PqrInput>): Promise<Pqr> {
    const updated = await this.http.patch<Pqr>(`/pqrs/${id}`, input);
    this.pqrsSignal.update((list) => list.map((p) => (p.id === id ? updated : p)));
    return updated;
  }

  responsables(): Promise<ResponsablePqr[]> {
    return this.http.getItems<ResponsablePqr>('/pqrs/responsables');
  }

  historial(id: string): Promise<HistorialCambio[]> {
    return this.http.getItems<HistorialCambio>(`/pqrs/${id}/historial`);
  }

  async remove(id: string): Promise<void> {
    await this.http.delete(`/pqrs/${id}`);
    this.pqrsSignal.update((list) => list.filter((p) => p.id !== id));
  }

  extractErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    const body = error.error as { message?: unknown } | null;
    if (body && typeof body.message === 'string' && body.message.trim()) return body.message;
    return fallback;
  }
}
