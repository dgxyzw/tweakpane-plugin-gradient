import { TpPluginBundle } from '@tweakpane/core';
import { GradientBladePlugin } from './plugin.ts';
import styles from './styles.css?inline';

export const GradientPluginBundle: TpPluginBundle = {
  id: 'gradient',
  plugins: [GradientBladePlugin],
  css: styles,
};
