# Plugin System Architecture

This document describes the overall architecture of the VerifyWise plugin system.

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Database Schema](#database-schema)
7. [Security Considerations](#security-considerations)

---

## System Overview

The VerifyWise plugin system consists of three main parts:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PLUGIN SYSTEM ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      PLUGIN MARKETPLACE                              │   │
│  │  (This Repository)                                                   │   │
│  │                                                                      │   │
│  │  ┌──────────────┐    ┌──────────────────────────────────────────┐  │   │
│  │  │ plugins.json │    │ plugins/                                  │  │   │
│  │  │ (Registry)   │    │ ├── mlflow/                               │  │   │
│  │  │              │    │ │   ├── index.ts (backend)               │  │   │
│  │  │              │    │ │   └── ui/ (frontend)                   │  │   │
│  │  │              │    │ ├── risk-import/                         │  │   │
│  │  │              │    │ └── slack/                               │  │   │
│  │  └──────────────┘    └──────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      │ Fetches plugins.json                 │
│                                      │ Loads plugin code                    │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      VERIFYWISE BACKEND                              │   │
│  │  (Servers/)                                                          │   │
│  │                                                                      │   │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │   │
│  │  │ PluginService│    │ Plugin       │    │ Database     │          │   │
│  │  │              │───►│ Controller   │───►│ plugin_      │          │   │
│  │  │              │    │              │    │ installations│          │   │
│  │  └──────────────┘    └──────────────┘    └──────────────┘          │   │
│  │         │                                                            │   │
│  │         │ Executes plugin lifecycle methods                          │   │
│  │         │ Serves UI bundles                                          │   │
│  │         ▼                                                            │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │ Plugin Sandbox (temp/plugins/)                                │   │   │
│  │  │ Loaded plugin code executed here                              │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      │ REST API                             │
│                                      │ UI Bundles                           │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      VERIFYWISE FRONTEND                             │   │
│  │  (Clients/)                                                          │   │
│  │                                                                      │   │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │   │
│  │  │ PluginRegistry│   │ PluginLoader │    │ PluginSlot   │          │   │
│  │  │ Context      │───►│ Component    │───►│ Components   │          │   │
│  │  └──────────────┘    └──────────────┘    └──────────────┘          │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │ Dynamic Plugin UIs                                            │   │   │
│  │  │ window.PluginMlflow, window.PluginRiskImport, etc.           │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Plugin Marketplace (This Repository)

```
plugin-marketplace/
├── plugins.json                 # Registry manifest
│   ├── version                  # Marketplace version
│   ├── plugins[]                # Plugin definitions
│   │   ├── key                  # Unique identifier
│   │   ├── metadata             # Display info
│   │   ├── pluginPath           # Code location
│   │   └── ui                   # UI configuration
│   └── categories[]             # Category definitions
│
└── plugins/                     # Plugin implementations
    └── {plugin-key}/
        ├── index.ts             # Backend entry point
        ├── package.json         # Dependencies
        ├── README.md            # Documentation
        └── ui/                  # Frontend UI
            ├── src/             # React components
            ├── vite.config.ts   # Build config
            └── dist/            # Built bundle
```

### VerifyWise Backend

```
Servers/
├── services/plugin/
│   ├── pluginService.ts         # Core plugin logic
│   │   ├── getMarketplacePlugins()
│   │   ├── installPlugin()
│   │   ├── uninstallPlugin()
│   │   ├── configurePlugin()
│   │   └── executePluginMethod()
│   └── README.md
│
├── controllers/
│   └── plugin.ctrl.ts           # HTTP handlers
│
├── routes/
│   └── plugin.route.ts          # API routes
│       ├── /marketplace         # List plugins
│       ├── /install             # Install plugin
│       ├── /installations/:id   # Manage installations
│       └── /:key/ui/dist/*      # Serve UI bundles
│
├── models/
│   └── pluginInstallation.model.ts
│
└── temp/plugins/                # Plugin sandbox
    └── {plugin-key}/
        ├── index.js             # Compiled plugin code
        └── ui/dist/             # UI bundle
```

### VerifyWise Frontend

```
Clients/src/
├── domain/
│   ├── types/plugins.ts         # TypeScript types
│   └── constants/pluginSlots.ts # Slot definitions
│
├── application/
│   ├── contexts/
│   │   └── PluginRegistry.context.tsx  # Plugin state
│   ├── hooks/
│   │   ├── usePlugins.ts              # Fetch plugins
│   │   ├── usePluginInstallation.ts   # Install/uninstall
│   │   └── useIsPluginInstalled.ts    # Check status
│   └── repository/
│       └── plugin.repository.ts        # API calls
│
└── presentation/
    ├── components/
    │   ├── PluginLoader/        # Loads UI bundles
    │   ├── PluginSlot/          # Renders plugin UIs
    │   ├── PluginCard/          # Marketplace card
    │   └── PluginGate/          # Conditional render
    └── pages/
        └── Plugins/
            ├── index.tsx        # Marketplace page
            └── PluginManagement/# Plugin detail page
```

---

## Data Flow

### Installation Flow

```
User clicks "Install"
        │
        ▼
┌─────────────────┐
│ Frontend        │
│ usePluginInstal │
│ lation.install()│
└────────┬────────┘
         │ POST /api/plugins/install
         ▼
┌─────────────────┐
│ Backend         │
│ PluginService   │
│ .installPlugin()│
└────────┬────────┘
         │
         ├──────────────────────────────┐
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│ Load plugin     │          │ Create DB       │
│ from marketplace│          │ record in       │
│ /temp/plugins/  │          │ plugin_         │
└────────┬────────┘          │ installations   │
         │                   └─────────────────┘
         ▼
┌─────────────────┐
│ Execute plugin  │
│ install()       │
│ method          │
└────────┬────────┘
         │ Creates tenant tables (if needed)
         ▼
┌─────────────────┐
│ Return success  │
│ to frontend     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend        │
│ refreshPlugins()│
│ loads UI bundle │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Plugin UI       │
│ appears in slots│
└─────────────────┘
```

### UI Loading Flow

```
App starts
    │
    ▼
┌─────────────────┐
│ PluginRegistry  │
│ Provider mounts │
└────────┬────────┘
         │ GET /api/plugins/installations
         ▼
┌─────────────────┐
│ Fetch installed │
│ plugins list    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PluginLoader    │
│ effect runs     │
└────────┬────────┘
         │ For each installed plugin:
         ▼
┌─────────────────┐
│ GET /api/plugins│
│ /marketplace    │
│ (for UI config) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ loadPluginUI()  │
│ for each plugin │
└────────┬────────┘
         │ GET /api/plugins/{key}/ui/dist/index.esm.js
         ▼
┌─────────────────┐
│ Inject <script> │
│ tag into DOM    │
└────────┬────────┘
         │ Script loads and executes IIFE
         ▼
┌─────────────────┐
│ window.PluginXyz│
│ = { Components }│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Register comps  │
│ to loadedComps  │
│ Map by slotId   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PluginSlot      │
│ components      │
│ re-render       │
└─────────────────┘
```

---

## Backend Architecture

### PluginService

The central service for all plugin operations:

```typescript
class PluginService {
  // Marketplace
  async getMarketplacePlugins(): Promise<Plugin[]>
  async getPluginByKey(key: string): Promise<Plugin>

  // Installation
  async installPlugin(userId, pluginKey, config): Promise<Installation>
  async uninstallPlugin(installationId): Promise<void>
  async getInstalledPlugins(tenantId): Promise<Installation[]>

  // Configuration
  async updateConfiguration(installationId, config): Promise<void>
  async testConnection(pluginKey, config): Promise<TestResult>

  // Plugin execution
  async executePluginMethod(key, method, ...args): Promise<any>
}
```

### Plugin Loading

Plugins are loaded dynamically from the marketplace:

```typescript
// 1. Fetch plugin code from marketplace (or local path)
const pluginPath = path.join(PLUGINS_DIR, plugin.pluginPath);

// 2. Transpile TypeScript if needed
const transpiledCode = transpileTypeScript(pluginCode);

// 3. Execute in sandbox
const pluginModule = executeInSandbox(transpiledCode, {
  sequelize,  // Database access
  fetch,      // HTTP client
  // ... other allowed modules
});

// 4. Cache for future use
pluginCache.set(pluginKey, pluginModule);
```

### API Routes

```
GET  /api/plugins/marketplace           # List all plugins
GET  /api/plugins/marketplace/:key      # Get single plugin
GET  /api/plugins/categories            # List categories
POST /api/plugins/install               # Install plugin
DELETE /api/plugins/installations/:id   # Uninstall plugin
GET  /api/plugins/installations         # List installed
PUT  /api/plugins/installations/:id/configuration  # Update config
POST /api/plugins/:key/test-connection  # Test connection
GET  /api/plugins/:key/ui/dist/:file    # Serve UI bundle
```

---

## Frontend Architecture

### PluginRegistryContext

Central state management for plugins:

```typescript
interface PluginRegistryContextType {
  // State
  installedPlugins: PluginInstallation[];
  isLoading: boolean;
  loadedComponents: Map<string, LoadedPluginComponent[]>;

  // Methods
  getComponentsForSlot(slotId: string): LoadedPluginComponent[];
  getPluginTabs(slotId: string): PluginTabConfig[];
  loadPluginUI(pluginKey: string, uiConfig: PluginUIConfig): Promise<void>;
  unloadPlugin(pluginKey: string): void;
  refreshPlugins(): Promise<void>;
  isPluginInstalled(pluginKey: string): boolean;
}
```

### PluginSlot Component

Renders plugin components at designated locations:

```typescript
interface PluginSlotProps {
  id: PluginSlotId;           // Which slot
  slotProps?: object;         // Props for components
  renderType?: PluginRenderType;  // Filter by type
  activeTab?: string;         // For tab slots
  pluginKey?: string;         // Filter by plugin
}
```

### Component Flow

```
<PluginRegistryProvider>
  │
  ├── <PluginLoader />           # Loads all UI bundles
  │
  └── <App>
        │
        ├── <RiskManagement>
        │     └── <PluginSlot id="page.risks.actions" />
        │
        ├── <ModelInventory>
        │     └── <PluginSlot id="page.models.tabs" />
        │
        └── <PluginManagement>
              └── <PluginSlot id="page.plugin.config" />
```

---

## Database Schema

### plugin_installations Table

```sql
CREATE TABLE plugin_installations (
  id SERIAL PRIMARY KEY,
  plugin_key VARCHAR(100) NOT NULL,
  user_id INTEGER NOT NULL,
  tenant_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'installed',
  configuration JSONB DEFAULT '{}',
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_plugin_per_tenant
    UNIQUE (plugin_key, tenant_id)
);
```

### Tenant-Scoped Plugin Tables

Plugins can create their own tables in the tenant schema:

```sql
-- Example: MLflow plugin creates this table
CREATE TABLE "{tenantId}".mlflow_model_records (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(255) NOT NULL,
  version VARCHAR(255) NOT NULL,
  -- ... other columns
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_model_version
    UNIQUE (model_name, version)
);
```

---

## Security Considerations

### Plugin Isolation

- Plugins run in a controlled context
- Only allowed modules are available (sequelize, fetch, etc.)
- No access to file system outside plugin directory
- No access to other plugins' data

### Database Security

- Tenant-scoped tables ensure data isolation
- Parameterized queries prevent SQL injection
- Plugin only accesses its own tables

### Configuration Security

- Sensitive config stored encrypted in database
- Secrets never logged or exposed in responses
- API keys validated server-side only

### UI Security

- Plugin UIs run in same context as main app
- No special permissions granted
- Same CORS and CSP policies apply
- API calls require authentication

### Best Practices

1. **Validate all inputs** in plugin code
2. **Use HTTPS** for external connections
3. **Don't store secrets** in code
4. **Sanitize data** before database operations
5. **Handle errors** gracefully without exposing internals
