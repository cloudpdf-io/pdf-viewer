import { BasePluginConfig } from "@embedpdf/core";

export interface SpreadPluginConfig extends BasePluginConfig {
  defaultSpreadMode?: SpreadMode;
}

export type SpreadMode = 'none' | 'odd' | 'even';

export interface SpreadMetrics {
  // How pages are grouped
  getSpreadForPage(pageIndex: number): number[];
  getAllSpreads(): number[][];
}

export interface SpreadCapability {
  onSpreadChange(handler: (metrics: SpreadMetrics) => void): void;
  getCurrentMetrics(): SpreadMetrics;
  setSpreadMode(mode: SpreadMode): void;
  getSpreadMode(): SpreadMode;
}