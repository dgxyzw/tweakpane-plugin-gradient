import './style.css';
import { Pane } from 'tweakpane';
import { Gradient, GradientBladeApi, GradientBladeParams, GradientPluginBundle } from '../src';

const centerElement = document.createElement('div');
const topRightElement = document.createElement('div');
centerElement.id = 'center';
topRightElement.id = 'top-right';
document.body.appendChild(centerElement);
document.body.appendChild(topRightElement);

const pane = new Pane({
  title: 'Tweakpane Gradient Plugin',
  container: centerElement,
});

pane.registerPlugin(GradientPluginBundle);

const updateBackground = (gradient: Gradient): void => {
  document.body.style.background = gradient.toCssGradient();
};

const rbgaPickerGradientParams = {
  view: 'gradient',
  initialPoints: [
    { time: 0, value: { r: 255, g: 0, b: 255, a: 1 } },
    { time: 1, value: { r: 0, g: 255, b: 255, a: 1 } },
  ],
  label: 'Gradient',
  colorPicker: true,
  colorPickerProps: {
    alpha: true,
    layout: 'popup',
    expanded: false,
  },
  alphaPicker: false,
  timePicker: false,
  timeStep: 0.001,
  timeDecimalPrecision: 4,
  disabled: false,
} satisfies GradientBladeParams;

let rgbaPickerGradient: GradientBladeApi | undefined;

const rebuild = () => {
  if (rgbaPickerGradient) {
    rbgaPickerGradientParams.initialPoints = rgbaPickerGradient.controller.value.rawValue.points;
    pane.remove(rgbaPickerGradient);
  }

  rgbaPickerGradient = pane.addBlade(rbgaPickerGradientParams) as GradientBladeApi;

  rgbaPickerGradient.on('change', (event) => {
    updateBackground(event.value);
  });

  updateBackground(rgbaPickerGradient.controller.value.rawValue);
};

rebuild();


const settingsPane = new Pane({
  title: 'Configure gradient blade',
  container: topRightElement,
});

settingsPane.addBinding(rbgaPickerGradientParams, 'colorPicker', {
  label: 'Color picker',
}).on('change', () => {
  rebuild();
});

settingsPane.addBinding(rbgaPickerGradientParams.colorPickerProps, 'alpha', {
  label: 'Color Picker Alpha',
}).on('change', () => {
  rebuild();
});

settingsPane.addBinding(rbgaPickerGradientParams.colorPickerProps, 'layout', {
  label: 'Color Picker Alpha',
  options: {
    Inline: 'inline',
    Popup: 'popup',
  },
}).on('change', () => {
  rebuild();
});

settingsPane.addBinding(rbgaPickerGradientParams.colorPickerProps, 'expanded', {
  label: 'Color Picker Expanded',
}).on('change', () => {
  rebuild();
});

settingsPane.addBlade({ view: 'separator' });

settingsPane.addBinding(rbgaPickerGradientParams, 'timePicker', {
  label: 'Time picker',
}).on('change', () => {
  rebuild();
});

settingsPane.addBlade({ view: 'separator' });

settingsPane.addBinding(rbgaPickerGradientParams, 'alphaPicker', {
  label: 'Alpha picker',
}).on('change', () => {
  rebuild();
});

settingsPane.addBlade({ view: 'separator' });

settingsPane.addBinding(rbgaPickerGradientParams, 'timeStep', {
  label: 'Time step',
  min: 0.001,
  max: 0.1,
  step: 0.001,
}).on('change', () => {
  rebuild();
});

settingsPane.addBinding(rbgaPickerGradientParams, 'timeDecimalPrecision', {
  label: 'Time decimal precision',
  min: 1,
  max: 4,
  step: 1,
}).on('change', () => {
  rebuild();
});

settingsPane.addBlade({ view: 'separator' });

settingsPane.addBinding(rbgaPickerGradientParams, 'disabled', {
  label: 'Disabled',
}).on('change', () => {
  if (!rgbaPickerGradient) return;

  rgbaPickerGradient.disabled = rbgaPickerGradientParams.disabled;
});
