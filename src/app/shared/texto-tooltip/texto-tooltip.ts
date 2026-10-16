import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Component, Directive, ElementRef, OnDestroy, inject, input } from '@angular/core';

@Component({
  selector: 'app-texto-tooltip-panel',
  standalone: true,
  template: `<div class="texto-tooltip" role="tooltip">{{ texto() }}</div>`,
  styles: [
    `
      .texto-tooltip {
        max-width: min(360px, calc(100vw - 24px));
        max-height: min(320px, calc(100vh - 24px));
        overflow-y: auto;
        padding: 8px 11px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--popover);
        color: var(--popover-foreground);
        font-size: 12px;
        line-height: 1.45;
        white-space: pre-line;
        overflow-wrap: anywhere;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
      }
    `,
  ],
})
class TextoTooltipPanel {
  texto = input('');
}

/**
 * Muestra el texto completo de una celda solo cuando está recortado (truncate / line-clamp).
 * Con mouse abre al pasar por encima; en pantallas táctiles abre y cierra al tocar.
 */
@Directive({
  selector: '[appTextoTooltip]',
  standalone: true,
  host: {
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(focusin)': 'abrir()',
    '(focusout)': 'cerrar()',
  },
})
export class TextoTooltip implements OnDestroy {
  readonly appTextoTooltip = input<string | null | undefined>('');

  private readonly overlay = inject(Overlay);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private ref: OverlayRef | null = null;

  onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.abrir();
  }

  onPointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.cerrar();
  }

  onPointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') return;
    if (this.ref) this.cerrar();
    else this.abrir();
  }

  abrir(): void {
    const texto = this.appTextoTooltip()?.trim();
    if (!texto || this.ref || !this.estaRecortado()) return;

    this.ref = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.el)
        .withPush(true)
        .withViewportMargin(8)
        .withPositions([
          { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
          { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
          { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });
    this.ref.outsidePointerEvents().subscribe((e) => {
      if (!this.el.nativeElement.contains(e.target as Node)) this.cerrar();
    });
    this.ref.attach(new ComponentPortal(TextoTooltipPanel)).setInput('texto', texto);
  }

  cerrar(): void {
    this.ref?.dispose();
    this.ref = null;
  }

  ngOnDestroy(): void {
    this.cerrar();
  }

  private estaRecortado(): boolean {
    const el = this.el.nativeElement;
    return el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
  }
}
