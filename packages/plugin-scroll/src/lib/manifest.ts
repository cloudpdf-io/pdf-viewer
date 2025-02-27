import { PluginManifest } from "@embedpdf/core";
import { ScrollPluginConfig } from "./types";

export const SCROLL_PLUGIN_ID = 'scroll';

export const manifest: PluginManifest<ScrollPluginConfig> = {
  id: SCROLL_PLUGIN_ID,
  name: 'Scroll Plugin',
  version: '1.0.0',
  provides: [],
  consumes: ['viewport', 'page-manager'],
  defaultConfig: {
    enabled: true
  }
}; 