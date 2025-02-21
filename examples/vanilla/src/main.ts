//import { PDFCore } from '@embedpdf/core';
import { NavigationPlugin, ViewportRenderLayer } from '@embedpdf/plugin-navigation';
import { PdfiumEngine } from '@embedpdf/engines';
import pdfiumWasm from '@embedpdf/pdfium/pdfium.wasm?url';
import { init } from '@embedpdf/pdfium';
import { RendererPlugin } from '@embedpdf/plugin-renderer';
import { LayerPlugin, TextLayer } from '@embedpdf/plugin-layer';
import { ZoomPlugin, ZoomPluginPackage } from '@embedpdf/plugin-zoom';
import { PluginRegistry } from '@embedpdf/core';
import { LoaderPlugin, LoaderPluginPackage } from '@embedpdf/plugin-loader';
import { ViewportPlugin, ViewportPluginPackage } from '@embedpdf/plugin-viewport';
import { ScrollPluginPackage } from '@embedpdf/plugin-scroll';
import { SpreadCapability, SpreadMode, SpreadPlugin, SpreadPluginPackage } from '@embedpdf/plugin-spread';

async function loadWasmBinary() {
  const response = await fetch(pdfiumWasm);
  const wasmBinary = await response.arrayBuffer();
  return wasmBinary;
}

async function initializePDFViewer() {
  // Initialize engine

  const wasmBinary = await loadWasmBinary();
  const wasmModule = await init({ wasmBinary });
  const engine = new PdfiumEngine(wasmModule); 

  const registry = new PluginRegistry(engine);

  registry.registerPlugin(LoaderPluginPackage);
  registry.registerPlugin(ViewportPluginPackage, {
    container: document.getElementById('pageContainer') as HTMLElement
  });
  registry.registerPlugin(ZoomPluginPackage, {
    defaultZoomLevel: 1
  });
  registry.registerPlugin(SpreadPluginPackage, {
    defaultSpreadMode: SpreadMode.None
  });
  registry.registerPlugin(ScrollPluginPackage);

  await registry.initialize();

  const loader = registry.getPlugin<LoaderPlugin>('loader').provides();
  const spread = registry.getPlugin<SpreadPlugin>('spread').provides();

  const pdfDocument = await loader.loadDocument({
    id: '1',
    source: '/file/compressed.tracemonkey-pldi-09.pdf'
  });
  
  console.log(pdfDocument);

  setupUIControls(spread);

  /*
  const wasmBinary = await loadWasmBinary();
  const wasmModule = await init({ wasmBinary });
  const engine = new PdfiumEngine(wasmModule); 

  const core = new PDFCore({
    engine
  });

  // Initialize and register renderer plugin
  const rendererPlugin = new RendererPlugin();
  await core.registerPlugin(rendererPlugin);

  // Initialize layer plugin
  const layerPlugin = new LayerPlugin();
  await core.registerPlugin(layerPlugin);

  // Register default layers
  await layerPlugin.registerLayer(new TextLayer());
  await layerPlugin.registerLayer(new ViewportRenderLayer());

  // Initialize and register zoom plugin
  const zoomPlugin = new ZoomPlugin({
    defaultZoomLevel: 1.5,
    container: document.getElementById('pageContainer') as HTMLElement
  });
  await core.registerPlugin(zoomPlugin);

  // Initialize and register navigation plugin
  const navigationPlugin = new NavigationPlugin({
    defaultScrollMode: 'continuous',
    container: document.getElementById('pageContainer') as HTMLElement
  });

  await core.registerPlugin(navigationPlugin);

  const pdfDocument = await core.loadDocument({
    file: {
      id: '1',
      name: 'linearized.pdf',
    },
    source: '/file/compressed.tracemonkey-pldi-09.pdf',
    password: ''
  });

  updatePageInfo(1, pdfDocument.pageCount);

  // Listen to navigation events
  core.on('navigation:pageChanged', (pageNumber) => {
    console.log(`Page changed to ${pageNumber}`);
    updatePageInfo(pageNumber, navigationPlugin.getState().totalPages);
  });

  // Set up UI controls
  setupUIControls(navigationPlugin, zoomPlugin);
  */
}

/*
function setupUIControls(navigationPlugin: NavigationPlugin, zoomPlugin: ZoomPlugin) {
  const prevButton = document.getElementById('prevPage') as HTMLButtonElement;
  const nextButton = document.getElementById('nextPage') as HTMLButtonElement;
  const zoomSelect = document.getElementById('zoomLevel') as HTMLSelectElement;

  // Set initial zoom level
  zoomSelect.value = zoomPlugin.getState().zoomLevel.toString();

  prevButton.addEventListener('click', async () => {
    const { currentPage } = navigationPlugin.getState();
    if (currentPage > 1) {
      await navigationPlugin.goToPage(currentPage - 1);
    }
  });

  nextButton.addEventListener('click', async () => {
    const { currentPage, totalPages } = navigationPlugin.getState();
    if (currentPage < totalPages) {
      await navigationPlugin.goToPage(currentPage + 1);
    }
  });

  // Add zoom level change handler
  zoomSelect.addEventListener('change', async () => {
    const newZoom = isNaN(parseFloat(zoomSelect.value)) ? zoomSelect.value : parseFloat(zoomSelect.value);
    await zoomPlugin.updateZoomLevel(newZoom as ZoomLevel);
  });
}

function updatePageInfo(currentPage: number, totalPages: number) {
  const pageInfo = document.getElementById('pageInfo');
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
}
*/

function setupUIControls(spread: SpreadCapability) {
  const spreadSelect = document.getElementById('spreadMode') as HTMLSelectElement;

  spreadSelect.addEventListener('change', async () => {
    const newSpreadMode = spreadSelect.value as SpreadMode;
    spread.setSpreadMode(newSpreadMode);
  });
}

initializePDFViewer();