import {
  BaseBladeParams,
  BladePlugin,
  createPlugin,
  createValue,
  LabeledValueBladeController,
  LabelPropsObject,
  ValueMap,
} from '@tweakpane/core';
import { Gradient, GradientPoint } from './model';
import { GradientBladeApi } from './api';
import { GradientColorPickerProps, GradientController } from './controller';


export interface GradientBladeParams extends BaseBladeParams {
  initialPoints: Array<Omit<GradientPoint, 'id'>>;
  view: 'gradient';
  label?: string;
  timeStep?: number;
  timeDecimalPrecision?: number;
  colorPicker?: boolean;
  colorPickerProps?: Partial<GradientColorPickerProps>;
  alphaPicker?: boolean;
  timePicker?: boolean;
}

export const GradientBladePlugin: BladePlugin<GradientBladeParams> = createPlugin({
  id: 'gradient',
  type: 'blade',
  accept(params) {
    if (params.view !== 'gradient') return null;

    return {
      initialValue: params.value,
      params: params,
    };
  },
  controller(args) {
    const rawValue = new Gradient({
      points: args.params.initialPoints,
    });
    const value = createValue(rawValue);

    let defaultColorPickerProps: GradientColorPickerProps = {
      alpha: true,
      layout: 'popup',
      expanded: false,
    };

    const valueController = new GradientController(document, {
      value,
      viewProps: args.viewProps,
      props: {
        colorPicker: args.params.colorPicker ? Object.assign(defaultColorPickerProps, args.params.colorPickerProps) : null,
        alphaPicker: args.params.alphaPicker ?? false,
        timePicker: args.params.timePicker ?? false,
        timeStep: args.params.timeStep ?? 0.0001,
        timeDecimalPrecision: args.params.timeDecimalPrecision ?? 4,
      },
    });

    return new LabeledValueBladeController(args.document, {
      blade: args.blade,
      props: ValueMap.fromObject({ label: args.params.label } as LabelPropsObject),
      value,
      valueController,
    });
  },
  api: (args) => {
    if (!(args.controller instanceof LabeledValueBladeController)) {
      return null;
    }
    if (!(args.controller.valueController instanceof GradientController)) {
      return null;
    }

    return new GradientBladeApi(args.controller);
  },
});

