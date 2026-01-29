/**
 * Custom Framework Controls
 *
 * Renders custom frameworks section in the Controls and Requirements tab.
 * This component is injected via PluginSlot into the core app's framework controls UI.
 * It handles its own state and displays custom frameworks with a toggle selector.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { FileJson } from "lucide-react";
import { CustomFrameworkViewer } from "./CustomFrameworkViewer";
import { colors, borderColors, fontSizes } from "./theme";

interface CustomFramework {
  id: number;
  framework_id: number;
  name: string;
  description: string;
  hierarchy_type: string;
  level_1_name: string;
  level_2_name: string;
  level_3_name?: string;
  is_organizational: boolean;
}

interface Project {
  id: number;
  project_title: string;
  is_organizational: boolean;
}

interface CustomFrameworkControlsProps {
  project: Project;
  onRefresh?: () => void;
  apiServices?: {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, data?: any) => Promise<any>;
    patch: (url: string, data?: any) => Promise<any>;
  };
}

export const CustomFrameworkControls: React.FC<CustomFrameworkControlsProps> = ({
  project,
  onRefresh,
  apiServices,
}) => {
  const [frameworks, setFrameworks] = useState<CustomFramework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const api = apiServices || {
    get: async (url: string) => {
      const response = await fetch(`/api${url}`);
      return { data: await response.json() };
    },
    post: async (url: string, body?: any) => {
      const response = await fetch(`/api${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return { data: await response.json(), status: response.status };
    },
    patch: async (url: string, body?: any) => {
      const response = await fetch(`/api${url}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return { data: await response.json() };
    },
  };

  const loadFrameworks = useCallback(async () => {
    if (!project?.id) return;

    try {
      setLoading(true);
      // Fetch custom frameworks added to this project
      const response = await api.get(
        `/plugins/custom-framework-import/projects/${project.id}/custom-frameworks`
      );

      let rawData = response.data;
      if (rawData && typeof rawData === "object" && "data" in rawData) {
        rawData = rawData.data;
      }
      if (rawData && typeof rawData === "object" && !Array.isArray(rawData) && "data" in rawData) {
        rawData = rawData.data;
      }

      const frameworksArray = Array.isArray(rawData) ? rawData : [];
      console.log("[CustomFrameworkControls] Loaded frameworks:", frameworksArray);
      setFrameworks(frameworksArray);

      // Auto-select first framework if available
      if (frameworksArray.length > 0 && selectedFramework === null) {
        setSelectedFramework(frameworksArray[0].framework_id);
      }
    } catch (err) {
      console.log("[CustomFrameworkControls] Error loading frameworks:", err);
      setFrameworks([]);
    } finally {
      setLoading(false);
    }
  }, [project?.id, api]);

  useEffect(() => {
    loadFrameworks();
  }, [loadFrameworks]);

  const handleFrameworkChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFrameworkId: number | null
  ) => {
    if (newFrameworkId !== null) {
      setSelectedFramework(newFrameworkId);
    }
  };

  // Don't render anything if no custom frameworks are added to the project
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={24} sx={{ color: colors.primary }} />
      </Box>
    );
  }

  if (frameworks.length === 0) {
    return null; // Don't show anything if no custom frameworks
  }

  const currentFramework = frameworks.find((fw) => fw.framework_id === selectedFramework);

  return (
    <Stack spacing={3}>
      {/* Divider with label */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 4 }}>
        <Divider sx={{ flex: 1, borderColor: borderColors.default }} />
        <Chip
          icon={<FileJson size={14} />}
          label="Custom Frameworks"
          size="small"
          sx={{
            backgroundColor: `${colors.primary}12`,
            color: colors.primary,
            fontWeight: 500,
            fontSize: fontSizes.small,
            border: `1px solid ${colors.primary}30`,
            "& .MuiChip-icon": { color: colors.primary },
          }}
        />
        <Divider sx={{ flex: 1, borderColor: borderColors.default }} />
      </Box>

      {/* Framework toggle */}
      {frameworks.length > 1 && (
        <Box>
          <ToggleButtonGroup
            value={selectedFramework}
            exclusive
            onChange={handleFrameworkChange}
            aria-label="custom framework selection"
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                px: 3,
                py: 1,
                fontSize: fontSizes.medium,
                borderColor: borderColors.default,
                "&.Mui-selected": {
                  backgroundColor: colors.primary,
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: colors.primaryHover,
                  },
                },
              },
            }}
          >
            {frameworks.map((fw) => (
              <ToggleButton key={fw.framework_id} value={fw.framework_id}>
                {fw.name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Single framework title (when only one custom framework) */}
      {frameworks.length === 1 && (
        <Typography variant="h6" fontWeight={600}>
          {frameworks[0].name}
        </Typography>
      )}

      {/* Framework viewer */}
      {selectedFramework && currentFramework && (
        <CustomFrameworkViewer
          frameworkId={selectedFramework}
          projectId={project.id}
          frameworkName={currentFramework.name}
          apiServices={api}
          onRefresh={() => {
            loadFrameworks();
            onRefresh?.();
          }}
        />
      )}
    </Stack>
  );
};

export default CustomFrameworkControls;
