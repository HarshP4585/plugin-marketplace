# VerifyWise Plugin Marketplace

This repository contains the plugin marketplace for VerifyWise, including plugin registry, implementations, and documentation for building new plugins.

## Quick Links

| Document | Description |
|----------|-------------|
| [Plugin Development Guide](docs/PLUGIN_DEVELOPMENT_GUIDE.md) | Complete guide to building plugins |
| [Plugin UI Guide](docs/PLUGIN_UI_GUIDE.md) | Building dynamic plugin UIs |
| [Architecture Overview](docs/ARCHITECTURE.md) | System architecture and data flow |
| [API Reference](docs/API_REFERENCE.md) | Plugin interface specifications |

## Repository Structure

```
plugin-marketplace/
├── plugins.json              # Plugin registry (marketplace manifest)
├── plugins/                  # Plugin implementations
│   ├── mlflow/              # MLflow integration plugin
│   │   ├── index.ts         # Backend plugin code
│   │   ├── package.json     # Backend dependencies
│   │   ├── README.md        # Plugin documentation
│   │   └── ui/              # Frontend UI components
│   │       ├── src/         # React components
│   │       ├── vite.config.ts
│   │       └── package.json
│   ├── azure-ai-foundry/    # Azure AI Foundry plugin
│   │   ├── index.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   └── ui/
│   ├── risk-import/         # Risk Import plugin
│   │   ├── index.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   └── ui/
│   ├── custom-framework-import/  # Custom Framework Import plugin
│   │   ├── index.ts         # Backend with database tables
│   │   ├── package.json
│   │   ├── README.md        # Comprehensive documentation
│   │   └── ui/              # Full UI with multiple components
│   └── slack/               # Slack integration plugin
│       ├── index.ts
│       ├── package.json
│       ├── README.md
│       └── ui/
├── docs/                    # Documentation
│   ├── PLUGIN_DEVELOPMENT_GUIDE.md
│   ├── PLUGIN_UI_GUIDE.md
│   ├── ARCHITECTURE.md
│   └── API_REFERENCE.md
└── README.md               # This file
```

## Quick Start: Creating a New Plugin

### 1. Create Plugin Directory

```bash
mkdir -p plugins/my-plugin/ui/src
```

### 2. Create Backend Plugin (`plugins/my-plugin/index.ts`)

```typescript
// Types for plugin routing
interface PluginRouteContext {
  tenantId: string;
  userId: number;
  organizationId: number;
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, any>;
  body: any;
  sequelize: any;
  configuration: Record<string, any>;
}

interface PluginRouteResponse {
  status?: number;
  data?: any;
  buffer?: any;      // For binary data (files)
  filename?: string;
  contentType?: string;
  headers?: Record<string, string>;
}

// Required exports
export async function install(userId: number, tenantId: string, config: any, context: any) {
  // Create tables, initialize resources
  return { success: true, message: "Installed", installedAt: new Date().toISOString() };
}

export async function uninstall(userId: number, tenantId: string, context: any) {
  // Clean up tables, resources
  return { success: true, message: "Uninstalled", uninstalledAt: new Date().toISOString() };
}

export function validateConfig(config: any) {
  // Validate configuration
  return { valid: true, errors: [] };
}

export const metadata = {
  name: "My Plugin",
  version: "1.0.0",
  author: "Your Name",
  description: "Plugin description"
};

// Plugin Router - Define custom API endpoints
export const router: Record<string, (ctx: PluginRouteContext) => Promise<PluginRouteResponse>> = {
  "GET /items": async (ctx) => {
    // Handle GET /api/plugins/my-plugin/items
    return { data: { items: [] } };
  },
  "POST /items": async (ctx) => {
    // Handle POST /api/plugins/my-plugin/items
    return { status: 201, data: { created: true } };
  },
  "GET /items/:itemId": async (ctx) => {
    // ctx.params.itemId contains the URL parameter
    return { data: { id: ctx.params.itemId } };
  },
};
```

### 3. Add to Registry (`plugins.json`)

```json
{
  "key": "my-plugin",
  "name": "My Plugin",
  "displayName": "My Plugin",
  "description": "Short description",
  "version": "1.0.0",
  "category": "data_management",
  "pluginPath": "plugins/my-plugin",
  "entryPoint": "index.ts",
  "requiresConfiguration": true,
  "ui": {
    "bundleUrl": "/api/plugins/my-plugin/ui/dist/index.esm.js",
    "globalName": "PluginMyPlugin",
    "slots": [...]
  }
}
```

### 4. Build UI (if applicable)

```bash
cd plugins/my-plugin/ui
npm install
npm run build
```

See [Plugin Development Guide](docs/PLUGIN_DEVELOPMENT_GUIDE.md) for complete instructions.

## Plugin Types

