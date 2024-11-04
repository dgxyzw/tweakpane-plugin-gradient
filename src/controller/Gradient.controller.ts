import {
  ColorController,
  colorToObjectRgbaString,
  createColorStringParser,
  createValue,
  IntColor,
  SliderTextController,
  Value,
  ValueController,
  ValueMap,
  ViewProps,
  ValueEvents,
  StepConstraint,
  NumberTextController, ViewPropsEvents,
} from '@tweakpane/core';
import { APaletteController } from '@tweakpane/core/dist/input-binding/color/controller/a-palette';
import { Gradient } from '../model';
import { GradientView } from '../view';
import { GradientRangeController, GradientRangeControllerEvents } from './GradientRange.controller.ts';

export type GradientColorPickerProps = {
  layout: 'popup' | 'inline';
  expanded: boolean;
  alpha: boolean;
}

export type GradientProps = {
  timeStep: number;
  timeDecimalPrecision: number;
  colorPicker: GradientColorPickerProps | null;
  alphaPicker: boolean;
  timePicker: boolean;
}

export type GradientControllerOptions = {
  value: Value<Gradient>;
  viewProps: ViewProps;
  props: GradientProps;
}

export class GradientController implements ValueController<Gradient, GradientView> {
  public readonly value: Value<Gradient>;

  public readonly view: GradientView;

  public readonly viewProps: ViewProps;

  public readonly props: GradientProps;

  protected readonly _document: Document;

  protected readonly _gradientRangeController: GradientRangeController;

  protected _colorPickerController: ColorController | null = null;

  protected _alphaSliderController: APaletteController | null = null;

  protected _alphaNumberController: NumberTextController | null = null;

  protected _timeController: SliderTextController | null = null;

  protected _activePointId: string | null = null;

  constructor(document: Document, options: GradientControllerOptions) {
    this.value = options.value;
    this.viewProps = options.viewProps;
    this.view = new GradientView(document);
    this._document = document;
    this.props = options.props;

    this.value.emitter.on('change', () => {
      this.syncRangeValue();
      this.syncTimeValue();
      this.syncAlphaPickerValue();
      this.syncColorPickerValue();
    });

    this.viewProps.emitter.on('change', this.handleViewPropsChange.bind(this));

    this._gradientRangeController = this.buildRangeController();
    this.tryBuildColorPickerController();
    this.tryBuildAlphaPickerController();
    this.tryBuildTimeController();
  }

  protected buildRangeController(): GradientRangeController {
    const controller = new GradientRangeController(this._document, {
      value: createValue(this.value.rawValue.clone()),
      viewProps: this.viewProps,
      props: {
        timeStep: this.props.timeStep,
        timeDecimalPrecision: this.props.timeDecimalPrecision,
      },
    });

    this.view.rangeElement.appendChild(controller.view.element);
    controller.value.emitter.on('change', this.handleRangeChange.bind(this));
    controller.events.on('changeActivePointId', this.handleRangeActivePointChange.bind(this));

    return controller;
  }

  protected tryBuildColorPickerController(): void {
    if (!this.props.colorPicker) return;

    const colorPicker = this.props.colorPicker;

    this._colorPickerController = new ColorController(this._document, {
      colorType: 'int',
      supportsAlpha: colorPicker.alpha,
      pickerLayout: colorPicker.layout,
      value: createValue(new IntColor([255, 255, 255, 1], 'rgb')),
      viewProps: ViewProps.create({
        hidden: this.viewProps.get('hidden'),
        disabled: true,
        disposed: this.viewProps.get('disposed'),
      }),
      expanded: colorPicker.expanded,
      formatter: (value: IntColor): string => {
        if (colorPicker.alpha) return colorToObjectRgbaString(value, 'int');

        return colorToObjectRgbaString(value, 'int');
      },
      parser: createColorStringParser('int'),
    });

    this._colorPickerController.value.emitter.on('change', this.handleColorPickerChange.bind(this));
    this.view.colorPickerElement.appendChild(this._colorPickerController.view.element);
  }

  protected handleColorPickerChange(event: ValueEvents<IntColor>['change']): void {
    if (this._activePointId === null) return;

    const newGradient = this.value.rawValue.clone();
    const point = newGradient.getPointById(this._activePointId);

    const rgba = this.getColorPickerController().value.rawValue.toRgbaObject();
    point.value.r = rgba.r;
    point.value.g = rgba.g;
    point.value.b = rgba.b;
    point.value.a = rgba.a;

    this.updateValue(newGradient, event.options.last);
  }

