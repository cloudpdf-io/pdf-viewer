import { DependencyResolver } from '../utils/dependency-resolver';
import {
  IPlugin,
  PluginBatchRegistration,
  PluginManifest,
  PluginStatus
} from '../plugin-types/plugin';
import {
  PluginRegistrationError,
  PluginNotFoundError,
  CircularDependencyError,
  CapabilityNotFoundError,
  PluginConfigurationError
} from '../plugin-types/errors';
import { PdfEngine } from '@embedpdf/models';

export class PluginRegistry {
  private plugins: Map<string, IPlugin> = new Map();
  private manifests: Map<string, PluginManifest> = new Map();
  private capabilities: Map<string, string> = new Map(); // capability -> pluginId
  private status: Map<string, PluginStatus> = new Map();
  private resolver: DependencyResolver;
  private configurations: Map<string, unknown> = new Map();
  private engine: PdfEngine;

  private pendingRegistrations: Array<{
    manifest: PluginManifest<unknown>;
    packageCreator: (registry: PluginRegistry, engine: PdfEngine) => IPlugin;
    config?: unknown;
  }> = [];
  private initialized = false;

  constructor(engine: PdfEngine) {
    this.resolver = new DependencyResolver();
    this.engine = engine;
    this.engine.initialize?.();
  }

  /**
   * Register a plugin without initializing it
   */
  registerPlugin<T extends IPlugin<TConfig>, TConfig>(
    pluginPackage: { manifest: PluginManifest<TConfig>; create: (registry: PluginRegistry, engine: PdfEngine) => T },
    config?: Partial<TConfig>
  ): void {
    if (this.initialized) {
      throw new PluginRegistrationError('Cannot register plugins after initialization');
    }

    this.validateManifest(pluginPackage.manifest);

    // Store the creator function instead of creating the plugin immediately
    this.pendingRegistrations.push({
      manifest: pluginPackage.manifest,
      packageCreator: pluginPackage.create,
      config
    });
  }

  /**
   * Initialize all registered plugins in correct dependency order
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new PluginRegistrationError('Registry is already initialized');
    }

    // Build dependency graph
    for (const reg of this.pendingRegistrations) {
      const dependsOn = new Set<string>();

      // Find plugins that provide required capabilities
      for (const capability of reg.manifest.consumes) {
        const provider = this.pendingRegistrations.find(r =>
          r.manifest.provides.includes(capability)
        );
        if (provider) {
          dependsOn.add(provider.manifest.id);
        }
      }

      this.resolver.addNode(reg.manifest.id, Array.from(dependsOn));
    }

    try {
      // Get load order
      const loadOrder = this.resolver.resolveLoadOrder();

      // Initialize plugins in correct order
      for (const pluginId of loadOrder) {
        const registration = this.pendingRegistrations.find(
          r => r.manifest.id === pluginId
        );

        if (registration) {
          await this.initializePlugin(
            registration.manifest,
            registration.packageCreator,
            registration.config as Partial<unknown>
          );
        }
      }

      this.initialized = true;
      this.pendingRegistrations = []; // Clear pending registrations
    } catch (error) {
      if (error instanceof Error) {
        throw new CircularDependencyError(
          `Failed to resolve plugin dependencies: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Initialize a single plugin with all necessary checks
   */
  private async initializePlugin<TConfig>(
    manifest: PluginManifest<TConfig>,
    packageCreator: (registry: PluginRegistry, engine: PdfEngine) => IPlugin<TConfig>,
    config?: Partial<TConfig>
  ): Promise<void> {
    // Create plugin instance during initialization
    const plugin = packageCreator(this, this.engine);
    this.validatePlugin(plugin);

    const finalConfig = {
      ...manifest.defaultConfig,
      ...config
    };

    this.validateConfig(manifest.id, finalConfig, manifest.defaultConfig);

    // Verify all required capabilities are available
    for (const capability of manifest.consumes) {
      if (!this.capabilities.has(capability)) {
        throw new PluginRegistrationError(
          `Missing required capability: ${capability} for plugin ${manifest.id}`
        );
      }
    }

    // Register provided capabilities
    for (const capability of manifest.provides) {
      if (this.capabilities.has(capability)) {
        throw new PluginRegistrationError(
          `Capability ${capability} is already provided by plugin ${this.capabilities.get(capability)}`
        );
      }
      this.capabilities.set(capability, manifest.id);
    }

    // Store plugin and manifest
    this.plugins.set(manifest.id, plugin);
    this.manifests.set(manifest.id, manifest);
    this.status.set(manifest.id, 'registered');
    this.configurations.set(manifest.id, finalConfig);

    try {
      if (plugin.initialize) {
        await plugin.initialize(finalConfig);
      }
      this.status.set(manifest.id, 'active');
    } catch (error) {
      // Cleanup on initialization failure
      this.plugins.delete(manifest.id);
      this.manifests.delete(manifest.id);
      manifest.provides.forEach(cap => this.capabilities.delete(cap));
      throw error;
    }
  }

