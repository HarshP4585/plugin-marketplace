# Plugin Development Guide

This guide covers everything you need to know to develop plugins for VerifyWise.

## Table of Contents

1. [Overview](#overview)
2. [Plugin Types](#plugin-types)
3. [Getting Started](#getting-started)
4. [Backend Plugin Development](#backend-plugin-development)
5. [Frontend UI Development](#frontend-ui-development)
6. [Registry Configuration](#registry-configuration)
7. [Testing Your Plugin](#testing-your-plugin)
8. [Deployment](#deployment)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

VerifyWise plugins extend the platform's functionality through:

1. **Backend Logic** - Server-side code for integrations, data processing, APIs
2. **Frontend UI** - Dynamic React components injected into the app at runtime
3. **Configuration** - User-configurable settings stored in the database

### How Plugins Work

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PLUGIN SYSTEM FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. DISCOVERY                                                           │
│     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│     │ plugins.json │────►│ PluginService│────►│ Marketplace  │        │
│     │ (registry)   │     │ (backend)    │     │ Page (UI)    │        │
│     └──────────────┘     └──────────────┘     └──────────────┘        │
│                                                                         │
│  2. INSTALLATION                                                        │
│     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│     │ User clicks  │────►│ PluginService│────►│ plugin.      │        │
│     │ "Install"    │     │ .installPlugin│    │ install()    │        │
│     └──────────────┘     └──────────────┘     └──────────────┘        │
│                                   │                                     │
│                                   ▼                                     │
│                          ┌──────────────┐                              │
│                          │ Database     │                              │
│                          │ plugin_      │                              │
│                          │ installations│                              │
│                          └──────────────┘                              │
│                                                                         │
│  3. UI INJECTION (Dynamic, Runtime)                                     │
│     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│     │ PluginLoader │────►│ Load IIFE    │────►│ Register to  │        │
│     │ (on startup) │     │ bundle.js    │     │ PluginSlots  │        │
│     └──────────────┘     └──────────────┘     └──────────────┘        │
│                                                                         │
│  4. RUNTIME                                                             │
│     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│     │ PluginSlot   │────►│ Render plugin│────►│ Plugin calls │        │
│     │ components   │     │ components   │     │ backend APIs │        │
│     └──────────────┘     └──────────────┘     └──────────────┘        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Plugin Types

### 1. Standard Plugins
Simple integrations without persistent data storage.

**Example:** Slack plugin - sends notifications via webhooks, no local tables.

**Characteristics:**
- No database tables
- Configuration stored in `plugin_installations.configuration`
- Lightweight, stateless operations

### 2. Tenant-Scoped Plugins
Plugins that create database tables within the tenant's schema.

**Example:** MLflow plugin - creates `mlflow_model_records` table.

**Characteristics:**
- Creates tables in `{tenantId}.table_name` schema
- Data isolated per tenant
- Must clean up tables on uninstall

### 3. OAuth Plugins
Plugins requiring OAuth authentication with external services.

**Example:** Slack plugin with OAuth workspace connection.

**Characteristics:**
- Implements OAuth flow
- Stores tokens securely
- Handles token refresh

---

## Getting Started

### Prerequisites

- Node.js 18+
- TypeScript 5+
- npm or yarn
- Access to VerifyWise development environment

### Step 1: Create Plugin Directory

```bash
# Navigate to plugin-marketplace
cd plugin-marketplace

# Create plugin structure
mkdir -p plugins/my-plugin/ui/src
```

### Step 2: Create Required Files

```
plugins/my-plugin/
├── index.ts          # Backend plugin code (REQUIRED)
├── package.json      # Backend dependencies (REQUIRED)
├── README.md         # Documentation (REQUIRED)
├── tsconfig.json     # TypeScript config (OPTIONAL)
└── ui/               # Frontend UI (OPTIONAL)
    ├── src/
    │   ├── index.tsx        # Entry point - exports components
    │   ├── MyComponent.tsx  # Your components
    │   └── theme.ts         # Optional theming
    ├── package.json         # UI dependencies
    ├── vite.config.ts       # Build configuration
    └── tsconfig.json        # TypeScript config
```

---

## Backend Plugin Development

### Required Exports

Every plugin MUST export these functions:

```typescript
// plugins/my-plugin/index.ts

// ========== TYPE DEFINITIONS ==========

interface PluginContext {
  sequelize: any;  // Sequelize instance for database operations
}

interface InstallResult {
  success: boolean;
  message: string;
  installedAt: string;
}

interface UninstallResult {
  success: boolean;
  message: string;
  uninstalledAt: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
}

// ========== REQUIRED EXPORTS ==========

/**
 * Called when plugin is installed
 * Use this to create database tables, initialize resources
 */
export async function install(
  userId: number,
  tenantId: string,
  config: Record<string, any>,
  context: PluginContext
): Promise<InstallResult> {
  try {
    const { sequelize } = context;

    // Create your tables (for tenant-scoped plugins)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantId}".my_plugin_data (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return {
      success: true,
      message: "Plugin installed successfully",
      installedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Installation failed: ${error.message}`);
  }
}

/**
 * Called when plugin is uninstalled
 * Use this to clean up database tables, resources
 */
export async function uninstall(
  userId: number,
  tenantId: string,
  context: PluginContext
): Promise<UninstallResult> {
  try {
    const { sequelize } = context;

    // Drop your tables
    await sequelize.query(`
      DROP TABLE IF EXISTS "${tenantId}".my_plugin_data CASCADE
    `);

    return {
      success: true,
      message: "Plugin uninstalled successfully",
      uninstalledAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Uninstallation failed: ${error.message}`);
  }
}

/**
 * Validate configuration before saving
 * Return errors array with validation messages
 */
export function validateConfig(config: Record<string, any>): ValidationResult {
  const errors: string[] = [];

  if (!config) {
    errors.push("Configuration is required");
    return { valid: false, errors };
  }

  // Add your validation logic
  if (!config.api_url) {
    errors.push("API URL is required");
  }

  if (config.api_url && !config.api_url.startsWith("http")) {
    errors.push("API URL must start with http:// or https://");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Plugin metadata - displayed in marketplace
 */
export const metadata: PluginMetadata = {
  name: "My Plugin",
  version: "1.0.0",
  author: "Your Name",
  description: "A brief description of what your plugin does",
};
```

### Optional Exports

```typescript
/**
 * Configure plugin with new settings
 * Called when user saves configuration
 */
export async function configure(
  userId: number,
  tenantId: string,
  config: Record<string, any>,
  context: PluginContext
): Promise<{ success: boolean; message: string; configuredAt: string }> {
  // Validate first
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(", ")}`);
  }

  // Test connection if applicable
  const testResult = await testConnection(config);
  if (!testResult.success) {
    throw new Error(`Connection test failed: ${testResult.message}`);
  }

  return {
    success: true,
    message: "Configuration saved successfully",
    configuredAt: new Date().toISOString(),
  };
}

/**
 * Test connection to external service
 * Called from "Test Connection" button in UI
 */
export async function testConnection(
  config: Record<string, any>
): Promise<{ success: boolean; message: string; testedAt: string }> {
  try {
    // Test your external service
    const response = await fetch(config.api_url + "/health");

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    return {
      success: true,
      message: "Connection successful",
      testedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      testedAt: new Date().toISOString(),
    };
  }
}
```

### Package.json for Backend

```json
{
  "name": "@verifywise/plugin-my-plugin",
  "version": "1.0.0",
  "description": "My Plugin for VerifyWise",
  "main": "index.js",
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "axios": "^1.6.0"
  },
  "keywords": [
    "verifywise",
    "plugin"
  ]
}
```

### Database Operations

#### Creating Tables (Tenant-Scoped)

```typescript
// Always use tenantId schema for isolation
await sequelize.query(`
  CREATE TABLE IF NOT EXISTS "${tenantId}".my_table (
    id SERIAL PRIMARY KEY,
    -- your columns
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
```

#### Querying Data

```typescript
const results = await sequelize.query(
  `SELECT * FROM "${tenantId}".my_table WHERE status = :status`,
  {
    replacements: { status: "active" },
    type: sequelize.QueryTypes.SELECT,
  }
);
```

#### Inserting Data

```typescript
await sequelize.query(
  `INSERT INTO "${tenantId}".my_table (name, data) VALUES (:name, :data)`,
  {
    replacements: {
      name: "Example",
      data: JSON.stringify({ key: "value" }),
    },
  }
);
```

#### Upsert Pattern

```typescript
await sequelize.query(`
  INSERT INTO "${tenantId}".my_table (id, name, data)
  VALUES (:id, :name, :data)
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      data = EXCLUDED.data,
      updated_at = CURRENT_TIMESTAMP
`, {
  replacements: { id: 1, name: "Updated", data: JSON.stringify({}) }
});
```

---

## Frontend UI Development

See [Plugin UI Guide](PLUGIN_UI_GUIDE.md) for complete UI development documentation.

### Quick Overview

Plugin UIs are:
- **Separate from main app** - Not bundled with VerifyWise
- **Dynamically loaded** - Injected at runtime via `<script>` tags
- **IIFE format** - Exposes components on `window.PluginName`
- **Slot-based** - Render at predefined injection points

### Basic UI Structure

```
plugins/my-plugin/ui/
├── src/
│   ├── index.tsx           # Exports all components
│   ├── MyPluginConfig.tsx  # Configuration component
│   └── MyPluginTab.tsx     # Tab component
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Entry Point (index.tsx)

```tsx
// Export all components that will be injected
export { MyPluginConfig } from "./MyPluginConfig";
export { MyPluginTab } from "./MyPluginTab";
```

### Vite Configuration

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      formats: ["iife"],
      name: "PluginMyPlugin",  // Global variable name
      fileName: () => "index.esm.js",
    },
    rollupOptions: {
      // Don't bundle React/MUI - use host app's versions
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@mui/material",
        "@emotion/react",
        "@emotion/styled",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
          "@mui/material": "MUI",
          "@emotion/react": "emotionReact",
          "@emotion/styled": "emotionStyled",
        },
      },
    },
    outDir: "dist",
  },
});
```

### Build UI

```bash
cd plugins/my-plugin/ui
npm install
npm run build
# Output: dist/index.esm.js
```

---

## Registry Configuration

Add your plugin to `plugins.json`:

```json
{
  "key": "my-plugin",
  "name": "My Plugin",
  "displayName": "My Plugin",
  "description": "Short description shown in marketplace card",
  "longDescription": "Detailed description shown on plugin detail page. Explain what the plugin does, its benefits, and how to use it.",
  "version": "1.0.0",
  "author": "Your Name",
  "category": "data_management",
  "iconUrl": "/assets/my_plugin_logo.svg",
  "documentationUrl": "https://docs.example.com/my-plugin",
  "supportUrl": "https://support.example.com",
  "isOfficial": false,
  "isPublished": true,
  "requiresConfiguration": true,
  "installationType": "tenant_scoped",
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
  "tags": ["keyword1", "keyword2", "keyword3"],
  "pluginPath": "plugins/my-plugin",
  "entryPoint": "index.ts",
  "dependencies": {
    "axios": "^1.6.0"
  },
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
          "label": "My Plugin Data",
          "icon": "Database"
        }
      }
    ]
  }
}
```

### Registry Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | Unique identifier (lowercase, hyphens) |
| `name` | string | Yes | Display name |
| `displayName` | string | Yes | Name shown in UI |
| `description` | string | Yes | Short description (1-2 sentences) |
| `longDescription` | string | No | Detailed description |
| `version` | string | Yes | Semantic version (e.g., "1.0.0") |
| `author` | string | Yes | Author name or organization |
| `category` | string | Yes | Category ID from categories list |
| `iconUrl` | string | No | Path to icon SVG |
| `documentationUrl` | string | No | Link to documentation |
| `supportUrl` | string | No | Link to support |
| `isOfficial` | boolean | No | Official VerifyWise plugin |
| `isPublished` | boolean | Yes | Visible in marketplace |
| `requiresConfiguration` | boolean | Yes | Shows config panel |
| `installationType` | string | Yes | `standard` or `tenant_scoped` |
| `features` | array | No | Feature list for detail page |
| `tags` | array | No | Search keywords |
| `pluginPath` | string | Yes | Path to plugin directory |
| `entryPoint` | string | Yes | Main file (index.ts) |
| `dependencies` | object | No | npm dependencies |
| `ui` | object | No | UI configuration |

### UI Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bundleUrl` | string | Yes | URL to IIFE bundle |
| `globalName` | string | No | Global variable name (default: Plugin + PascalCase key) |
| `slots` | array | Yes | Slot configurations |

### Slot Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slotId` | string | Yes | Target slot ID |
| `componentName` | string | Yes | Exported component name |
| `renderType` | string | Yes | `menuitem`, `modal`, `tab`, `card`, `button`, `widget`, `raw` |
| `props` | object | No | Default props for component |
| `trigger` | string | No | For modals - triggering component name |

---

## Testing Your Plugin

### 1. Local Development Setup

```bash
# Clone both repositories
git clone <verifywise-repo>
git clone <plugin-marketplace-repo>

# Link plugin-marketplace to verifywise
# In verifywise/Servers/.env:
PLUGIN_MARKETPLACE_PATH=/path/to/plugin-marketplace
```

### 2. Test Installation

1. Start VerifyWise development server
2. Navigate to Integrations page
3. Find your plugin in marketplace
4. Click "Install"
5. Check console for errors

### 3. Test Configuration

1. Go to plugin management page
2. Enter configuration values
3. Click "Test Connection" (if applicable)
4. Click "Save Configuration"
5. Verify configuration is saved

### 4. Test Uninstallation

1. Go to plugin management page
2. Click "Uninstall"
3. Confirm uninstallation
4. Verify tables are dropped (for tenant-scoped)
5. Verify UI is removed immediately

### 5. Test Re-installation

1. Install plugin again
2. Verify UI appears without page refresh
3. Verify data tables are recreated

### Testing Checklist

```
□ Plugin appears in marketplace
□ Plugin card shows correct info
□ Install completes without errors
□ Tables created (tenant-scoped)
□ UI appears after install (no refresh)
□ Configuration form renders
□ Validation errors show correctly
□ Test Connection works
□ Save Configuration works
□ Plugin functionality works
□ Uninstall completes without errors
□ Tables dropped (tenant-scoped)
□ UI removed after uninstall (no refresh)
□ Re-install works correctly
□ No console errors
```

---

## Deployment

### 1. Build Plugin

```bash
# Build UI bundle
cd plugins/my-plugin/ui
npm run build

# Verify build output
ls -la dist/
# Should contain index.esm.js
```

### 2. Commit to Repository

```bash
git add plugins/my-plugin/
git add plugins.json
git commit -m "Add my-plugin integration"
git push origin main
```

### 3. Production Configuration

```bash
# In VerifyWise production environment:
PLUGIN_MARKETPLACE_URL=https://raw.githubusercontent.com/org/plugin-marketplace/main/plugins.json
```

### 4. Verify Deployment

1. Check plugin appears in production marketplace
2. Test install/uninstall cycle
3. Verify UI loads correctly

---

## Best Practices

### Backend

1. **Always validate configuration** before using it
2. **Use parameterized queries** to prevent SQL injection
3. **Handle errors gracefully** with meaningful messages
4. **Clean up completely** on uninstall
5. **Use transactions** for multi-step operations
6. **Log important events** for debugging

### Frontend UI

1. **Use MUI components** for consistent styling
2. **Don't bundle React/MUI** - use external
3. **Handle loading states** with spinners
4. **Show error messages** clearly
5. **Match app styling** using same color tokens
6. **Keep bundles small** - only include what's needed

### Configuration

1. **Provide sensible defaults** where possible
2. **Validate on both client and server**
3. **Use clear field labels and placeholders**
4. **Group related fields together**
5. **Show/hide fields based on other selections**

### Security

1. **Never store secrets in code** - use configuration
2. **Validate all user input**
3. **Use HTTPS for external connections**
4. **Sanitize data before database operations**
5. **Don't expose sensitive config in UI**

---

## Troubleshooting

### Plugin Not Appearing in Marketplace

- Check `isPublished: true` in plugins.json
- Verify plugins.json is valid JSON
- Check VerifyWise can access plugin-marketplace

### Installation Fails

- Check install() function for errors
- Verify database connection
- Check for duplicate table names
- Look at server logs

### UI Not Loading

- Check bundle builds without errors
- Verify bundleUrl in plugins.json
- Check browser console for script errors
- Verify globalName matches vite.config.ts

### UI Not Appearing After Install

- Check PluginLoader is in app
- Verify slot configuration in plugins.json
- Check componentName matches export

### UI Persists After Uninstall

- Verify unloadPlugin() is called
- Check PluginRegistry context

### Configuration Not Saving

- Check validateConfig() returns valid: true
- Verify configure() doesn't throw
- Check server logs for errors

### Test Connection Fails

- Verify external service is accessible
- Check authentication credentials
- Look for CORS issues
- Check network/firewall

---

## Example: Complete Plugin

See these existing plugins for reference:

- **MLflow** (`plugins/mlflow/`) - Tenant-scoped with tabs, configuration
- **Risk Import** (`plugins/risk-import/`) - Menu items and modals
- **Slack** (`plugins/slack/`) - OAuth-based with webhooks

Each demonstrates different patterns and can be used as templates for your plugin.
