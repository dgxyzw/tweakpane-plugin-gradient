import {
  BladeApi,
  LabeledValueBladeController,
  TpChangeEvent,
} from '@tweakpane/core';
import { Gradient } from '../model';
import { GradientRangeController } from '../controller';

export type GradientBladeApiEvents = {
  change: {
    event: TpChangeEvent<Gradient>;
  };
}

export class GradientBladeApi extends BladeApi<LabeledValueBladeController<Gradient, GradientRangeController>> {
  constructor(controller: LabeledValueBladeController<Gradient, GradientRangeController>) {
    super(controller);
    this.setupEvents();
  }

  protected _handlers: {
    [K in keyof GradientBladeApiEvents]: Array<(ev: GradientBladeApiEvents['change']['event']) => void>
  } = {
    change: [],
  };

  public get value(): Gradient {
    return this.controller.valueController.value.rawValue;
  }

  public set value(value: Gradient) {
    this.controller.valueController.value.setRawValue(value.clone(), { forceEmit: true, last: false });
  }

  public get activePointId(): string | null {
    return this.controller.valueController.view.draggingPointId;
  }

  public on<EventName extends keyof GradientBladeApiEvents>(
    eventName: EventName,
    handler: (ev: GradientBladeApiEvents[EventName]['event']) => void,
  ): this {
    if (this._handlers[eventName].indexOf(handler) !== -1) return this;

    this._handlers[eventName].push(handler);

    return this;
  }

  public off<EventName extends keyof GradientBladeApiEvents>(
    eventName: EventName,
    handler: (ev: GradientBladeApiEvents[EventName]['event']) => void,
  ): this {
    const index = this._handlers[eventName].indexOf(handler);

    if (index === -1) return this;

    this._handlers[eventName].splice(index, 1);

    return this;
  }

  protected setupEvents(): void {
    this.controller.valueController.value.emitter.on('change', (ev) => {
      const event = new TpChangeEvent(this, ev.rawValue.clone(), ev.options.last);
      this._handlers.change.forEach((handler) => handler(event));
    });
  }
}
