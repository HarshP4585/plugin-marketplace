# Plugin UI Development Guide

This guide covers everything you need to know to build dynamic UIs for VerifyWise plugins.

## Table of Contents

1. [Overview](#overview)
2. [How Plugin UIs Work](#how-plugin-uis-work)
3. [Project Setup](#project-setup)
4. [Building Components](#building-components)
5. [Available Slots](#available-slots)
6. [Slot Props Reference](#slot-props-reference)
7. [Component Patterns](#component-patterns)
8. [Styling Guidelines](#styling-guidelines)
9. [Building and Deploying](#building-and-deploying)
10. [Common Patterns](#common-patterns)
11. [Troubleshooting](#troubleshooting)

---

## Overview

Plugin UIs in VerifyWise are **fully dynamic** - they are NOT bundled with the main application. Instead:

1. Plugin UIs are compiled as **IIFE (Immediately Invoked Function Expression)** bundles
2. Bundles expose React components on the `window` object
3. VerifyWise loads bundles at runtime via `<script>` tag injection
4. Components are rendered at designated **Plugin Slots**

This architecture allows:
- Installing/uninstalling plugins without app rebuilds
- Hot-loading plugin UIs without page refresh
- Complete isolation between plugins
- Independent plugin development and deployment

---

## How Plugin UIs Work

### Loading Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PLUGIN UI LOADING FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. APP STARTUP                                                         │
│     ┌──────────────────┐                                               │
│     │ PluginRegistry   │  Fetches installed plugins from API           │
│     │ Provider         │  Sets installedPlugins state                  │
│     └────────┬─────────┘                                               │
│              │                                                          │
│              ▼                                                          │
│  2. BUNDLE LOADING                                                      │
│     ┌──────────────────┐     ┌──────────────────┐                      │
│     │ PluginLoader     │────►│ For each plugin: │                      │
│     │ Component        │     │ - Get UI config  │                      │
│     └──────────────────┘     │ - Load bundle    │                      │
│                              └────────┬─────────┘                      │
│                                       │                                 │
│                                       ▼                                 │
│  3. SCRIPT INJECTION                                                    │
│     ┌──────────────────┐     ┌──────────────────┐                      │
│     │ loadPluginUI()   │────►│ Create <script>  │                      │
│     │                  │     │ tag, append to   │                      │
│     │                  │     │ document.head    │                      │
│     └──────────────────┘     └────────┬─────────┘                      │
│                                       │                                 │
│                                       ▼                                 │
│  4. COMPONENT REGISTRATION                                              │
│     ┌──────────────────┐     ┌──────────────────┐                      │
│     │ Bundle executes  │────►│ window.PluginXyz │                      │
│     │ IIFE on load     │     │ = { Component1,  │                      │
│     │                  │     │   Component2 }   │                      │
│     └──────────────────┘     └────────┬─────────┘                      │
│                                       │                                 │
│                                       ▼                                 │
│  5. SLOT MAPPING                                                        │
│     ┌──────────────────┐     ┌──────────────────┐                      │
│     │ loadedComponents │────►│ Map<slotId,      │                      │
│     │ state updated    │     │   Component[]>   │                      │
│     └──────────────────┘     └────────┬─────────┘                      │
│                                       │                                 │
│                                       ▼                                 │
│  6. RENDERING                                                           │
│     ┌──────────────────┐     ┌──────────────────┐                      │
│     │ <PluginSlot      │────►│ Renders plugin   │                      │
│     │   id="slot-id"/> │     │ components       │                      │
│     └──────────────────┘     └──────────────────┘                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Unloading Flow

When a plugin is uninstalled:

1. `unloadPlugin(pluginKey)` is called
2. Plugin's components are removed from `loadedComponents` map
3. `<PluginSlot>` components re-render without the plugin's components
4. UI disappears immediately - no page refresh needed

### Re-installation Flow

When a previously installed plugin is re-installed:

1. Bundle script is still in DOM (not removed on uninstall)
2. `loadPluginUI()` detects bundle is already loaded
3. Components are re-registered from existing `window.PluginXyz`
4. UI appears immediately - no need to reload script

---

## Project Setup

### Directory Structure

```
plugins/my-plugin/ui/
├── src/
│   ├── index.tsx           # Entry point - exports all components
│   ├── MyPluginConfig.tsx  # Configuration panel component
│   ├── MyPluginTab.tsx     # Tab content component
│   ├── MyPluginModal.tsx   # Modal component
│   ├── MyPluginMenuItem.tsx # Menu item component
│   └── theme.ts            # Optional theme/styling utilities
├── package.json            # Dependencies
├── vite.config.ts          # Build configuration
├── tsconfig.json           # TypeScript configuration
└── tsconfig.node.json      # Node TypeScript config
```

### package.json

```json
{
  "name": "@verifywise/plugin-my-plugin-ui",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.esm.js",
  "module": "dist/index.esm.js",
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@mui/material": "^5.0.0",
    "@emotion/react": "^11.0.0",
    "@emotion/styled": "^11.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  },
  "dependencies": {
    "lucide-react": "^0.300.0"
  }
}
```

**Important:** React, ReactDOM, and MUI are `peerDependencies` - they will use the host app's versions.

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure production mode for smaller bundle
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      formats: ["iife"],  // IIFE format for script tag loading
      name: "PluginMyPlugin",  // Global variable: window.PluginMyPlugin
      fileName: () => "index.esm.js",
    },
    rollupOptions: {
      // CRITICAL: Don't bundle these - use host app's versions
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@mui/material",
        "@emotion/react",
        "@emotion/styled",
      ],
      output: {
        // Map external imports to global variables
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
    sourcemap: true,  // Helps with debugging
  },
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### Entry Point (index.tsx)

```typescript
/**
 * Plugin UI Entry Point
 *
 * Export all components that will be injected into VerifyWise.
 * Component names must match `componentName` in plugins.json slots config.
 */

export { MyPluginConfig } from "./MyPluginConfig";
export { MyPluginTab } from "./MyPluginTab";
export { MyPluginMenuItem } from "./MyPluginMenuItem";
export { MyPluginModal } from "./MyPluginModal";

// After build, these will be available as:
// window.PluginMyPlugin.MyPluginConfig
// window.PluginMyPlugin.MyPluginTab
// window.PluginMyPlugin.MyPluginMenuItem
// window.PluginMyPlugin.MyPluginModal
```

---

## Building Components

### Configuration Component

Configuration components render in the plugin management page.

```tsx
// MyPluginConfig.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

// Props passed by PluginSlot via slotProps
interface MyPluginConfigProps {
  pluginKey?: string;
  installationId?: number;
  configData?: Record<string, string>;
  onConfigChange?: (key: string, value: string) => void;
  onSaveConfiguration?: () => void;
  onTestConnection?: () => void;
  isSavingConfig?: boolean;
  isTestingConnection?: boolean;
}

export const MyPluginConfig: React.FC<MyPluginConfigProps> = ({
  configData = {},
  onConfigChange,
  onSaveConfiguration,
  onTestConnection,
  isSavingConfig = false,
  isTestingConnection = false,
}) => {
  // Local state for form values
  const [localConfig, setLocalConfig] = useState<Record<string, string>>({
    api_url: "",
    api_key: "",
    sync_interval: "hourly",
    enabled: "true",
    ...configData,
  });

  // Sync parent config to local state
  useEffect(() => {
    setLocalConfig((prev) => ({ ...prev, ...configData }));
  }, [configData]);

  // Handle field changes
  const handleChange = (key: string, value: string) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
    if (onConfigChange) {
      onConfigChange(key, value);
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure your plugin settings to connect to your service.
      </Typography>

      <Stack spacing={2.5}>
        {/* Text Field */}
        <Box>
          <Typography
            variant="body2"
            fontWeight={500}
            fontSize={13}
            sx={{ mb: 0.75, color: "#344054" }}
          >
            API URL
          </Typography>
          <TextField
            fullWidth
            placeholder="https://api.example.com"
            value={localConfig.api_url || ""}
            onChange={(e) => handleChange("api_url", e.target.value)}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "13px",
                backgroundColor: "white",
              },
            }}
          />
        </Box>

        {/* Password Field */}
        <Box>
          <Typography
            variant="body2"
            fontWeight={500}
            fontSize={13}
            sx={{ mb: 0.75, color: "#344054" }}
          >
            API Key
          </Typography>
          <TextField
            fullWidth
            type="password"
            placeholder="Enter your API key"
            value={localConfig.api_key || ""}
            onChange={(e) => handleChange("api_key", e.target.value)}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "13px",
                backgroundColor: "white",
              },
            }}
          />
        </Box>

        {/* Select Field */}
        <Box>
          <Typography
            variant="body2"
            fontWeight={500}
            fontSize={13}
            sx={{ mb: 0.75, color: "#344054" }}
          >
            Sync Interval
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={localConfig.sync_interval || "hourly"}
              onChange={(e) => handleChange("sync_interval", e.target.value)}
              sx={{ fontSize: "13px", backgroundColor: "white" }}
            >
              <MenuItem value="hourly">Every Hour</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={localConfig.enabled === "true"}
              onChange={(e) =>
                handleChange("enabled", e.target.checked ? "true" : "false")
              }
              sx={{
                color: "#13715B",
                "&.Mui-checked": { color: "#13715B" },
              }}
            />
          }
          label={
            <Typography variant="body2" fontWeight={500} fontSize={13}>
              Enable automatic sync
            </Typography>
          }
        />
      </Stack>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
        {onTestConnection && (
          <Button
            variant="outlined"
            onClick={onTestConnection}
            disabled={isTestingConnection || isSavingConfig}
            sx={{
              borderColor: "#13715B",
              color: "#13715B",
              textTransform: "none",
              fontSize: "13px",
              "&:hover": {
                borderColor: "#0f5a47",
                backgroundColor: "rgba(19, 113, 91, 0.04)",
              },
            }}
          >
            {isTestingConnection ? "Testing..." : "Test Connection"}
          </Button>
        )}
        {onSaveConfiguration && (
          <Button
            variant="contained"
            onClick={onSaveConfiguration}
            disabled={isSavingConfig || isTestingConnection}
            sx={{
              backgroundColor: "#13715B",
              textTransform: "none",
              fontSize: "13px",
              "&:hover": { backgroundColor: "#0f5a47" },
            }}
          >
            {isSavingConfig ? "Saving..." : "Save Configuration"}
          </Button>
        )}
      </Box>
    </Box>
  );
};
```

### Tab Component

Tab components render in tabbed interfaces like Model Inventory.

```tsx
// MyPluginTab.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
} from "@mui/material";
import { RefreshCw } from "lucide-react";

interface MyPluginTabProps {
  apiServices?: any;  // API service from VerifyWise
}

interface DataItem {
  id: number;
  name: string;
  status: string;
  updatedAt: string;
}

export const MyPluginTab: React.FC<MyPluginTabProps> = ({ apiServices }) => {
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use apiServices passed from host app
      const response = await apiServices?.get("/plugins/my-plugin/data");
      setData(response?.data?.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiServices]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (data.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No data found. Make sure the plugin is configured correctly.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          My Plugin Data
        </Typography>
        <Button
          startIcon={<RefreshCw size={16} />}
          onClick={fetchData}
          sx={{ textTransform: "none" }}
        >
          Refresh
        </Button>
      </Box>

      {/* Data Table */}
      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>
                  {new Date(item.updatedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};
```

### Menu Item Component

Menu items render in dropdowns like "Insert From" in Risk Management.

```tsx
// MyPluginMenuItem.tsx
import React from "react";
import { Box, Typography } from "@mui/material";
import { FileSpreadsheet } from "lucide-react";

interface MyPluginMenuItemProps {
  onMenuClose?: () => void;
  onTriggerModal?: (modalName: string) => void;
}

export const MyPluginMenuItem: React.FC<MyPluginMenuItemProps> = ({
  onMenuClose,
  onTriggerModal,
}) => {
  const handleClick = () => {
    // Close the menu
    if (onMenuClose) onMenuClose();
    // Open the modal
    if (onTriggerModal) onTriggerModal("MyPluginModal");
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        cursor: "pointer",
        borderRadius: "8px",
        "&:hover": {
          backgroundColor: "rgba(19, 113, 91, 0.04)",
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "8px",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FileSpreadsheet size={20} color="#10b981" />
      </Box>
      <Box>
        <Typography fontWeight={600} fontSize={14}>
          Import from My Plugin
        </Typography>
        <Typography variant="body2" color="text.secondary" fontSize={12}>
          Import data using My Plugin format
        </Typography>
      </Box>
    </Box>
  );
};
```

### Modal Component

Modals render as overlay dialogs.

```tsx
// MyPluginModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { X as CloseIcon } from "lucide-react";

interface MyPluginModalProps {
  open?: boolean;
  onClose?: () => void;
  onImportComplete?: () => void;
  apiServices?: any;
}

export const MyPluginModal: React.FC<MyPluginModalProps> = ({
  open = false,
  onClose,
  onImportComplete,
  apiServices,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiServices?.post("/plugins/my-plugin/import", { /* data */ });
      if (onImportComplete) onImportComplete();
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e5e7eb",
          pb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Import Data
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Your modal content here */}
        <Typography>
          Configure your import settings...
        </Typography>
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid #e5e7eb", p: 2 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={loading}
          sx={{
            backgroundColor: "#13715B",
            textTransform: "none",
            "&:hover": { backgroundColor: "#0f5a47" },
          }}
        >
          {loading ? <CircularProgress size={20} /> : "Import"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

---

## Available Slots

| Slot ID | Location | Render Types | Use Case |
|---------|----------|--------------|----------|
| `page.risks.actions` | Risk Management "Insert From" menu | `menuitem`, `modal` | Risk import options |
| `page.models.tabs` | Model Inventory page tabs | `tab` | Additional data tabs |
| `page.plugin.config` | Plugin management config panel | `card`, `inline` | Plugin configuration |
| `page.dashboard.widgets` | Dashboard (future) | `widget`, `card` | Dashboard widgets |
| `layout.sidebar.items` | Sidebar (future) | `menuitem` | Navigation items |
| `page.risks.toolbar` | Risk Management toolbar | `button` | Action buttons |
| `page.models.toolbar` | Model Inventory toolbar | `button` | Action buttons |

---

## Slot Props Reference

### Configuration Slot (`page.plugin.config`)

```typescript
interface ConfigSlotProps {
  pluginKey: string;
  installationId: number;
  configData: Record<string, string>;
  onConfigChange: (key: string, value: string) => void;
  onSaveConfiguration: () => void;
  onTestConnection?: () => void;
  isSavingConfig: boolean;
  isTestingConnection: boolean;
}
```

### Tab Slot (`page.models.tabs`)

```typescript
interface TabSlotProps {
  apiServices: {
    get: (url: string) => Promise<any>;
    post: (url: string, data: any) => Promise<any>;
    put: (url: string, data: any) => Promise<any>;
    delete: (url: string) => Promise<any>;
  };
}
```

### Menu Item Slot (`page.risks.actions`)

```typescript
interface MenuItemSlotProps {
  onMenuClose: () => void;
  onImportComplete: () => void;
  onTriggerModal: (modalName: string) => void;
}
```

### Modal Slot (`page.risks.actions` with renderType: modal)

```typescript
interface ModalSlotProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  apiServices: any;
}
```

---

## Styling Guidelines

### Color Palette

Use these colors to match VerifyWise styling:

```typescript
const colors = {
  primary: "#13715B",       // Primary green
  primaryHover: "#0f5a47",  // Darker green for hover
  primaryLight: "rgba(19, 113, 91, 0.04)",  // Light green background

  text: {
    primary: "#101828",     // Main text
    secondary: "#667085",   // Secondary text
    label: "#344054",       // Form labels
  },

  border: {
    default: "#d0d5dd",     // Default borders
    light: "#e5e7eb",       // Light borders
  },

  status: {
    success: "#16a34a",
    successBg: "rgba(34, 197, 94, 0.1)",
    error: "#dc2626",
    errorBg: "rgba(239, 68, 68, 0.1)",
    warning: "#d97706",
    warningBg: "rgba(245, 158, 11, 0.1)",
  },
};
```

### Typography

```typescript
const typography = {
  heading: {
    fontWeight: 600,
    fontSize: "15px",
  },
  label: {
    fontWeight: 500,
    fontSize: "13px",
    color: "#344054",
  },
  body: {
    fontSize: "13px",
    color: "#667085",
  },
  small: {
    fontSize: "11px",
  },
};
```

### Button Styles

```typescript
// Primary button
<Button
  variant="contained"
  sx={{
    backgroundColor: "#13715B",
    textTransform: "none",
    fontSize: "13px",
    fontWeight: 500,
    "&:hover": { backgroundColor: "#0f5a47" },
    "&:disabled": { backgroundColor: "#d0d5dd" },
  }}
>
  Primary Action
</Button>

// Secondary button
<Button
  variant="outlined"
  sx={{
    borderColor: "#13715B",
    color: "#13715B",
    textTransform: "none",
    fontSize: "13px",
    fontWeight: 500,
    "&:hover": {
      borderColor: "#0f5a47",
      backgroundColor: "rgba(19, 113, 91, 0.04)",
    },
  }}
>
  Secondary Action
</Button>
```

### Input Styles

```typescript
<TextField
  size="small"
  sx={{
    "& .MuiOutlinedInput-root": {
      fontSize: "13px",
      backgroundColor: "white",
      "& fieldset": {
        borderColor: "#d0d5dd",
      },
      "&:hover fieldset": {
        borderColor: "#13715B",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#13715B",
      },
    },
  }}
/>
```

---

## Building and Deploying

### Development Build

```bash
cd plugins/my-plugin/ui

# Install dependencies
npm install

# Build with watch mode
npm run dev
```

### Production Build

```bash
cd plugins/my-plugin/ui

# Build for production
npm run build

# Output: dist/index.esm.js
```

### Verify Build

```bash
# Check bundle exists
ls -la dist/

# Check bundle size (should be small - no React/MUI bundled)
du -h dist/index.esm.js
```

### plugins.json Configuration

```json
{
  "key": "my-plugin",
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
      },
      {
        "slotId": "page.risks.actions",
        "componentName": "MyPluginMenuItem",
        "renderType": "menuitem"
      },
      {
        "slotId": "page.risks.actions",
        "componentName": "MyPluginModal",
        "renderType": "modal",
        "trigger": "MyPluginMenuItem"
      }
    ]
  }
}
```

---

## Common Patterns

### Calling Backend APIs

```tsx
// Use apiServices passed via slotProps
const fetchData = async () => {
  try {
    const response = await apiServices.get("/plugins/my-plugin/data");
    return response.data;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};
```

### Handling Loading States

```tsx
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await someAsyncOperation();
  } finally {
    setLoading(false);
  }
};

return (
  <Button disabled={loading}>
    {loading ? <CircularProgress size={16} /> : "Submit"}
  </Button>
);
```

### Error Handling

```tsx
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  setError(null);
  try {
    await someAsyncOperation();
  } catch (err: any) {
    setError(err.message || "An error occurred");
  }
};

return (
  <>
    {error && <Alert severity="error">{error}</Alert>}
    {/* rest of component */}
  </>
);
```

### Form State Management

```tsx
const [formData, setFormData] = useState({
  field1: "",
  field2: "",
});

const handleChange = (field: string) => (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  setFormData((prev) => ({ ...prev, [field]: e.target.value }));
};

return (
  <>
    <TextField
      value={formData.field1}
      onChange={handleChange("field1")}
    />
    <TextField
      value={formData.field2}
      onChange={handleChange("field2")}
    />
  </>
);
```

---

## Troubleshooting

### Bundle Not Loading

**Symptoms:** Plugin UI doesn't appear, no console errors

**Solutions:**
1. Check `bundleUrl` in plugins.json is correct
2. Verify bundle file exists at expected path
3. Check browser Network tab for 404 errors
4. Ensure `globalName` matches vite.config.ts

### Components Undefined

**Symptoms:** Console error "Component X not found in plugin Y"

**Solutions:**
1. Verify `componentName` in plugins.json matches export name
2. Check index.tsx exports the component
3. Rebuild the bundle after adding new exports

### React Hooks Error

**Symptoms:** "Invalid hook call" error

**Solutions:**
1. Ensure React is in `external` array in vite.config.ts
2. Check `globals` mapping is correct
3. Verify peerDependencies in package.json

### Styling Conflicts

**Symptoms:** Plugin UI looks different from app

**Solutions:**
1. Use MUI components from @mui/material
2. Use `sx` prop for styling (not CSS files)
3. Follow color/typography guidelines above

### UI Not Appearing After Install

**Symptoms:** Install succeeds but UI doesn't show

**Solutions:**
1. Check PluginLoader is in app
2. Verify slot configuration is correct
3. Check `slotId` matches where `<PluginSlot>` is placed
4. Look for console errors

### UI Persists After Uninstall

**Symptoms:** UI still visible after uninstalling plugin

**Solutions:**
1. Verify `unloadPlugin()` is called in usePluginInstallation hook
2. Check PluginRegistry context is working
3. Ensure refreshPlugins() is called after uninstall

### Modal Doesn't Open

**Symptoms:** Menu item clicks but modal doesn't appear

**Solutions:**
1. Verify `trigger` field in modal slot config matches menu item component name
2. Check `onTriggerModal` is being called with correct name
3. Ensure modal slot has `renderType: "modal"`
