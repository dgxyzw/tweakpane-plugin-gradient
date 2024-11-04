import { Value, View } from '@tweakpane/core';
import { Gradient, GradientPoint } from '../model';

export type GradientRangeViewOptions = {
  value: Value<Gradient>
}

export class GradientRangeView implements View {
  public readonly document: Document;

  public readonly element: HTMLElement;

  public readonly rangeUnderlayElement: HTMLDivElement;

  public readonly rangeOverlayElement: HTMLDivElement;

  public readonly value: Value<Gradient>;

  public draggingPointId: string | null = null;

  public activePointId: string | null = null;

  constructor(document: Document, options: GradientRangeViewOptions) {
    this.document = document;
    this.value = options.value;
    this.element = this.document.createElement('div');

    this.element = this.document.createElement('div');
    this.element.classList.add('tp-gradient-range');
    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    this.rangeUnderlayElement = document.createElement('div');
    this.rangeUnderlayElement.classList.add('tp-gradient-range__underlay');
    this.element.appendChild(this.rangeUnderlayElement);

    this.rangeOverlayElement = document.createElement('div');
    this.rangeOverlayElement.classList.add('tp-gradient-range__overlay');
    this.element.appendChild(this.rangeOverlayElement);

    this.update();

    this.value.emitter.on('change', () => this.update());
  }

  public update(): void {
    this.rebuildMarkers();
    this.updateGradientColors();
    this.updateActiveMarker();
    this.updateDraggingMarker();
  }

  public isOverlayElement(element: unknown): element is HTMLDivElement {
    if (!(element instanceof HTMLDivElement)) return false;
    if (!element.classList.contains('tp-gradient-range__overlay')) return false;

    return true;
  }

  public isMarkerElement(element: unknown): element is HTMLDivElement {
    if (!(element instanceof HTMLDivElement)) return false;
    if (!element.classList.contains('tp-gradient-range__marker')) return false;
    if (!element.dataset.id) return false;

    return true;
  }

  protected rebuildMarkers(): void {
    const elements = Array.from(this.rangeOverlayElement.children) as HTMLDivElement[];

    for (const element of elements) {
      if (!this.isMarkerElement(element)) throw new Error('Invalid element');

      const id = element.dataset.id;
      const point = this.value.rawValue.points.find((p) => p.id === id);

      if (!point) element.remove();
    }

    this.value.rawValue.points.forEach((point) => {
      let element = this.rangeOverlayElement.querySelector(`[data-id="${point.id}"]`) as HTMLDivElement | null;

      if (element) {
        this.updateMarkerElement(element, point);
      } else {
        element = document.createElement('div');
        this.updateMarkerElement(element, point);
        this.rangeOverlayElement.appendChild(element);
      }
    });
  }

  protected updateGradientColors(): void {
    const cssColors = [...this.value.rawValue.points]
      .sort((a, b) => a.time - b.time)
      .map((marker) => {
        return `${this.getPointCssColor(marker)} ${marker.time * 100}%`;
      });

    const cssGradient = `linear-gradient(to right, ${cssColors.join(', ')})`;
    this.rangeOverlayElement.style.setProperty('background', cssGradient);
  }

  protected getMarkerElementById(id: string): HTMLDivElement {
    const element = this.rangeOverlayElement.querySelector(`[data-id="${id}"]`);

    if (!(element instanceof HTMLDivElement)) throw new Error('No marker element found');

    return element;
  }

  protected updateActiveMarker(): void {
    for (const marker of this.rangeOverlayElement.children) {
      marker.classList.remove('tp-gradient-range__marker--active');
    }

    if (!this.activePointId) return;

    this.getMarkerElementById(this.activePointId).classList.add('tp-gradient-range__marker--active');
  }

  protected updateDraggingMarker(): void {
    for (const marker of this.rangeOverlayElement.children) {
      marker.classList.remove('tp-gradient-range__marker--dragging');
    }

    this.rangeOverlayElement.classList.remove('tp-gradient-range__overlay--dragging');

    if (!this.draggingPointId) return;

    for (const marker of this.rangeOverlayElement.children) {
      marker.classList.add('tp-gradient-range__marker--dragging');
    }

    this.rangeOverlayElement.classList.add('tp-gradient-range__overlay--dragging');
  }

  protected updateMarkerElement(element: HTMLDivElement, point: GradientPoint): void {
    element.classList.add('tp-gradient-range__marker');
    element.style.left = `${point.time * 100}%`;
    element.style.background = this.getPointCssColor(point);
    element.dataset.id = point.id;
  }

  protected getPointCssColor(point: GradientPoint): string {
    return `rgba(${point.value.r}, ${point.value.g}, ${point.value.b}, ${point.value.a})`;
  }
}