  protected syncColorPickerValue(): void {
    if (this._activePointId === null) return;
    if (!this._colorPickerController) return;

    const point = this.value.rawValue.getPointById(this._activePointId);

    const rgba = new IntColor([point.value.r, point.value.g, point.value.b, point.value.a], 'rgb');
    const value = this.getColorPickerController().value.rawValue;

    if (!this.intColorsAreEqual(value, rgba)) {
      this.getColorPickerController().value.setRawValue(rgba, { forceEmit: false, last: false });
    }
  }

  protected tryBuildAlphaPickerController(): void {
    if (!this.props.alphaPicker) return;

    this._alphaSliderController = new APaletteController(this._document, {
      value: createValue(new IntColor([255, 255, 255, 1], 'rgb')),
      viewProps: ViewProps.create({
        hidden: this.viewProps.get('hidden'),
        disabled: true,
        disposed: this.viewProps.get('disposed'),
      }),
    });

    this.view.alphaPickerSliderElement.appendChild(this._alphaSliderController.view.element);
    this._alphaSliderController.value.emitter.on('change', this.handleAlphaSliderChange.bind(this));

    this._alphaNumberController = new NumberTextController(this._document, {
      value: createValue(1),
      sliderProps: ValueMap.fromObject({
        min: 0,
        max: 1,
        keyScale: 0.01,
      }),
      parser: (value: string): number => {
        return parseInt(value, 10);
      },
      viewProps: ViewProps.create({
        hidden: this.viewProps.get('hidden'),
        disabled: false,
        disposed: this.viewProps.get('disposed'),
      }),
      props: ValueMap.fromObject({
        formatter: (value: number): string => value.toFixed(2),
        keyScale: this.props.timeStep,
        pointerScale: this.props.timeStep,
      }),
    });

    this.view.alphaPickerInputElement.appendChild(this._alphaNumberController.view.element);
    this._alphaNumberController.value.emitter.on('change', this.handleAlphaNumberChange.bind(this));
  }

  protected handleAlphaSliderChange(event: ValueEvents<IntColor>['change']): void {
    if (this._activePointId === null) return;

    const newGradient = this.value.rawValue.clone();
    const point = newGradient.getPointById(this._activePointId);

    point.value.a = this.getAlphaSliderController().value.rawValue.toRgbaObject().a;

    this.updateValue(newGradient, event.options.last);
  }

  protected handleAlphaNumberChange(event: ValueEvents<number>['change']): void {
    if (this._activePointId === null) return;

    const newGradient = this.value.rawValue.clone();
    const point = newGradient.getPointById(this._activePointId);

    point.value.a = this.getAlphaNumberController().value.rawValue;

    this.updateValue(newGradient, event.options.last);
  }

  protected syncAlphaPickerValue(): void {
    if (this._activePointId === null) return;

    const point = this.value.rawValue.getPointById(this._activePointId);

    if (this._alphaSliderController) {
      const rgba = new IntColor([point.value.r, point.value.g, point.value.b, point.value.a], 'rgb');
      const value = this.getAlphaSliderController().value.rawValue;

      if (value.toRgbaObject().a !== rgba.toRgbaObject().a) {
        this.getAlphaSliderController().value.setRawValue(rgba, { forceEmit: false, last: false });
      }
    }

    if (this._alphaNumberController) {
      this.getAlphaNumberController().value.setRawValue(point.value.a, { forceEmit: false, last: false });
    }
  }

  protected tryBuildTimeController(): void {
    if (!this.props.timePicker) return;

    this._timeController = new SliderTextController(this._document, {
      sliderProps: ValueMap.fromObject({
        min: 0,
        max: 1,
        keyScale: this.props.timeStep,
      }),
      parser: (value: string): number => {
        return parseFloat(value);
      },
      viewProps: ViewProps.create({
        hidden: this.viewProps.get('hidden'),
        disposed: this.viewProps.get('disposed'),
        disabled: true,
      }),
      textProps: ValueMap.fromObject({
        formatter: (value: number): string => {
          return value.toFixed(this.props.timeDecimalPrecision);
        },
        keyScale: this.props.timeStep,
        pointerScale: this.props.timeStep,
      }),
      value: createValue(0),
    });

    this._timeController.value.emitter.on('change', this.handleTimeInputChange.bind(this));
    this.view.timePickerElement.appendChild(this._timeController.view.element);
  }

