import {
  Emitter, StepConstraint,
  Value,
  ValueController,
  ViewProps,
} from '@tweakpane/core';
import { Gradient, GradientPoint } from '../model';
import { GradientRangeView } from '../view';

export type GradientRangeControllerProps = {
  timeStep: number;
  timeDecimalPrecision: number;
}

export type GradientRangeControllerOptions = {
  value: Value<Gradient>;
  viewProps: ViewProps;
  props: GradientRangeControllerProps;
}

export type GradientRangeControllerEvents = {
  changeActivePointId: {
    pointId: string | null,
  }
}

export class GradientRangeController implements ValueController<Gradient, GradientRangeView> {
  public readonly value: Value<Gradient>;

  public readonly view: GradientRangeView;

  public readonly viewProps: ViewProps;

  public readonly events: Emitter<GradientRangeControllerEvents>;

  protected _props: GradientRangeControllerProps;

  protected _activePointId: string | null = null;

  protected _draggingPointId: string | null = null;

  protected _mouseDownStartPosition: { x: number; y: number; } = { x: 0, y: 0 };

  protected _dragCanStartWithPointId: string | null = null;

  constructor(document: Document, options: GradientRangeControllerOptions) {
    this.value = options.value;
    this.viewProps = options.viewProps;
    this.view = new GradientRangeView(document, { value: this.value });
    this.events = new Emitter();
    this._props = options.props;

    window.addEventListener('mouseup', this.handleWindowMouseUp.bind(this));
    window.addEventListener('mousemove', this.handleWindowMouseMove.bind(this));
    this.view.rangeOverlayElement.addEventListener('mousedown', this.handleRangeOverlayMouseDown.bind(this));
    this.viewProps.bindClassModifiers(this.view.element);
  }

  protected handleWindowMouseMove(event: MouseEvent): void {
    if (this._dragCanStartWithPointId) {
      this.setDraggingPointId(this._dragCanStartWithPointId);
      this._dragCanStartWithPointId = null;
    }
    if (this._draggingPointId === null) return;

    this.moveDraggingPoint(this.getPointTimeByMouseEvent(event));
  }

  protected handleRangeOverlayMouseDown(event: MouseEvent): void {
    this._mouseDownStartPosition = { x: event.clientX, y: event.clientY };

    event.stopPropagation();
    event.preventDefault();

    if (!this.view.isMarkerElement(event.target)) return;

    const point = this.value.rawValue.getPointById(event.target.dataset.id ?? '');

    this.setActivePointId(point.id);
    this._dragCanStartWithPointId = point.id;
  }

  protected handleWindowMouseUp(event: MouseEvent): void {
    if (this.view.isOverlayElement(event.target)) {
      this.handleWindowMouseUpOnOverlay(event);
    } else if (this.view.isMarkerElement(event.target)) {
      this.handleWindowMouseUpOnMarker(event, event.target as HTMLDivElement);
    } else {
      if (this._draggingPointId !== null) {
        const dragPoint = this.value.rawValue.getPointById(this._draggingPointId);
        const sameTimePoint = this.value.rawValue.tryGetSameTimePoint(dragPoint);

        if (sameTimePoint && this.value.rawValue.points.length > 2) this.removePoint(dragPoint);
      }

      this._dragCanStartWithPointId = null;
      this.setDraggingPointId(null);
    }
  }

  protected handleWindowMouseUpOnMarker(event: MouseEvent, markerElement: HTMLDivElement): void {
    this._dragCanStartWithPointId = null;
    this.setDraggingPointId(null);

    if (event.button !== 2) return;
    if (this.value.rawValue.points.length <= 2) return;

    const point = this.value.rawValue.getPointById(markerElement.dataset.id ?? '');

    if (point.id === this._activePointId) this.setActivePointId(null);
    this.removePoint(point);
  }

  protected handleWindowMouseUpOnOverlay(event: MouseEvent): void {
    const draggingWasActive = this._draggingPointId !== null;
    this._dragCanStartWithPointId = null;
    this.setDraggingPointId(null);

    if (event.button !== 0) return;
    if (this._mouseDownStartPosition.x !== event.clientX || this._mouseDownStartPosition.y !== event.clientY) return;
    if (draggingWasActive) return;

    this.setActivePointId(this.addPoint(this.getPointTimeByMouseEvent(event)).id);
  }

  protected addPoint(time: number): GradientPoint {
    const value = this.value.rawValue.clone();
    const point = value.addPoint({
      time,
      value: this.value.rawValue.getInterpolatedColor(time),
    });

    this.updateValue(value, true);

    return point;
  }

  protected setActivePointId(id: string | null): void {
    this._activePointId = id;
    this.view.activePointId = id;
    this.view.update();

    this.events.emit('changeActivePointId', { pointId: id });
  }

  public setDraggingPointId(id: string | null): void {
    this._draggingPointId = id;
    this.view.draggingPointId = id;
    this.view.update();
  }

  protected moveDraggingPoint(targetTime: number): void {
    if (this._draggingPointId === null) throw new Error('No dragging marker element');

    const value = this.value.rawValue.clone();

    const point = value.getPointById(this._draggingPointId);

    point.time = targetTime;

    this.updateValue(value, false);
  }

  protected getPointTimeByMouseEvent(event: MouseEvent): number {
    const rect = this.view.element.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const value = Math.max(0, Math.min(1, x / rect.width));

    return parseFloat(value.toFixed(this._props.timeDecimalPrecision));
  }

  protected removePoint(point: GradientPoint): void {
    const value = this.value.rawValue.clone();

    value.removePointById(point.id);

    this.updateValue(value, true);
  }

  protected updateValue(value: Gradient, last: boolean): void {
    const stepConstraint = new StepConstraint(this._props.timeStep);

    value.points.forEach((point) => {
      point.time = stepConstraint.constrain(point.time);
    });

    if (value.isEqual(this.value.rawValue)) return;

    this.value.setRawValue(value, { forceEmit: true, last });
  }
}