  getPluginConfig<TConfig>(pluginId: string): TConfig {
    const config = this.configurations.get(pluginId);
    if (!config) {
      throw new PluginNotFoundError(`Configuration for plugin ${pluginId} not found`);
    }
    return config as TConfig;
  }


  private validateConfig(
    pluginId: string,
    config: unknown,
    defaultConfig: unknown
  ): void {
    // Check all required fields exist
    const requiredKeys = Object.keys(defaultConfig as object);
    const missingKeys = requiredKeys.filter(
      key => !(config as object).hasOwnProperty(key)
    );

    if (missingKeys.length > 0) {
      throw new PluginConfigurationError(
        `Missing required configuration keys for plugin ${pluginId}: ${missingKeys.join(', ')}`
      );
    }

    // You could add more validation here:
    // - Type checking
    // - Value range validation
    // - Format validation
    // etc.
  }

  async updatePluginConfig<TConfig>(
    pluginId: string,
    config: Partial<TConfig>
  ): Promise<void> {
    const plugin = this.getPlugin(pluginId);
    const manifest = this.manifests.get(pluginId);
    const currentConfig = this.configurations.get(pluginId);

    if (!manifest || !currentConfig) {
      throw new PluginNotFoundError(`Plugin ${pluginId} not found`);
    }

    // Merge new config with current
    const newConfig = {
      ...currentConfig,
      ...config
    };

    // Validate new configuration
    this.validateConfig(pluginId, newConfig, manifest.defaultConfig);

    // Store new configuration
    this.configurations.set(pluginId, newConfig);

    // Reinitialize plugin if needed
    if (plugin.initialize) {
      await plugin.initialize(newConfig);
    }
  }

  /**
   * Register multiple plugins at once
   */
  registerPluginBatch(registrations: PluginBatchRegistration<IPlugin, unknown>[]): void {
    for (const reg of registrations) {
      this.registerPlugin(reg.package, reg.config);
    }
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new PluginNotFoundError(`Plugin ${pluginId} is not registered`);
    }

    const manifest = this.manifests.get(pluginId);
    if (!manifest) {
      throw new PluginNotFoundError(
        `Manifest for plugin ${pluginId} not found`
      );
    }

    // Check if any other plugins depend on this one
    for (const [otherId, otherManifest] of this.manifests.entries()) {
      if (otherId === pluginId) continue;

      const dependsOnThis = otherManifest.consumes.some(cap =>
        manifest.provides.includes(cap)
      );

      if (dependsOnThis) {
        throw new PluginRegistrationError(
          `Cannot unregister plugin ${pluginId}: plugin ${otherId} depends on it`
        );
      }
    }

    // Cleanup plugin
    try {
      if (plugin.destroy) {
        await plugin.destroy();
      }

      // Remove capabilities
      for (const capability of manifest.provides) {
        this.capabilities.delete(capability);
      }

      // Remove plugin and manifest
      this.plugins.delete(pluginId);
      this.manifests.delete(pluginId);
      this.status.delete(pluginId);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to unregister plugin ${pluginId}: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get a plugin instance
   */
  getPlugin<T extends IPlugin>(pluginId: string): T {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new PluginNotFoundError(`Plugin ${pluginId} not found`);
    }
    return plugin as T;
  }

  /**
   * Get a plugin that provides a specific capability
   */
  getCapabilityProvider(capability: string): IPlugin {
    const pluginId = this.capabilities.get(capability);
    if (!pluginId) {
      throw new CapabilityNotFoundError(
        `No plugin provides capability ${capability}`
      );
    }
    return this.getPlugin(pluginId);
  }

  /**
   * Check if a capability is available
   */
  hasCapability(capability: string): boolean {
    return this.capabilities.has(capability);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin status
   */
  getPluginStatus(pluginId: string): PluginStatus {
    const status = this.status.get(pluginId);
    if (!status) {
      throw new PluginNotFoundError(`Plugin ${pluginId} not found`);
    }
    return status;
  }

  /**
   * Validate plugin object
   */
  private validatePlugin(plugin: IPlugin): void {
    if (!plugin.id) {
      throw new PluginRegistrationError('Plugin must have an id');
    }
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.id) {
      throw new PluginRegistrationError('Manifest must have an id');
    }
    if (!manifest.name) {
      throw new PluginRegistrationError('Manifest must have a name');
    }
    if (!manifest.version) {
      throw new PluginRegistrationError('Manifest must have a version');
    }
    if (!Array.isArray(manifest.provides)) {
      throw new PluginRegistrationError('Manifest must have a provides array');
    }
    if (!Array.isArray(manifest.consumes)) {
      throw new PluginRegistrationError('Manifest must have a consumes array');
    }
  }
}