| Type | Description | Example |
|------|-------------|---------|
| **Standard** | Simple plugins without database tables | Slack |
| **Tenant-Scoped** | Plugins with per-tenant database tables | MLflow, Risk Import |
| **OAuth** | Plugins requiring OAuth authentication | Slack |

## Plugin Router System

Plugins can define custom API endpoints via the `router` export. All requests to `/api/plugins/:pluginKey/*` are automatically forwarded to the plugin's router.

### Route Pattern Format

Routes are defined as `"METHOD /path"` keys:

```typescript
export const router = {
  "GET /models": handleGetModels,           // GET /api/plugins/my-plugin/models
  "POST /sync": handleSync,                 // POST /api/plugins/my-plugin/sync
  "GET /models/:modelId": handleGetModel,   // GET /api/plugins/my-plugin/models/123
  "DELETE /items/:id": handleDelete,        // DELETE /api/plugins/my-plugin/items/456
};
```

### Route Context

Each handler receives a `PluginRouteContext` with:

| Property | Type | Description |
|----------|------|-------------|
| `tenantId` | string | Current tenant identifier |
| `userId` | number | Authenticated user ID |
| `organizationId` | number | User's organization ID |
| `method` | string | HTTP method (GET, POST, etc.) |
| `path` | string | Request path after plugin key |
| `params` | object | URL parameters (e.g., `:modelId`) |
| `query` | object | Query string parameters |
| `body` | any | Request body (for POST/PUT/PATCH) |
| `sequelize` | any | Database connection |
| `configuration` | object | Plugin's stored configuration |

### Response Types

Handlers return a `PluginRouteResponse`:

```typescript
// JSON response
return { data: { items: [...] } };

// Custom status code
return { status: 201, data: { created: true } };

// File download
return {
  buffer: fileBuffer,
  filename: "export.xlsx",
  contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

// Custom headers
return { data: {...}, headers: { "X-Custom": "value" } };
```

## Available Plugin Slots

Plugins can inject UI at these locations:

| Slot ID | Location | Render Types |
|---------|----------|--------------|
| `page.risks.actions` | Risk Management "Insert From" menu | `menuitem`, `modal` |
| `page.models.tabs` | Model Inventory tabs | `tab` |
| `page.plugin.config` | Plugin configuration panel | `card`, `inline` |
| `page.settings.tabs` | Settings page tabs | `tab` |
| `modal.framework.selection` | Add Framework modal | `card` |
| `page.framework-dashboard.custom` | Organizational Framework Dashboard | `card` |
| `page.controls.custom-framework` | Organizational Controls tab | `card` |
| `page.project-controls.custom-framework` | Project Controls tab | `card` |
| `page.dashboard.widgets` | Dashboard (future) | `widget` |
| `layout.sidebar.items` | Sidebar (future) | `menuitem` |

## Development vs Production

### Development (Local)
VerifyWise reads from local `plugins.json` and `plugins/` directory.

### Production (Git Repository)
VerifyWise fetches from remote Git repository:

```bash
PLUGIN_MARKETPLACE_URL=https://raw.githubusercontent.com/org/plugin-marketplace/main/plugins.json
```

## Current Plugins

| Plugin | Category | Description |
|--------|----------|-------------|
| **Custom Framework Import** | Compliance | Import and manage custom compliance frameworks |
| **Slack** | Communication | Real-time notifications via Slack |
| **MLflow** | ML Operations | ML model tracking and sync |
| **Azure AI Foundry** | ML Operations | Azure ML model tracking and sync |
| **Risk Import** | Data Management | Bulk import risks from Excel |

## Event-Based Plugin Communication

Plugins can communicate with the main app using custom DOM events for decoupled integration:

```typescript
// Plugin emits event
window.dispatchEvent(
  new CustomEvent("myPluginEvent", {
    detail: { projectId: 123, data: {...} }
  })
);

// App listens (in React component)
useEffect(() => {
  const handler = (event: CustomEvent) => {
    if (event.detail?.projectId === project.id) {
      // Handle event
    }
  };
  window.addEventListener("myPluginEvent", handler);
  return () => window.removeEventListener("myPluginEvent", handler);
}, [project.id]);
```

### Event Naming Convention

- Use camelCase: `customFrameworkCountChanged`
- Include context: `projectId`, `userId`, etc.
- Be descriptive: `Changed`, `Added`, `Removed`

See [Custom Framework Import README](plugins/custom-framework-import/README.md) for a complete example.

## Contributing

1. Fork this repository
2. Create plugin in `plugins/` directory
3. Add entry to `plugins.json`
4. Submit pull request

See [Plugin Development Guide](docs/PLUGIN_DEVELOPMENT_GUIDE.md) for detailed instructions.

## License

MIT License - See LICENSE file for details.
