import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button,
  Grid,
  CardContent,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  Chip,
} from "@mui/material";
import type { GridProps } from "@mui/material";
import { RefreshCw, XCircle, Eye, ChevronsUpDown } from "lucide-react";
import { colors, typography, borderRadius, cardStyles, tableStyles, chipStyles, buttonStyles, modalStyles } from "./theme";

interface SelectorVerticalProps {
  className?: string;
  [key: string]: unknown;
}

const SelectorVertical = (props: SelectorVerticalProps) => <ChevronsUpDown size={16} {...props} />;

interface MLFlowModel {
  id: number;
  model_name: string;
  version: string;
  lifecycle_stage: string;
  status?: string;
  run_id: string;
  experiment_id?: string;
  experiment_name?: string;
  description?: string;
  creation_timestamp: number;
  last_updated_timestamp: number;
  artifact_location?: string;
  tags?: Record<string, string>;
  metrics?: Record<string, number>;
  parameters?: Record<string, string>;
}

interface MLFlowTabProps {
  apiServices?: {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, data?: any) => Promise<any>;
  };
}

export const MLFlowTab: React.FC<MLFlowTabProps> = ({ apiServices }) => {
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<MLFlowModel | null>(null);
  const [mlflowData, setMlflowData] = useState<MLFlowModel[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Default API services if not provided
  const api = apiServices || {
    get: async (url: string) => {
      const response = await fetch(`/api${url}`);
      return { data: await response.json() };
    },
    post: async (url: string, data?: any) => {
      const response = await fetch(`/api${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return { data: await response.json() };
    },
  };

  const summaryStats = useMemo(() => {
    const stageCounts = mlflowData.reduce(
      (acc, model) => {
        const stage = (model.lifecycle_stage || "").toLowerCase();
        if (stage === "production") acc.active += 1;
        else if (stage === "staging") acc.staging += 1;
        else if (stage === "archived") acc.archived += 1;
        return acc;
      },
      { active: 0, staging: 0, archived: 0 },
    );

    const experiments = new Set(
      mlflowData
        .map((model) => model.experiment_id)
        .filter(Boolean),
    ).size;

    return {
      total: mlflowData.length,
      active: stageCounts.active,
      staging: stageCounts.staging,
      archived: stageCounts.archived,
      experiments,
    };
  }, [mlflowData]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const fetchMLFlowData = async () => {
    setLoading(true);
    setWarning(null);

    try {
      const response = await api.get("/plugins/mlflow/models");

      if (response.data?.data) {
        // Handle plugin API response format: { message: "OK", data: { configured: boolean, models: [] } }
        const pluginData = response.data.data;
        if ('models' in pluginData && Array.isArray(pluginData.models)) {
          // Check various states
          if (!pluginData.configured) {
            setWarning("Configure the MLFlow plugin to start syncing live data.");
          } else if (pluginData.connected === false) {
            // MLFlow is configured but server is not reachable
            setWarning(pluginData.message || "MLFlow server is not reachable.");
          } else if (pluginData.error) {
            setWarning(pluginData.error);
          }
          setMlflowData(pluginData.models);
        } else {
          setMlflowData([]);
        }
      } else {
        setMlflowData([]);
      }
    } catch {
      // Only show warning for actual errors - backend should return 200 for most cases now
      setWarning("Unable to reach the MLFlow backend.");
      setMlflowData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMLFlowData();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setWarning(null);

    try {
      // Call sync endpoint to fetch fresh data from MLflow server
      await api.post("/plugins/mlflow/sync");

      // Then fetch the updated data from database
      await fetchMLFlowData();
    } catch (error: any) {
      console.error("Error syncing MLflow data:", error);

      // If sync fails, still try to fetch existing data
      await fetchMLFlowData();

      // Show warning if sync failed but data was fetched
      if (error.response?.data?.message) {
        setWarning(`Sync failed: ${error.response.data.message}`);
      } else {
        setWarning("Failed to sync with MLflow server. Showing cached data.");
      }
    }
  };

  const handleModelClick = (model: MLFlowModel) => {
    setSelectedModel(model);
  };

  const handleCloseModal = () => {
    setSelectedModel(null);
  };

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const getRange = useMemo(() => {
    if (!mlflowData.length) {
      return "0 - 0";
    }
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, mlflowData.length);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, mlflowData.length]);

  const displayData = mlflowData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>Loading MLFlow data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: "100%", overflowX: "hidden" }}>
      {/* Header Section */}
      {warning && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {warning}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2, width: "100%" }}>
        <Button
          variant="outlined"
          startIcon={<RefreshCw size={16} />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            ...buttonStyles.base,
            ...buttonStyles.sizes.medium,
            ...buttonStyles.primary.outlined,
            textTransform: "none",
          }}
        >
          Sync
        </Button>
      </Box>

      {/* Header Cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <Card sx={{ flex: "1 1 200px", minWidth: 150, ...cardStyles.base }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: colors.textTertiary, fontSize: typography.sizes.md }}>Models</Typography>
            <Typography variant="h4" sx={{ fontWeight: typography.weights.semibold, color: colors.textPrimary }}>{summaryStats.total}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: "1 1 200px", minWidth: 150, ...cardStyles.base }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: colors.textTertiary, fontSize: typography.sizes.md }}>Active</Typography>
            <Typography variant="h4" sx={{ fontWeight: typography.weights.semibold, color: colors.textPrimary }}>{summaryStats.active}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: "1 1 200px", minWidth: 150, ...cardStyles.base }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: colors.textTertiary, fontSize: typography.sizes.md }}>Staging</Typography>
            <Typography variant="h4" sx={{ fontWeight: typography.weights.semibold, color: colors.textPrimary }}>{summaryStats.staging}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: "1 1 200px", minWidth: 150, ...cardStyles.base }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: colors.textTertiary, fontSize: typography.sizes.md }}>Experiments</Typography>
            <Typography variant="h4" sx={{ fontWeight: typography.weights.semibold, color: colors.textPrimary }}>{summaryStats.experiments}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Table Section */}
      <Box sx={{ mt: 4, mb: 2 }}>
        {mlflowData.length === 0 && !loading ? (
          <Box sx={{ textAlign: "center", py: 4, color: colors.textTertiary }}>
            <Typography sx={{ fontSize: typography.sizes.md }}>No MLFlow runs have been synced yet. Configure the integration and click Sync to pull the latest models.</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ border: `1px solid ${colors.border}`, borderRadius: borderRadius.md }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ backgroundColor: colors.backgroundSecondary }}>
                <TableRow>
                  {["Model Name", "Version", "Status", "Created", "Last Updated", "Description", "Actions"].map((header) => (
                    <TableCell
                      key={header}
                      sx={tableStyles.header}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayData.map((model) => (
                  <TableRow
                    key={model.id}
                    sx={{ ...tableStyles.row, cursor: "pointer" }}
                    onClick={() => handleModelClick(model)}
                  >
                    <TableCell sx={tableStyles.cell}>
                      {model.model_name}
                    </TableCell>
                    <TableCell sx={tableStyles.cell}>
                      {model.version}
                    </TableCell>
                    <TableCell sx={tableStyles.cell}>
                      <Chip
                        label={model.lifecycle_stage}
                        size="small"
                        sx={{
                          ...chipStyles.base,
                          ...(model.lifecycle_stage.toLowerCase() === "production"
                            ? chipStyles.success
                            : model.lifecycle_stage.toLowerCase() === "staging"
                            ? chipStyles.warning
                            : chipStyles.neutral),
                        }}
                      />
                    </TableCell>
                    <TableCell sx={tableStyles.cell}>
                      {formatDate(model.creation_timestamp)}
                    </TableCell>
                    <TableCell sx={tableStyles.cell}>
                      {formatDate(model.last_updated_timestamp)}
                    </TableCell>
                    <TableCell sx={{ ...tableStyles.cell, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {model.description || "No description"}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Tooltip title="View details">
                          <IconButton size="small" sx={{ mr: 1 }}>
                            <Eye size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {mlflowData.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell sx={{ fontSize: typography.sizes.md, color: colors.textTertiary }}>
                      Showing {getRange} of {mlflowData.length} model(s)
                    </TableCell>
                    <TablePagination
                      count={mlflowData.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      rowsPerPageOptions={[5, 10, 15, 25]}
                      onRowsPerPageChange={handleRowsPerPageChange}
                      labelRowsPerPage="Rows per page"
                      labelDisplayedRows={({ page, count }) => `Page ${page + 1} of ${Math.max(1, Math.ceil(count / rowsPerPage))}`}
                      slotProps={{
                        select: {
                          IconComponent: SelectorVertical,
                        },
                      }}
                      sx={{ fontSize: typography.sizes.md }}
                    />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Model Details Modal */}
      {selectedModel && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            ...modalStyles.overlay,
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Card sx={{ ...modalStyles.content }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ ...modalStyles.title, fontSize: typography.sizes.xl }}>
                  {selectedModel.model_name}
                </Typography>
                <IconButton onClick={handleCloseModal} sx={{ color: colors.textTertiary }}>
                  <XCircle size={20} />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid {...({ item: true, xs: 12, sm: 6 } as GridProps & { item: boolean; xs: number; sm: number })}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Basic Information
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Version:</strong> {selectedModel.version}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {selectedModel.status || selectedModel.lifecycle_stage}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Run ID:</strong> {selectedModel.run_id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Created:</strong> {formatDate(selectedModel.creation_timestamp)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid {...({ item: true, xs: 12, sm: 6 } as GridProps & { item: boolean; xs: number; sm: number })}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {selectedModel.description || "No description available"}
                  </Typography>
                </Grid>
                <Grid {...({ item: true, xs: 12 } as GridProps & { item: boolean; xs: number })}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Tags
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {Object.entries(selectedModel.tags || {}).map(([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        size="small"
                        sx={{
                          backgroundColor: "#E0EAFF",
                          color: "#0F172A",
                          borderRadius: "4px",
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid {...({ item: true, xs: 12, sm: 6 } as GridProps & { item: boolean; xs: number; sm: number })}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Metrics
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {Object.entries(selectedModel.metrics || {}).map(([key, value]) => (
                      <Typography variant="body2" key={key}>
                        <strong>{key}:</strong> {typeof value === "number" ? value.toFixed(4) : value}
                      </Typography>
                    ))}
                  </Box>
                </Grid>
                <Grid {...({ item: true, xs: 12, sm: 6 } as GridProps & { item: boolean; xs: number; sm: number })}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Parameters
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {Object.entries(selectedModel.parameters || {}).map(([key, value]) => (
                      <Typography variant="body2" key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </Typography>
                    ))}
                  </Box>
                </Grid>
                <Grid {...({ item: true, xs: 12 } as GridProps & { item: boolean; xs: number })}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Experiment Information
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Experiment ID:</strong> {selectedModel.experiment_id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Experiment Name:</strong> {selectedModel.experiment_name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Artifact Location:</strong> {selectedModel.artifact_location}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default MLFlowTab;
