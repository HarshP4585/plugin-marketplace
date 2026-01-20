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
│   ├── risk-import/         # Risk Import plugin
│   │   ├── index.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   └── ui/
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

## Available Plugin Slots

Plugins can inject UI at these locations:

| Slot ID | Location | Render Types |
|---------|----------|--------------|
| `page.risks.actions` | Risk Management "Insert From" menu | `menuitem`, `modal` |
| `page.models.tabs` | Model Inventory tabs | `tab` |
| `page.plugin.config` | Plugin configuration panel | `card`, `inline` |
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
| **Slack** | Communication | Real-time notifications via Slack |
| **MLflow** | ML Operations | ML model tracking and sync |
| **Risk Import** | Data Management | Bulk import risks from Excel |

## Contributing

1. Fork this repository
2. Create plugin in `plugins/` directory
3. Add entry to `plugins.json`
4. Submit pull request

See [Plugin Development Guide](docs/PLUGIN_DEVELOPMENT_GUIDE.md) for detailed instructions.

## License

MIT License - See LICENSE file for details.
