# Framework Plugins Guide

This guide covers the compliance framework plugin system in VerifyWise.

## Table of Contents

1. [Overview](#overview)
2. [Framework Types](#framework-types)
3. [Available Frameworks](#available-frameworks)
4. [Framework Plugin Architecture](#framework-plugin-architecture)
5. [Adding a New Framework](#adding-a-new-framework)
6. [Region System](#region-system)
7. [UI Integration](#ui-integration)
8. [Custom Framework Import Package](#custom-framework-import-package)

---

## Overview

Framework plugins provide compliance frameworks that can be added to projects. They appear in:

1. **Plugins Page > Frameworks Tab**: Grouped by geographic region
2. **Project Setup**: Framework selection when creating projects
3. **Controls Tab**: Framework-specific controls and requirements
4. **Dashboard**: Compliance progress tracking

---

## Available Frameworks

### International 🌐

| Framework | Key | Description |
|-----------|-----|-------------|
| ISO 27001 | `iso27001` | Information security management systems |
| PCI-DSS | `pci-dss` | Payment card data security |
| CIS Controls v8 | `cis-controls` | Critical security controls |
| AI Ethics | `ai-ethics` | Responsible AI governance |
| Data Governance | `data-governance` | Enterprise data management |

### United States 🇺🇸

| Framework | Key | Description |
|-----------|-----|-------------|
| SOC 2 Type II | `soc2` | Trust Service Criteria |
| HIPAA | `hipaa` | Healthcare data protection |
| CCPA | `ccpa` | California consumer privacy |
| NIST CSF | `nist-csf` | Cybersecurity framework |

### European Union 🇪🇺

| Framework | Key | Description |
|-----------|-----|-------------|
| GDPR | `gdpr` | General Data Protection Regulation |
| DORA | `dora` | Digital Operational Resilience Act |

### United Arab Emirates 🇦🇪

| Framework | Key | Description |
|-----------|-----|-------------|
| UAE PDPL | `uae-pdpl` | Personal Data Protection Law 45/2021, DIFC Regulation 10, AI Ethics Charter |

### Saudi Arabia 🇸🇦

| Framework | Key | Description |
|-----------|-----|-------------|
| Saudi PDPL | `saudi-pdpl` | Personal Data Protection Law, SDAIA Ethics Principles, Generative AI Guidelines |

### Qatar 🇶🇦

| Framework | Key | Description |
|-----------|-----|-------------|
| Qatar PDPL | `qatar-pdpl` | Personal Data Privacy Law 13/2016, National AI Policy |

### Bahrain 🇧🇭

| Framework | Key | Description |
|-----------|-----|-------------|
| Bahrain PDPL | `bahrain-pdpl` | Personal Data Protection Law 30/2018, CBB AI Notice, EDB AI Ethics Pledge |

---

## Framework Plugin Architecture

### Directory Structure

```
plugins/
└── {framework-key}/
    ├── template.json         # REQUIRED: Framework structure (controls, requirements)
    ├── icon.svg              # Framework icon
    ├── index.ts              # Auto-generated from template.json
    ├── dist/
    │   └── index.js          # Built backend (auto-generated)
    └── ui/
        └── dist/             # Symlink to shared custom-framework-import UI
            └── index.esm.js
```

> **CRITICAL**: The `template.json` file is **REQUIRED** for framework plugins. Without it:
> - The plugin will install successfully
> - But NO framework will appear in Settings > Custom Frameworks
> - Users will see the plugin as "installed" but it won't do anything
>
> The `template.json` contains the actual framework structure (chapters, controls, articles, evidence examples, etc.) that gets imported into the database when the plugin is installed.

### plugins.json Entry

```json
{
  "key": "soc2",
  "name": "SOC 2 Type II",
  "displayName": "SOC 2 Type II",
  "description": "SOC 2 Type II compliance framework based on Trust Service Criteria.",
  "region": "United States",
  "longDescription": "SOC 2 Type II framework plugin provides comprehensive Trust Service Criteria (TSC) compliance management...",
  "version": "1.0.0",
  "author": "VerifyWise",
  "category": "compliance",
  "iconUrl": "plugins/soc2/icon.svg",
  "isOfficial": true,
  "isPublished": true,
  "requiresConfiguration": false,
  "installationType": "tenant_scoped",
  "features": [
    {
      "name": "Trust Service Criteria",
      "description": "Complete TSC coverage: Security, Availability, Processing Integrity, Confidentiality, Privacy",
      "displayOrder": 1
    },
    {
      "name": "Auto-Import",
      "description": "Framework automatically imported on plugin installation",
      "displayOrder": 2
    }
  ],
  "tags": ["soc2", "audit", "trust-services", "compliance", "security"],
  "pluginPath": "plugins/soc2",
  "entryPoint": "dist/index.js",
  "dependencies": {},
  "ui": {
    "bundleUrl": "/api/plugins/soc2/ui/dist/index.esm.js",
    "globalName": "PluginCustomFrameworkImport",
    "slots": [
      {
        "slotId": "modal.framework.selection",
        "componentName": "CustomFrameworkCards",
        "renderType": "raw",
        "props": { "pluginKey": "soc2" }
      },
      {
        "slotId": "page.controls.custom-framework",
        "componentName": "CustomFrameworkControls",
        "renderType": "raw",
        "props": { "pluginKey": "soc2" }
      },
      {
        "slotId": "page.framework-dashboard.custom",
        "componentName": "CustomFrameworkDashboard",
        "renderType": "raw",
        "props": { "pluginKey": "soc2" }
      },
      {
        "slotId": "page.project-overview.custom-framework",
        "componentName": "CustomFrameworkOverview",
        "renderType": "raw",
        "props": { "pluginKey": "soc2" }
      }
    ]
  }
}
```

---

## Adding a New Framework

### Step 1: Create Plugin Directory

```bash
mkdir -p plugins/my-framework/{dist,ui/dist}
```

### Step 2: Create template.json (REQUIRED)

This is the **most important file**. It defines the actual framework structure that gets imported into the database.

Create `plugins/my-framework/template.json`:

```json
{
  "id": "my-framework",
  "name": "My Framework Name",
  "description": "Brief description of the framework.",
  "category": "Compliance",
  "tags": ["compliance", "framework"],
  "framework": {
    "name": "My Framework Name",
    "description": "Detailed description for the framework",
    "version": "1.0.0",
    "is_organizational": true,
    "hierarchy": {
      "type": "two_level",
      "level1_name": "Category",
      "level2_name": "Control"
    },
    "structure": [
      {
        "title": "Category 1: Example Category",
        "description": "Description of this category",
        "order_no": 1,
        "items": [
          {
            "title": "Control 1.1 - Example Control",
            "description": "What this control requires",
            "order_no": 1,
            "summary": "Brief summary of the control",
            "questions": [
              "Is requirement X met?",
              "Is requirement Y documented?"
            ],
            "evidence_examples": [
              "Policy document",
              "Audit logs",
              "Training records"
            ]
          }
        ]
      }
    ]
  }
}
```

**Template Structure:**
- `hierarchy.type`: Use `"two_level"` for Category → Control, or `"three_level"` for Category → Subcategory → Control
- `hierarchy.level1_name`, `level2_name`, `level3_name`: Labels shown in the UI (e.g., "Chapter", "Article", "Requirement")
- `is_organizational`: `true` for org-level frameworks, `false` for project-specific
- `structure`: Array of level 1 items, each containing `items` array for level 2

### Step 3: Add to plugins.json

```json
{
  "key": "my-framework",
  "name": "My Framework",
  "displayName": "My Framework",
  "description": "Brief description of the framework.",
  "region": "International",
  "version": "1.0.0",
  "author": "VerifyWise",
  "category": "compliance",
  "iconUrl": "plugins/my-framework/icon.svg",
  "isOfficial": true,
  "isPublished": true,
  "requiresConfiguration": false,
  "installationType": "tenant_scoped",
  "features": [
    {
      "name": "Key Feature",
      "description": "What this framework provides",
      "displayOrder": 1
    }
  ],
  "tags": ["compliance", "framework", "my-framework"],
  "pluginPath": "plugins/my-framework",
  "entryPoint": "dist/index.js",
  "dependencies": {},
  "ui": {
    "bundleUrl": "/api/plugins/my-framework/ui/dist/index.esm.js",
    "globalName": "PluginCustomFrameworkImport",
    "slots": [
      {
        "slotId": "modal.framework.selection",
        "componentName": "CustomFrameworkCards",
        "renderType": "raw",
        "props": { "pluginKey": "my-framework" }
      },
      {
        "slotId": "page.controls.custom-framework",
        "componentName": "CustomFrameworkControls",
        "renderType": "raw",
        "props": { "pluginKey": "my-framework" }
      },
      {
        "slotId": "page.framework-dashboard.custom",
        "componentName": "CustomFrameworkDashboard",
        "renderType": "raw",
        "props": { "pluginKey": "my-framework" }
      },
      {
        "slotId": "page.project-overview.custom-framework",
        "componentName": "CustomFrameworkOverview",
        "renderType": "raw",
        "props": { "pluginKey": "my-framework" }
      }
    ]
  }
}
```

### Step 4: Create Framework Icon

Create `plugins/my-framework/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <rect width="48" height="48" rx="10" fill="#F0FDF4"/>
  <path d="M24 8L38 15V24C38 32.28 32.11 39.95 24 42C15.89 39.95 10 32.28 10 24V15L24 8Z"
        fill="#DCFCE7" stroke="#16A34A" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M17 25L22 30L31 21" stroke="#16A34A" stroke-width="3"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### Step 5: Build the Plugin (REQUIRED)

The build script automatically:
1. Reads your `template.json`
2. Generates `index.ts` from it
3. Compiles to `dist/index.js`
4. Creates symlink to shared UI

```bash
# Build a specific framework plugin
npm run build:framework-plugins -- my-framework

# Or build all framework plugins
npm run build:framework-plugins
```

**Without this step, the plugin will not work.** The `dist/index.js` contains the logic that imports the framework template into the database on installation.

### Step 6: Deploy to Server

Copy the built plugin to the VerifyWise server cache:

```bash
cp -r plugins/my-framework /path/to/verifywise/Servers/temp/plugins/
```

### Step 7: Install the Plugin

1. Go to **Plugins > Frameworks** tab
2. Find your framework and click **Install**
3. The framework template will auto-import to the database
4. Verify in **Settings > Custom Frameworks** that the framework appears

### Checklist

Before considering a framework plugin complete, verify:

- [ ] `template.json` exists with valid framework structure
- [ ] `icon.svg` exists
- [ ] Plugin entry added to `plugins.json` with `category: "compliance"`
- [ ] Plugin built with `npm run build:framework-plugins`
- [ ] `dist/index.js` exists (created by build)
- [ ] Plugin copied to server cache
- [ ] Plugin installed successfully
- [ ] **Framework appears in Settings > Custom Frameworks** (this is the real test!)

---

## Shared UI Components

Framework plugins use the shared `custom-framework-ui` package:

```bash
cd packages/custom-framework-ui
npm install
npm run build
```

Copy the built UI to your plugin:

```bash
cp -r packages/custom-framework-ui/dist/* plugins/my-framework/ui/dist/
```

---

## Region System

### How Regions Work

1. Each framework plugin has a `region` field in plugins.json
2. The frontend reads this field and groups frameworks
3. Flags are mapped in the frontend code

### Supported Regions

```typescript
const regionFlags: Record<string, string> = {
  "International": "🌐",
  "United States": "🇺🇸",
  "European Union": "🇪🇺",
  "Canada": "🇨🇦",
  "United Kingdom": "🇬🇧",
  "Australia": "🇦🇺",
  "Singapore": "🇸🇬",
  "India": "🇮🇳",
  "Japan": "🇯🇵",
  "Brazil": "🇧🇷",
  "United Arab Emirates": "🇦🇪",
  "Saudi Arabia": "🇸🇦",
  "Qatar": "🇶🇦",
  "Bahrain": "🇧🇭",
  "Other": "📋",
};
```

### Adding a New Region

1. **In plugins.json**: Set the `region` field to your new region name

```json
{
  "key": "lgpd",
  "region": "Brazil",
  ...
}
```

2. **In the frontend** (optional): Add flag mapping if not already present

File: `Clients/src/presentation/pages/Plugins/index.tsx`

```typescript
const regionFlags: Record<string, string> = {
  // ... existing regions
  "Brazil": "🇧🇷",
};
```

### Region Display Order

Regions are sorted alphabetically with these exceptions:
- "International" always appears first
- "Other" always appears last

---

## UI Integration

### Available Slots

| Slot ID | Location | Purpose |
|---------|----------|---------|
| `modal.framework.selection` | Project setup modal | Framework selection cards |
| `page.controls.custom-framework` | Org Controls page | Framework toggle + content |
| `page.project-controls.custom-framework` | Project Controls page | Framework toggle + content |
| `page.framework-dashboard.custom` | Framework Dashboard | Statistics cards |
| `page.project-overview.custom-framework` | Project Overview | Completion progress |
| `page.org-framework.management` | Framework Settings | Add/remove frameworks |
| `page.settings.tabs` | Settings page | Configuration tab |

### UI Components

The `custom-framework-ui` package provides:

| Component | Purpose |
|-----------|---------|
| `CustomFrameworkCards` | Framework selection cards |
| `CustomFrameworkControls` | Controls tab with framework toggle |
| `CustomFrameworkDashboard` | Dashboard statistics |
| `CustomFrameworkOverview` | Overview progress cards |
| `CustomFrameworkViewer` | Control details viewer |
| `CustomFrameworkConfig` | Settings configuration |

### Component Props

All components receive:

```typescript
interface CustomFrameworkProps {
  project?: Project;           // Current project context
  apiServices?: ApiServices;   // API service methods
  pluginKey: string;           // Plugin identifier
}
```

---

## Custom Framework Import Package

### Location

`packages/custom-framework-ui/`

### Building

```bash
cd packages/custom-framework-ui
npm install
npm run build
```

### Output

- `dist/index.esm.js` - ES module bundle
- `dist/index.d.ts` - TypeScript definitions

### Using in Framework Plugins

Framework plugins reference the shared UI:

```json
"ui": {
  "bundleUrl": "/api/plugins/{plugin-key}/ui/dist/index.esm.js",
  "globalName": "PluginCustomFrameworkImport",
  "slots": [...]
}
```

All framework plugins use the same `globalName` because they share the UI components.

---

## Event System

Framework components communicate via DOM events:

### Events Dispatched

```typescript
// When a framework is added/removed
window.dispatchEvent(new CustomEvent("customFrameworkChanged", {
  detail: { projectId: number }
}));

// When framework count changes (for system framework button logic)
window.dispatchEvent(new CustomEvent("customFrameworkCountChanged", {
  detail: { projectId: number, count: number }
}));
```

### Listening to Events

```typescript
useEffect(() => {
  const handleChange = (event: CustomEvent) => {
    if (event.detail?.projectId === currentProjectId) {
      refetchData();
    }
  };

  window.addEventListener("customFrameworkChanged", handleChange);
  return () => window.removeEventListener("customFrameworkChanged", handleChange);
}, [currentProjectId]);
```

---

## Database Schema

Framework plugins use these tables:

| Table | Purpose |
|-------|---------|
| `custom_frameworks` | Framework definitions |
| `custom_framework_controls` | Controls/requirements |
| `custom_framework_control_status` | Completion tracking |
| `custom_framework_evidence` | Evidence attachments |

See the main VerifyWise documentation for full schema details.

---

## Troubleshooting

### Framework Not Appearing

1. Check `isPublished: true` in plugins.json
2. Verify `category: "compliance"` or has compliance/framework tags
3. Ensure plugin is installed for the tenant

### Region Not Showing Flag

1. Check the region name exactly matches a key in `regionFlags`
2. Region names are case-sensitive
3. Add new region to `regionFlags` if needed

### UI Components Not Loading

1. Verify `bundleUrl` points to correct file
2. Check browser console for loading errors
3. Ensure UI bundle is built and deployed

### Controls Not Syncing

1. Check DOM events are being dispatched
2. Verify event listeners are attached
3. Check project ID matches in event detail
