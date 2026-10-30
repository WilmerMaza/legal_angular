import { Component, input, output, signal } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  buildHeading,
  buildKeyValueLines,
  buildParagraph,
  buildSpacer,
  buildSubheading,
  buildTable,
  saveDocx,
} from '../../core/report-export/report-docx';

export type CampoInforme = { etiqueta: string; valor: string };

export type SeccionInforme = {
  titulo: string;
  headers: string[];
  rows: string[][];
};

@Component({
  selector: 'app-informe-dialog',
  standalone: true,
  template: `
    <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" (click)="openChange.emit(false)"></div>
      <div
        class="relative z-50 bg-card rounded-2xl shadow-lg border border-border max-w-4xl w-full max-h-[90vh] overflow-auto"
        (click)="$event.stopPropagation()"
      >
        <div class="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between gap-3">
          <h2 class="font-display text-xl font-bold text-foreground">{{ titulo() }}</h2>
          <button
            type="button"
            (click)="openChange.emit(false)"
            class="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div class="p-6 space-y-6">
          <div class="text-sm text-muted-foreground">
            <p><strong class="text-foreground">Fecha:</strong> {{ fecha }}</p>
            @if (detalle()) {
              <p class="mt-1">{{ detalle() }}</p>
            }
          </div>

          @if (campos().length > 0) {
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              @for (campo of campos(); track campo.etiqueta) {
                <div class="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
                  <dt class="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{{ campo.etiqueta }}</dt>
                  <dd class="text-sm font-medium text-foreground whitespace-pre-line break-words">{{ campo.valor }}</dd>
                </div>
              }
            </dl>
          }

          @for (seccion of secciones(); track seccion.titulo) {
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">{{ seccion.titulo }}</h3>
              @if (seccion.rows.length === 0) {
                <p class="text-sm text-muted-foreground">No hay registros en esta sección.</p>
              } @else {
                <div class="overflow-x-auto rounded-xl border border-border">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-border bg-muted/30">
                        @for (header of seccion.headers; track header) {
                          <th class="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">{{ header }}</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of seccion.rows; track $index) {
                        <tr class="border-b border-border/50 last:border-0">
                          @for (cell of row; track $index) {
                            <td class="px-3 py-2 align-top whitespace-pre-line break-words">{{ cell }}</td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }

          @if (error()) {
            <p class="text-sm text-destructive">{{ error() }}</p>
          }

          <div class="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              (click)="downloadPdf()"
              class="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-medium hover:opacity-90"
            >
              Descargar PDF
            </button>
            <button
              type="button"
              (click)="downloadExcel()"
              class="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary text-primary px-4 py-3 text-sm font-medium hover:bg-primary/5"
            >
              Descargar Excel
            </button>
            <button
              type="button"
              (click)="downloadWord()"
              class="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary text-primary px-4 py-3 text-sm font-medium hover:bg-primary/5"
            >
              Descargar Word
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class InformeDialog {
  titulo = input.required<string>();
  detalle = input('');
  campos = input<CampoInforme[]>([]);
  secciones = input<SeccionInforme[]>([]);
  nombreArchivo = input('informe');
  openChange = output<boolean>();

  readonly error = signal<string | null>(null);

  readonly fecha = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  downloadPdf(): void {
    this.error.set(null);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text(this.titulo(), 14, 16);
    doc.setFontSize(10);
    let y = 24;
    doc.text(`Fecha: ${this.fecha}`, 14, y);
    y += 6;
    if (this.detalle()) {
      const lines = doc.splitTextToSize(this.detalle(), 269);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 2;
    }
    for (const campo of this.campos()) {
      if (y > 190) {
        doc.addPage();
        y = 16;
      }
      const lines = doc.splitTextToSize(`${campo.etiqueta}: ${campo.valor}`, 269);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 1;
    }
    for (const seccion of this.secciones()) {
      if (y > 180) {
        doc.addPage();
        y = 16;
      }
      doc.setFontSize(12);
      doc.text(seccion.titulo, 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [seccion.headers],
        body: seccion.rows.length > 0 ? seccion.rows : [seccion.headers.map(() => '—')],
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [107, 60, 200] },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
    doc.save(this.archivo('pdf'));
  }

  downloadExcel(): void {
    this.error.set(null);
    const wsData: string[][] = [[this.titulo()], [`Fecha: ${this.fecha}`]];
    if (this.detalle()) wsData.push([this.detalle()]);
    if (this.campos().length > 0) {
      wsData.push([]);
      for (const campo of this.campos()) wsData.push([campo.etiqueta, campo.valor]);
    }
    for (const seccion of this.secciones()) {
      wsData.push([], [seccion.titulo], seccion.headers);
      if (seccion.rows.length === 0) wsData.push(['Sin registros']);
      else wsData.push(...seccion.rows);
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Informe');
    XLSX.writeFile(wb, this.archivo('xlsx'));
  }

  async downloadWord(): Promise<void> {
    this.error.set(null);
    const children: Parameters<typeof saveDocx>[1] = [
      buildHeading(this.titulo()),
      buildParagraph(`Fecha: ${this.fecha}`),
      ...(this.detalle() ? [buildParagraph(this.detalle())] : []),
      ...(this.campos().length
        ? [buildSpacer(), ...buildKeyValueLines(this.campos().map((campo) => [campo.etiqueta, campo.valor] as [string, string]))]
        : []),
    ];
    for (const seccion of this.secciones()) {
      children.push(
        buildSpacer(),
        buildSubheading(seccion.titulo),
        buildTable(
          seccion.headers,
          (seccion.rows.length > 0 ? seccion.rows : [seccion.headers.map(() => '—')]).map((row) =>
            row.map((cell) => cell.replaceAll('\n', ' · ')),
          ),
        ),
      );
    }
    try {
      await saveDocx(this.archivo('docx'), children);
    } catch {
      this.error.set('No se pudo generar el Word.');
    }
  }

  private archivo(extension: string): string {
    const fecha = new Date().toISOString().slice(0, 10);
    const base = this.nombreArchivo().replace(/[^\w.-]+/g, '_').replace(/_+/g, '_') || 'informe';
    return `${base}_${fecha}.${extension}`;
  }
}
