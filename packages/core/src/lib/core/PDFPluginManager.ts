import { EventEmitter } from './EventEmitter';
import { IPlugin, IPluginManager, PluginState } from '../types/plugin';
import { IPDFCore } from '../types/core';

export class PDFPluginManager extends EventEmitter implements IPluginManager {
  protected plugins: Map<string, IPlugin> = new Map();
  protected pluginStates: Map<string, PluginState> = new Map();

  async registerPlugin(plugin: IPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    // Initialize the plugin with the parent instance
    await plugin.initialize(this.getPluginHost());
    this.plugins.set(plugin.name, plugin);

    // Set up state management
    this.pluginStates.set(plugin.name, plugin.getState());

    // Listen for state changes
    this.on(`${plugin.name}:stateChange`, (newState: PluginState) => {
      this.pluginStates.set(plugin.name, newState);
    });

    // Emit plugin registered event
    this.emit('plugin:registered', { name: plugin.name });
  }

  // Protected method for child classes to override
  protected getPluginHost(): IPDFCore {
    throw new Error('getPluginHost must be implemented by child class');
  }

  async unregisterPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) return;

    // Clean up plugin
    await plugin.destroy();
    this.plugins.delete(pluginName);
    this.pluginStates.delete(pluginName);

    // Emit plugin unregistered event
    this.emit('plugin:unregistered', { name: pluginName });
  }

  getPlugin<T extends IPlugin>(name: string): T | undefined {
    return this.plugins.get(name) as T;
  }

  getPluginState(name: string): PluginState | undefined {
    return this.pluginStates.get(name);
  }

  getAllPlugins(): Map<string, IPlugin> {
    return new Map(this.plugins);
  }
} 