  protected handleTimeInputChange(event: ValueEvents<number>['change']): void {
    if (this._activePointId === null) return;

    const stepConstraint = new StepConstraint(this.props.timeStep);

    const newGradient = this.value.rawValue.clone();
    const point = newGradient.getPointById(this._activePointId);
    const stepValue = stepConstraint.constrain(event.rawValue);


    if ((event.rawValue - stepValue) !== 0) {
      this.getTimeController().value.setRawValue(stepValue, { forceEmit: true, last: event.options.last });
      return;
    }

    point.time = event.rawValue;
    this.updateValue(newGradient, event.options.last);
  }

  protected syncTimeValue(): void {
    if (!this._timeController) return;
    if (this._activePointId === null) return;

    const point = this.value.rawValue.getPointById(this._activePointId);

    if (this.getTimeController().value.rawValue === point.time) return;

    this.getTimeController().value.setRawValue(point.time, { forceEmit: false, last: false });
  }

  protected handleRangeActivePointChange(event: GradientRangeControllerEvents['changeActivePointId']): void {
    this._activePointId = event.pointId ?? null;
    this.updateDisabledState();

    if (this._activePointId === null) return;

    const point = this.value.rawValue.getPointById(this._activePointId);

    if (this._colorPickerController) {
      this._colorPickerController.value.setRawValue(
        new IntColor([point.value.r, point.value.g, point.value.b, point.value.a], 'rgb'),
        { forceEmit: true, last: false },
      );
    }

    if (this._alphaNumberController) {
      this._alphaNumberController.value.setRawValue(point.value.a, { forceEmit: true, last: false });
    }

    if (this._alphaSliderController) {
      const rgba = new IntColor([point.value.r, point.value.g, point.value.b, point.value.a], 'rgb');

      this._alphaSliderController.value.setRawValue(rgba, { forceEmit: true, last: false });
    }

    if (this._timeController) {
      this._timeController.value.setRawValue(point.time, { forceEmit: true, last: false });
    }
  }

  protected handleRangeChange(event: ValueEvents<Gradient>['change']): void {
    this.updateValue(event.rawValue, event.options.last);
  }

  protected intColorsAreEqual(a: IntColor, b: IntColor): boolean {
    const aRgba = a.toRgbaObject();
    const bRgba = b.toRgbaObject();

    return aRgba.r === bRgba.r && aRgba.g === bRgba.g && aRgba.b === bRgba.b && aRgba.a === bRgba.a;
  }

  protected updateValue(value: Gradient, last: boolean): void {
    if (!last && this.value.rawValue.isEqual(value)) return;

    this.value.setRawValue(value.clone(), { forceEmit: true, last });
  }

  protected syncRangeValue(): void {
    const rangeValue = this._gradientRangeController.value.rawValue.clone();

    if (this.value.rawValue.isEqual(rangeValue)) return;

    this._gradientRangeController.value.setRawValue(this.value.rawValue, { forceEmit: true, last: false });
  }

  protected handleViewPropsChange(event: ViewPropsEvents['change']): void {
    if (event.key === 'disabled') this.updateDisabledState();
  }

  protected getColorPickerController(): ColorController {
    if (!this._colorPickerController) throw new Error('Color controller not found');

    return this._colorPickerController;
  }

  protected getAlphaNumberController(): NumberTextController {
    if (!this._alphaNumberController) throw new Error('Alpha number controller not found');

    return this._alphaNumberController;
  }

  protected getAlphaSliderController(): APaletteController {
    if (!this._alphaSliderController) throw new Error('Alpha slider controller not found');

    return this._alphaSliderController;
  }

  protected getTimeController(): SliderTextController {
    if (!this._timeController) throw new Error('Time controller not found');

    return this._timeController;
  }

  protected updateDisabledState(): void {
    this._gradientRangeController.viewProps.set('disabled', this.viewProps.get('disabled'));

    const pointControllerIsDisabled = this.viewProps.get('disabled') || this._activePointId === null;
    if (this._colorPickerController) this._colorPickerController.viewProps.set('disabled', pointControllerIsDisabled);
    if (this._alphaNumberController) this._alphaNumberController.viewProps.set('disabled', pointControllerIsDisabled);
    if (this._alphaSliderController) this._alphaSliderController.viewProps.set('disabled', pointControllerIsDisabled);
    if (this._timeController) this._timeController.viewProps.set('disabled', pointControllerIsDisabled);
  }
}
