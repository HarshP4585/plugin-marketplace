# Plugin Development Guide

This guide covers how to develop, configure, and maintain plugins for VerifyWise.

## Table of Contents

1. [Plugin Structure](#plugin-structure)
2. [Plugin Types](#plugin-types)
3. [Adding a New Plugin](#adding-a-new-plugin)
4. [Framework Plugins](#framework-plugins)
5. [Plugin Icons](#plugin-icons)
6. [UI Components](#ui-components)
7. [Backend Integration](#backend-integration)

---

## Plugin Structure

All plugins are defined in `plugins.json` at the root of this repository. Each plugin entry contains:

```json
{
  "key": "unique-plugin-key",
  "name": "Plugin Name",
  "displayName": "Display Name",
  "description": "Short description (shown in cards)",
  "longDescription": "Detailed description (shown in plugin details page)",
  "version": "1.0.0",
  "author": "VerifyWise",
  "category": "compliance",
  "region": "United States",
  "iconUrl": "plugins/plugin-key/icon.svg",
  "documentationUrl": "https://docs.verifywise.com/plugins/plugin-key",
  "supportUrl": "https://support.verifywise.com",
  "isOfficial": true,
  "isPublished": true,
  "requiresConfiguration": false,
  "installationType": "tenant_scoped",
  "features": [...],
  "tags": [...],
  "pluginPath": "plugins/plugin-key",
  "entryPoint": "dist/index.js",
  "dependencies": {},
  "ui": {...}
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Unique identifier (lowercase, hyphenated) |
| `name` | string | Full plugin name |
| `displayName` | string | Name shown in UI |
| `description` | string | Brief description (max 150 chars) |
| `version` | string | Semantic version (e.g., "1.0.0") |
| `category` | string | Plugin category (see categories below) |
| `isOfficial` | boolean | Whether officially maintained by VerifyWise |
| `isPublished` | boolean | Whether visible in marketplace |
| `pluginPath` | string | Path to plugin directory |
| `entryPoint` | string | Main entry file |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `region` | string | Geographic region (for framework plugins) |
| `iconUrl` | string | Path to icon file |
| `longDescription` | string | Detailed description |
| `requiresConfiguration` | boolean | If plugin needs setup |
| `installationType` | string | "standard" or "tenant_scoped" |
| `features` | array | List of plugin features |
| `tags` | array | Searchable tags |
| `dependencies` | object | npm dependencies |
| `ui` | object | UI component configuration |

---

## Plugin Types

### Categories

| Category | Description |
|----------|-------------|
| `communication` | Team communication and notifications (Slack, Teams) |
| `ml_ops` | ML model management (MLflow, Azure AI) |
| `version_control` | Version control integrations |
| `monitoring` | System monitoring tools |
| `security` | Security scanning tools |
| `data_management` | Data import/export tools |
| `compliance` | Compliance frameworks |

### Installation Types

- **standard**: Available to all users
- **tenant_scoped**: Isolated per tenant/organization

---

## Adding a New Plugin

### 1. Create Plugin Directory

```bash
mkdir -p plugins/my-plugin/{dist,ui/dist}
```

### 2. Add Plugin Entry to plugins.json

```json
{
  "key": "my-plugin",
  "name": "My Plugin",
  "displayName": "My Plugin",
  "description": "Description of what the plugin does.",
  "version": "1.0.0",
  "author": "Your Name",
  "category": "data_management",
  "iconUrl": "plugins/my-plugin/icon.svg",
  "isOfficial": false,
  "isPublished": true,
  "requiresConfiguration": true,
  "installationType": "tenant_scoped",
  "features": [
    {
      "name": "Feature Name",
      "description": "What this feature does",
      "displayOrder": 1
    }
  ],
  "tags": ["tag1", "tag2"],
  "pluginPath": "plugins/my-plugin",
  "entryPoint": "dist/index.js",
  "dependencies": {},
  "ui": {
    "bundleUrl": "/api/plugins/my-plugin/ui/dist/index.esm.js",
    "globalName": "PluginMyPlugin",
    "slots": []
  }
}
```

### 3. Implement Backend Logic

Create `plugins/my-plugin/dist/index.js`:

```javascript
// Plugin lifecycle methods
export async function install(userId, tenantId, config, context) {
  // Called when plugin is installed
  return { success: true };
}

export async function uninstall(userId, tenantId, context) {
  // Called when plugin is uninstalled
  return { success: true };
}

export async function configure(userId, tenantId, config, context) {
  // Called when plugin configuration is updated
  return { success: true };
}

// Optional: Connection testing
export async function testConnection(config, context) {
  return { success: true, message: "Connection successful" };
}

// Plugin router for custom API endpoints
export const router = {
  "GET /status": async (context) => {
    return { data: { status: "ok" } };
  },
  "POST /action": async (context) => {
    const { body } = context;
    // Handle action
    return { data: { result: "done" } };
  }
};
```

### 4. Create Icon

See [Plugin Icons](#plugin-icons) section below.

---

## Framework Plugins

Framework plugins are compliance frameworks that appear in the dedicated "Frameworks" tab.

### Identifying Framework Plugins

Plugins are identified as frameworks if:
1. `category` is `"compliance"`, OR
2. `tags` include "compliance" or "framework"

### Region Field

Framework plugins should include a `region` field:

```json
{
  "key": "gdpr",
  "region": "European Union",
  ...
}
```

### Supported Regions

| Region | Flag | Examples |
|--------|------|----------|
| International | 🌐 | ISO 27001, CIS Controls, PCI-DSS |
| United States | 🇺🇸 | SOC 2, HIPAA, CCPA, NIST CSF |
| European Union | 🇪🇺 | GDPR, DORA |
| United Arab Emirates | 🇦🇪 | UAE PDPL, DIFC Regulation 10 |
| Saudi Arabia | 🇸🇦 | Saudi PDPL, SDAIA Guidelines |
| Qatar | 🇶🇦 | Qatar PDPL |
| Bahrain | 🇧🇭 | Bahrain PDPL, CBB AI Notice |
| Canada | 🇨🇦 | PIPEDA |
| United Kingdom | 🇬🇧 | UK GDPR |
| Australia | 🇦🇺 | Privacy Act |
| Singapore | 🇸🇬 | PDPA |
| India | 🇮🇳 | DPDP Act |
| Japan | 🇯🇵 | APPI |
| Brazil | 🇧🇷 | LGPD |

### Adding a New Region

1. Add the region to your plugin's `region` field in `plugins.json`
2. The frontend will automatically group plugins by region
3. To add a flag for a new region, update the `regionFlags` mapping in:
   `Clients/src/presentation/pages/Plugins/index.tsx`

```typescript
const regionFlags: Record<string, string> = {
  "International": "🌐",
  "United States": "🇺🇸",
  "European Union": "🇪🇺",
  "New Region": "🏳️",  // Add your region here
  // ...
};
```

### Framework Plugin UI Slots

Framework plugins typically use these slots:

| Slot ID | Purpose |
|---------|---------|
| `modal.framework.selection` | Framework selection in project setup |
| `page.controls.custom-framework` | Controls tab integration |
| `page.project-controls.custom-framework` | Project controls integration |
| `page.framework-dashboard.custom` | Dashboard statistics |
| `page.project-overview.custom-framework` | Overview page integration |
| `page.org-framework.management` | Organization framework management |
| `page.settings.tabs` | Settings page tab |

---

## Plugin Icons

### Guidelines

- **Format**: SVG (preferred) or PNG
- **Size**: 48x48 viewBox for SVG
- **Style**: Clean, professional, minimal
- **Colors**: Use a cohesive color palette

### Icon Template

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <!-- Background with rounded corners -->
  <rect width="48" height="48" rx="10" fill="#F0FDF4"/>

  <!-- Main icon shape with fill and stroke -->
  <path d="..." fill="#DCFCE7" stroke="#16A34A" stroke-width="2.5"/>

  <!-- Additional details -->
  <path d="..." stroke="#16A34A" stroke-width="2.5" stroke-linecap="round"/>
</svg>
```

### Color Palette Recommendations

| Category | Background | Fill | Stroke |
|----------|------------|------|--------|
| Security/Compliance | #F0FDF4 | #DCFCE7 | #16A34A |
| Privacy (EU) | #EFF6FF | #DBEAFE | #2563EB |
| Healthcare | #FEF2F2 | #FEE2E2 | #DC2626 |
| Financial | #FFF7ED | #FFEDD5 | #EA580C |
| Data | #ECFEFF | #CFFAFE | #0891B2 |

### File Location

Place icons at: `plugins/{plugin-key}/icon.svg`

Reference in plugins.json: `"iconUrl": "plugins/{plugin-key}/icon.svg"`

---

## UI Components

### Slot System

Plugins can inject UI components into predefined slots:

```json
"ui": {
  "bundleUrl": "/api/plugins/my-plugin/ui/dist/index.esm.js",
  "globalName": "PluginMyPlugin",
  "slots": [
    {
      "slotId": "page.plugin.config",
      "componentName": "MyPluginConfig",
      "renderType": "card"
    }
  ]
}
```

### Render Types

| Type | Description |
|------|-------------|
| `card` | Rendered as a card component |
| `tab` | Rendered as a tab in a tab panel |
| `modal` | Rendered in a modal dialog |
| `menuitem` | Rendered as a menu item |
| `raw` | Rendered directly without wrapper |

### Building UI Components

```bash
cd plugins/my-plugin/ui
npm install
npm run build
```

The build output should be at `plugins/my-plugin/ui/dist/index.esm.js`

---

## Backend Integration

### Plugin Route Context

When handling requests, plugins receive a context object:

```typescript
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
```

### Plugin Route Response

```typescript
interface PluginRouteResponse {
  status?: number;      // HTTP status (default 200)
  data?: any;           // JSON response
  buffer?: Buffer;      // Binary data (for file downloads)
  filename?: string;    // For Content-Disposition
  contentType?: string; // Custom content type
  headers?: Record<string, string>;
}
```

### Example Router

```javascript
export const router = {
  // GET /api/plugins/my-plugin/items
  "GET /items": async (context) => {
    const items = await fetchItems(context.tenantId);
    return { data: items };
  },

  // GET /api/plugins/my-plugin/items/:itemId
  "GET /items/:itemId": async (context) => {
    const { itemId } = context.params;
    const item = await fetchItem(itemId, context.tenantId);
    return { data: item };
  },

  // POST /api/plugins/my-plugin/items
  "POST /items": async (context) => {
    const item = await createItem(context.body, context.tenantId);
    return { status: 201, data: item };
  },

  // File download example
  "GET /export": async (context) => {
    const buffer = await generateExport(context.tenantId);
    return {
      buffer,
      filename: "export.xlsx",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    };
  }
};
```

---

## Caching

The backend caches downloaded plugins for 5 days. To force a refresh:

1. Delete the cached plugin: `rm -rf Servers/temp/plugins/{plugin-key}`
2. Restart the server

---

## Testing

### Local Development

1. Add your plugin to `plugins.json`
2. Build your plugin code
3. Copy to server cache: `cp -r plugins/my-plugin Servers/temp/plugins/`
4. Restart the server

### Verification

1. Check plugin appears in marketplace
2. Test installation flow
3. Verify UI components render correctly
4. Test all API endpoints
5. Test uninstallation
