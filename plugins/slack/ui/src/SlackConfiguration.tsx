import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
} from "@mui/material";
import {
  SlidersHorizontal,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  X,
} from "lucide-react";
import { colors, typography, borderRadius, tableStyles, shadows } from "./theme";

interface SlackWorkspace {
  id: number;
  team_name: string;
  channel: string;
  created_at?: string;
  is_active: boolean;
  routing_type?: string[];
}

interface SlackConfigurationProps {
  pluginKey?: string;
  slackClientId?: string;
  slackOAuthUrl?: string;
  onToast?: (toast: { variant: string; body: string }) => void;
  apiServices?: {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, data?: any) => Promise<any>;
    patch: (url: string, data?: any) => Promise<any>;
    delete: (url: string) => Promise<any>;
  };
}

export const SlackConfiguration: React.FC<SlackConfigurationProps> = ({
  pluginKey = "slack",
  slackClientId,
  slackOAuthUrl = "https://slack.com/oauth/v2/authorize",
  onToast,
  apiServices,
}) => {
  const [slackWorkspaces, setSlackWorkspaces] = useState<SlackWorkspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [globalRoutingTypes, setGlobalRoutingTypes] = useState<string[]>([]);
  const [tablePage, setTablePage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isRoutingModalOpen, setIsRoutingModalOpen] = useState(false);

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
    patch: async (url: string, data?: any) => {
      const response = await fetch(`/api${url}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return { data: await response.json() };
    },
    delete: async (url: string) => {
      await fetch(`/api${url}`, { method: "DELETE" });
    },
  };

  // Fetch Slack workspaces
  const fetchSlackWorkspaces = useCallback(async () => {
    try {
      setLoadingWorkspaces(true);
      const response = await api.get(`/plugins/${pluginKey}/oauth/workspaces`);
      setSlackWorkspaces((response.data as any)?.data || []);
    } catch (error) {
      console.error("Failed to fetch Slack workspaces:", error);
    } finally {
      setLoadingWorkspaces(false);
    }
  }, [pluginKey]);

  useEffect(() => {
    fetchSlackWorkspaces();
  }, [fetchSlackWorkspaces]);

  const handleAddToSlack = () => {
    if (!slackClientId) {
      console.warn("Slack Client ID not configured");
      return;
    }

    const redirectUri = encodeURIComponent(`${window.location.origin}/plugins/${pluginKey}/manage`);
    const scope = encodeURIComponent("incoming-webhook,chat:write");

    const oauthUrl = `${slackOAuthUrl}?client_id=${slackClientId}&scope=${scope}&redirect_uri=${redirectUri}`;
    window.open(oauthUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDisconnectWorkspace = async (webhookId: number) => {
    try {
      await api.delete(`/plugins/${pluginKey}/oauth/workspaces/${webhookId}`);

      if (onToast) {
        onToast({
          variant: "success",
          body: "Workspace disconnected successfully!",
        });
      }

      fetchSlackWorkspaces();
    } catch (err: any) {
      if (onToast) {
        onToast({
          variant: "error",
          body: err.message || "Failed to disconnect workspace.",
        });
      }
    }
  };

  const handleToggleWorkspace = async (webhookId: number, isActive: boolean) => {
    try {
      await api.patch(`/plugins/${pluginKey}/oauth/workspaces/${webhookId}`, {
        is_active: !isActive,
      });

      if (onToast) {
        onToast({
          variant: "success",
          body: "Workspace status updated successfully!",
        });
      }

      fetchSlackWorkspaces();
    } catch (err: any) {
      if (onToast) {
        onToast({
          variant: "error",
          body: err.message || "Failed to update workspace status.",
        });
      }
    }
  };

  const handleApplyGlobalRouting = async () => {
    if (slackWorkspaces.length === 0) return;

    try {
      await Promise.all(
        slackWorkspaces.map((workspace) =>
          api.patch(`/plugins/${pluginKey}/oauth/workspaces/${workspace.id}`, {
            routing_type: globalRoutingTypes,
          })
        )
      );

      if (onToast) {
        onToast({
          variant: "success",
          body: `Notification routing updated for all ${slackWorkspaces.length} workspace(s)!`,
        });
      }

      fetchSlackWorkspaces();
    } catch (err: any) {
      if (onToast) {
        onToast({
          variant: "error",
          body: err.message || "Failed to apply routing settings.",
        });
      }
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setTablePage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setTablePage(0);
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" fontSize={13} sx={{ mb: 3 }}>
        Connect your Slack workspace and route VerifyWise notifications to specific channels.
      </Typography>

      {/* Action Buttons */}
      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mb: 3 }}>
        <a href="#" onClick={(e) => { e.preventDefault(); handleAddToSlack(); }}>
          <img
            alt="Add to Slack"
            height="34"
            width="120"
            src="https://platform.slack-edge.com/img/add_to_slack.png"
            srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
          />
        </a>
        <Button
          variant="contained"
          startIcon={<SlidersHorizontal size={18} />}
          onClick={() => setIsRoutingModalOpen(true)}
          disabled={slackWorkspaces.length === 0}
          sx={{
            height: "34px",
            backgroundColor: colors.primary,
            textTransform: "none",
            fontSize: typography.sizes.md,
            fontWeight: typography.weights.medium,
            "&:hover": {
              backgroundColor: colors.primaryHover,
            },
            "&:disabled": {
              backgroundColor: colors.disabled,
            },
          }}
        >
          Configure
        </Button>
      </Stack>

      {/* Workspaces Table */}
      {loadingWorkspaces ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 4 }}>
          <CircularProgress size={24} />
          <Typography fontSize={13}>Loading workspaces...</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ border: `1px solid ${colors.border}`, borderRadius: borderRadius.md }}>
          <Table>
            <TableHead sx={{ backgroundColor: colors.backgroundSecondary }}>
              <TableRow>
                <TableCell sx={{ ...tableStyles.header }}>
                  Team Name
                </TableCell>
                <TableCell sx={{ ...tableStyles.header }}>
                  Channel
                </TableCell>
                <TableCell sx={{ ...tableStyles.header }}>
                  Creation Date
                </TableCell>
                <TableCell sx={{ ...tableStyles.header }}>
                  Active
                </TableCell>
                <TableCell sx={{ ...tableStyles.header }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {slackWorkspaces.length > 0 ? (
                slackWorkspaces
                  .slice(tablePage * rowsPerPage, tablePage * rowsPerPage + rowsPerPage)
                  .map((workspace) => (
                    <TableRow key={workspace.id} sx={{ ...tableStyles.row }}>
                      <TableCell sx={{ ...tableStyles.cell }}>{workspace.team_name}</TableCell>
                      <TableCell sx={{ ...tableStyles.cell }}>#{workspace.channel}</TableCell>
                      <TableCell sx={{ ...tableStyles.cell }}>
                        {workspace.created_at ? new Date(workspace.created_at).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell sx={{ ...tableStyles.cell }}>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1,
                            py: 0.25,
                            borderRadius: borderRadius.full,
                            fontSize: "11px",
                            fontWeight: 500,
                            backgroundColor: workspace.is_active ? colors.successLight : "rgba(107, 114, 128, 0.1)",
                            color: workspace.is_active ? "#16a34a" : colors.textTertiary,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: workspace.is_active ? "#16a34a" : colors.textTertiary,
                            }}
                          />
                          {workspace.is_active ? "Active" : "Inactive"}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ ...tableStyles.cell }}>
                        <Stack direction="row" spacing={0.75}>
                          <Box
                            onClick={() => handleToggleWorkspace(workspace.id, workspace.is_active)}
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: borderRadius.sm,
                              border: `1px solid ${colors.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              color: workspace.is_active ? colors.primary : colors.textTertiary,
                              backgroundColor: colors.background,
                              transition: "all 0.15s ease",
                              "&:hover": {
                                borderColor: colors.primary,
                                backgroundColor: colors.primaryLight,
                                color: colors.primary,
                              },
                            }}
                            title={workspace.is_active ? "Disable" : "Enable"}
                          >
                            {workspace.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </Box>
                          <Box
                            onClick={() => handleDisconnectWorkspace(workspace.id)}
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: borderRadius.sm,
                              border: `1px solid ${colors.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              color: colors.textTertiary,
                              backgroundColor: colors.background,
                              transition: "all 0.15s ease",
                              "&:hover": {
                                borderColor: colors.error,
                                backgroundColor: colors.errorLight,
                                color: colors.error,
                              },
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </Box>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          backgroundColor: colors.backgroundSecondary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MessageSquare size={24} color={colors.textTertiary} />
                      </Box>
                      <Typography sx={{ fontSize: "13px", color: colors.textSecondary, fontWeight: 500 }}>
                        No workspaces connected
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: colors.textTertiary }}>
                        Click "Add to Slack" above to connect your first workspace.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {slackWorkspaces.length > 5 && (
              <TableFooter>
                <TableRow>
                  <TablePagination
                    count={slackWorkspaces.length}
                    page={tablePage}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 15, 25]}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Rows per page"
                    sx={{ fontSize: "13px" }}
                  />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      )}

      {/* Notification Routing Modal */}
      {isRoutingModalOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setIsRoutingModalOpen(false)}
        >
          <Box
            sx={{
              backgroundColor: colors.background,
              borderRadius: borderRadius.lg,
              maxWidth: "500px",
              width: "90%",
              boxShadow: shadows.lg,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2.5,
                borderBottom: `1px solid ${colors.borderLight}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: borderRadius.sm,
                    backgroundColor: colors.primaryLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SlidersHorizontal size={16} color={colors.primary} />
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: "15px", color: colors.textPrimary }}>
                  Notification Routing
                </Typography>
              </Box>
              <Box
                onClick={() => setIsRoutingModalOpen(false)}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: borderRadius.sm,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: colors.textTertiary,
                  "&:hover": { backgroundColor: colors.backgroundHover },
                }}
              >
                <X size={16} />
              </Box>
            </Box>

            {/* Modal Body */}
            <Box sx={{ p: 2.5 }}>
              <Typography sx={{ fontSize: "13px", color: colors.textTertiary, mb: 2.5 }}>
                Configure which notification types go to which Slack channels.
              </Typography>

              {/* Global Routing Configuration */}
              <Stack spacing={1.5}>
                <Typography sx={{ fontSize: "13px", fontWeight: 500, color: colors.textSecondary }}>
                  Apply to all workspaces:
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    multiple
                    value={globalRoutingTypes}
                    onChange={(e) => {
                      const value = typeof e.target.value === 'string' ?
                        e.target.value.split(',') :
                        e.target.value;
                      setGlobalRoutingTypes(value);
                    }}
                    renderValue={(selected) =>
                      (selected as string[]).length === 0
                        ? "Select notification types..."
                        : `${(selected as string[]).length} type(s) selected`
                    }
                    displayEmpty
                    sx={{
                      fontSize: "13px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: colors.border,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: colors.primary,
                      },
                    }}
                  >
                    {[
                      "Membership and roles",
                      "Projects and organizations",
                      "Policy reminders and status",
                      "Evidence and task alerts",
                      "Control or policy changes",
                    ].map((option) => (
                      <MenuItem key={option} value={option} sx={{ fontSize: "13px" }}>
                        <Checkbox
                          checked={globalRoutingTypes.indexOf(option) > -1}
                          size="small"
                          sx={{
                            color: colors.primary,
                            "&.Mui-checked": { color: colors.primary },
                          }}
                        />
                        <Typography sx={{ fontSize: "13px" }}>{option}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* Modal Footer */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1.5,
                p: 2.5,
                borderTop: `1px solid ${colors.borderLight}`,
                backgroundColor: colors.backgroundSecondary,
              }}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsRoutingModalOpen(false)}
                sx={{
                  textTransform: "none",
                  fontSize: "13px",
                  borderColor: colors.border,
                  color: colors.textSecondary,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  handleApplyGlobalRouting();
                  setIsRoutingModalOpen(false);
                }}
                disabled={globalRoutingTypes.length === 0}
                sx={{
                  backgroundColor: colors.primary,
                  textTransform: "none",
                  fontSize: "13px",
                  "&:hover": { backgroundColor: colors.primaryHover },
                }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SlackConfiguration;
