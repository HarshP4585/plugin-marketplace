# Plugin API Reference

This document provides a complete reference for all plugin interfaces, types, and APIs.

## Table of Contents

1. [Plugin Interface](#plugin-interface)
2. [Type Definitions](#type-definitions)
3. [Backend APIs](#backend-apis)
4. [Frontend APIs](#frontend-apis)
5. [Plugin Slots](#plugin-slots)
6. [Configuration Schema](#configuration-schema)

---

## Plugin Interface

Every plugin must export these functions and objects:

### Required Exports

#### `install(userId, tenantId, config, context)`

Called when the plugin is installed.

```typescript
export async function install(
  userId: number,
  tenantId: string,
  config: Record<string, any>,
  context: PluginContext
): Promise<InstallResult>
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `userId` | `number` | ID of user installing the plugin |
| `tenantId` | `string` | Tenant/organization identifier |
| `config` | `Record<string, any>` | Initial configuration (if provided) |
| `context` | `PluginContext` | Execution context with database access |

**Returns:** `Promise<InstallResult>`

**Example:**
```typescript
export async function install(userId, tenantId, config, context) {
  const { sequelize } = context;

  // Create tables
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantId}".my_table (...)
  `);

  return {
    success: true,
    message: "Plugin installed successfully",
    installedAt: new Date().toISOString(),
  };
}
```

---

#### `uninstall(userId, tenantId, context)`

Called when the plugin is uninstalled.

```typescript
export async function uninstall(
  userId: number,
  tenantId: string,
  context: PluginContext
): Promise<UninstallResult>
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `userId` | `number` | ID of user uninstalling the plugin |
| `tenantId` | `string` | Tenant/organization identifier |
| `context` | `PluginContext` | Execution context with database access |

**Returns:** `Promise<UninstallResult>`

**Example:**
```typescript
export async function uninstall(userId, tenantId, context) {
  const { sequelize } = context;

  // Drop tables
  await sequelize.query(`
    DROP TABLE IF EXISTS "${tenantId}".my_table CASCADE
  `);

  return {
    success: true,
    message: "Plugin uninstalled successfully",
    uninstalledAt: new Date().toISOString(),
  };
}
```

---

#### `validateConfig(config)`

Validates configuration before saving.

```typescript
export function validateConfig(
  config: Record<string, any>
): ValidationResult
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `config` | `Record<string, any>` | Configuration to validate |

**Returns:** `ValidationResult`

**Example:**
```typescript
export function validateConfig(config) {
  const errors: string[] = [];

  if (!config?.api_url) {
    errors.push("API URL is required");
  }

  if (config?.api_url && !config.api_url.startsWith("http")) {
    errors.push("API URL must start with http:// or https://");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

#### `metadata`

Plugin metadata for display.

```typescript
export const metadata: PluginMetadata = {
  name: string,
  version: string,
  author: string,
  description: string,
}
```

**Example:**
```typescript
export const metadata = {
  name: "My Plugin",
  version: "1.0.0",
  author: "Your Name",
  description: "A brief description",
};
```

---

### Optional Exports

#### `configure(userId, tenantId, config, context)`

Called when configuration is saved.

```typescript
export async function configure(
  userId: number,
  tenantId: string,
  config: Record<string, any>,
  context: PluginContext
): Promise<ConfigureResult>
```

---

#### `testConnection(config)`

Tests connection to external service.

```typescript
export async function testConnection(
  config: Record<string, any>
): Promise<TestConnectionResult>
```

---

#### Custom Methods

Plugins can export additional methods for specific functionality:

```typescript
// Example: MLflow plugin exports syncModels
export async function syncModels(
  tenantId: string,
  config: Record<string, any>,
  context: PluginContext
): Promise<SyncResult>
```

---

## Type Definitions

### PluginContext

```typescript
interface PluginContext {
  sequelize: Sequelize;  // Database instance
}
```

### InstallResult

```typescript
interface InstallResult {
  success: boolean;
  message: string;
  installedAt: string;  // ISO 8601 timestamp
}
```

### UninstallResult

```typescript
interface UninstallResult {
  success: boolean;
  message: string;
  uninstalledAt: string;  // ISO 8601 timestamp
}
```

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];  // Error messages if invalid
}
```

### ConfigureResult

```typescript
interface ConfigureResult {
  success: boolean;
  message: string;
  configuredAt: string;  // ISO 8601 timestamp
}
```

### TestConnectionResult

```typescript
interface TestConnectionResult {
  success: boolean;
  message: string;
  testedAt: string;  // ISO 8601 timestamp
  serverVersion?: string;  // If applicable
}
```

### PluginMetadata

```typescript
interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
}
```

---

## Backend APIs

### Marketplace Endpoints

#### GET /api/plugins/marketplace

List all available plugins.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "key": "mlflow",
      "name": "MLflow",
      "displayName": "MLflow",
      "description": "...",
      "version": "1.0.0",
      "category": "ml_ops",
      "isInstalled": false,
      "installationId": null,
      "installationStatus": null
    }
  ]
}
```

---

#### GET /api/plugins/marketplace/:key

Get single plugin details.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `key` | `string` | Plugin key |

**Response:**
```json
{
  "status": "success",
  "data": {
    "key": "mlflow",
    "name": "MLflow",
    "longDescription": "...",
    "features": [...],
    "ui": {...}
  }
}
```

---

#### GET /api/plugins/categories

List plugin categories.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "ml_ops",
      "name": "ML Operations",
      "description": "..."
    }
  ]
}
```

---

### Installation Endpoints

#### POST /api/plugins/install

Install a plugin.

**Request Body:**
```json
{
  "pluginKey": "mlflow",
  "config": {
    "api_url": "http://localhost:5000"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "pluginKey": "mlflow",
    "status": "installed",
    "installedAt": "2024-01-20T10:00:00Z"
  }
}
```

---

#### DELETE /api/plugins/installations/:id

Uninstall a plugin.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | `number` | Installation ID |

**Response:**
```json
{
  "status": "success",
  "message": "Plugin uninstalled successfully"
}
```

---

#### GET /api/plugins/installations

List installed plugins.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "pluginKey": "mlflow",
      "status": "installed",
      "configuration": {...},
      "installedAt": "2024-01-20T10:00:00Z"
    }
  ]
}
```

---

#### PUT /api/plugins/installations/:id/configuration

Update plugin configuration.

**Request Body:**
```json
{
  "configuration": {
    "api_url": "http://localhost:5000",
    "api_key": "secret"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Configuration updated successfully"
}
```

---

#### POST /api/plugins/:key/test-connection

Test plugin connection.

**Request Body:**
```json
{
  "configuration": {
    "api_url": "http://localhost:5000"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "success": true,
    "message": "Connection successful",
    "testedAt": "2024-01-20T10:00:00Z"
  }
}
```

---

### UI Bundle Endpoint

#### GET /api/plugins/:key/ui/dist/:filename

Serve plugin UI bundle.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `key` | `string` | Plugin key |
| `filename` | `string` | Bundle filename |

**Response:**
- Content-Type: `application/javascript`
- Body: JavaScript bundle file

---

## Frontend APIs

### PluginRegistryContext

#### usePluginRegistry()

Hook to access plugin registry.

```typescript
const {
  installedPlugins,
  isLoading,
  loadedComponents,
  getComponentsForSlot,
  getPluginTabs,
  loadPluginUI,
  unloadPlugin,
  refreshPlugins,
  isPluginInstalled,
} = usePluginRegistry();
```

---

#### getComponentsForSlot(slotId)

Get components registered for a slot.

```typescript
const components = getComponentsForSlot("page.risks.actions");
// Returns: LoadedPluginComponent[]
```

---

#### getPluginTabs(slotId)

Get tab configurations for a slot.

```typescript
const tabs = getPluginTabs("page.models.tabs");
// Returns: PluginTabConfig[]
```

---

#### loadPluginUI(pluginKey, uiConfig)

Load a plugin's UI bundle.

```typescript
await loadPluginUI("mlflow", {
  bundleUrl: "/api/plugins/mlflow/ui/dist/index.esm.js",
  globalName: "PluginMLFlow",
  slots: [...]
});
```

---

#### unloadPlugin(pluginKey)

Remove a plugin's components from all slots.

```typescript
unloadPlugin("mlflow");
```

---

#### refreshPlugins()

Refresh the installed plugins list.

```typescript
await refreshPlugins();
```

---

#### isPluginInstalled(pluginKey)

Check if a plugin is installed.

```typescript
const installed = isPluginInstalled("mlflow");
// Returns: boolean
```

---

### usePluginInstallation()

Hook for install/uninstall operations.

```typescript
const {
  install,
  uninstall,
  installing,
  uninstalling,
  error,
} = usePluginInstallation();

// Install
await install("mlflow");

// Uninstall
await uninstall(installationId, "mlflow");
```

---

### usePlugins()

Hook to fetch all plugins (marketplace + installed status).

```typescript
const { plugins, loading, error, refetch } = usePlugins();
```

---

## Plugin Slots

### Slot Definitions

```typescript
export const PLUGIN_SLOTS = {
  RISKS_ACTIONS: "page.risks.actions",
  RISKS_TOOLBAR: "page.risks.toolbar",
  MODELS_TABS: "page.models.tabs",
  MODELS_TOOLBAR: "page.models.toolbar",
  PLUGIN_CONFIG: "page.plugin.config",
  DASHBOARD_WIDGETS: "page.dashboard.widgets",
  SIDEBAR_ITEMS: "layout.sidebar.items",
} as const;
```

### Render Types

```typescript
export type PluginRenderType =
  | "menuitem"   // Menu item in dropdown
  | "modal"      // Modal/dialog
  | "tab"        // Tab panel content
  | "card"       // Card widget
  | "button"     // Action button
  | "widget"     // Dashboard widget
  | "raw";       // Raw component
```

### Slot Configuration

```typescript
interface PluginSlotConfig {
  slotId: string;           // Target slot ID
  componentName: string;    // Exported component name
  renderType: PluginRenderType;
  props?: Record<string, any>;  // Default props
  trigger?: string;         // For modals - triggering component
}
```

### PluginSlot Component

```tsx
<PluginSlot
  id={PLUGIN_SLOTS.RISKS_ACTIONS}
  renderType="menuitem"
  slotProps={{
    onMenuClose: () => {},
    onTriggerModal: (name) => {},
  }}
/>
```

**Props:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `PluginSlotId` | Yes | Slot identifier |
| `slotProps` | `object` | No | Props passed to components |
| `renderType` | `PluginRenderType` | No | Filter by render type |
| `activeTab` | `string` | No | For tab slots - active tab |
| `pluginKey` | `string` | No | Filter to specific plugin |
| `wrapper` | `Component` | No | Wrapper for each component |
| `fallback` | `ReactNode` | No | Loading fallback |

---

## Configuration Schema

### plugins.json Schema

```typescript
interface PluginsManifest {
  version: string;
  plugins: Plugin[];
  categories: Category[];
}

interface Plugin {
  // Identity
  key: string;              // Unique identifier (lowercase, hyphens)
  name: string;             // Display name
  displayName: string;      // UI display name
  version: string;          // Semantic version

  // Metadata
  description: string;      // Short description
  longDescription?: string; // Detailed description
  author: string;           // Author name
  category: string;         // Category ID

  // URLs
  iconUrl?: string;         // Icon path
  documentationUrl?: string;
  supportUrl?: string;

  // Flags
  isOfficial?: boolean;     // Official plugin
  isPublished: boolean;     // Visible in marketplace
  requiresConfiguration: boolean;

  // Installation
  installationType: "standard" | "tenant_scoped";
  pluginPath: string;       // Path to plugin code
  entryPoint: string;       // Main file (index.ts)
  dependencies?: Record<string, string>;

  // Features
  features?: Feature[];
  tags?: string[];

  // UI
  ui?: PluginUIConfig;
}

interface Feature {
  name: string;
  description: string;
  displayOrder: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface PluginUIConfig {
  bundleUrl: string;        // URL to IIFE bundle
  globalName?: string;      // Global variable name
  slots: PluginSlotConfig[];
}
```

### Example plugins.json Entry

```json
{
  "key": "my-plugin",
  "name": "My Plugin",
  "displayName": "My Plugin",
  "description": "Short description for marketplace card",
  "longDescription": "Detailed description for plugin detail page",
  "version": "1.0.0",
  "author": "Your Name",
  "category": "data_management",
  "iconUrl": "/assets/my_plugin_logo.svg",
  "documentationUrl": "https://docs.example.com",
  "supportUrl": "https://support.example.com",
  "isOfficial": false,
  "isPublished": true,
  "requiresConfiguration": true,
  "installationType": "tenant_scoped",
  "pluginPath": "plugins/my-plugin",
  "entryPoint": "index.ts",
  "dependencies": {
    "axios": "^1.6.0"
  },
  "features": [
    {
      "name": "Feature One",
      "description": "What this feature does",
      "displayOrder": 1
    },
    {
      "name": "Feature Two",
      "description": "What this feature does",
      "displayOrder": 2
    }
  ],
  "tags": ["keyword1", "keyword2"],
  "ui": {
    "bundleUrl": "/api/plugins/my-plugin/ui/dist/index.esm.js",
    "globalName": "PluginMyPlugin",
    "slots": [
      {
        "slotId": "page.plugin.config",
        "componentName": "MyPluginConfig",
        "renderType": "card"
      },
      {
        "slotId": "page.models.tabs",
        "componentName": "MyPluginTab",
        "renderType": "tab",
        "props": {
          "label": "My Plugin",
          "icon": "Database"
        }
      }
    ]
  }
}
```
