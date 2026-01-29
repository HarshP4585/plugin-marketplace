/**
 * Control Item Drawer
 *
 * Drawer for viewing and editing custom framework control items (Level 2 items).
 * Allows users to update status, owner, reviewer, due date, implementation details, and evidence.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  X,
  Save,
  FileText,
  AlertTriangle,
  Plus,
  Trash2,
  Link as LinkIcon,
  HelpCircle,
} from "lucide-react";
import {
  colors,
  textColors,
  bgColors,
  borderColors,
  statusOptions,
  StatusType,
  statusColors,
} from "./theme";

interface ControlItemDrawerProps {
  open: boolean;
  onClose: () => void;
  item: Level2Item | null;
  frameworkData: {
    level_1_name: string;
    level_2_name: string;
    level_3_name?: string;
  } | null;
  projectId: number;
  onSave: () => void;
  apiServices?: {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, data?: any) => Promise<any>;
    patch: (url: string, data?: any) => Promise<any>;
  };
}

interface Level2Item {
  id: number;
  title: string;
  description?: string;
  summary?: string;
  questions?: string[];
  evidence_examples?: string[];
  order_no: number;
  impl_id?: number;
  status?: string;
  owner?: number;
  owner_name?: string;
  owner_surname?: string;
  reviewer?: number;
  reviewer_name?: string;
  reviewer_surname?: string;
  approver?: number;
  approver_name?: string;
  approver_surname?: string;
  due_date?: string;
  implementation_details?: string;
  evidence_links?: EvidenceLink[];
  linked_risks?: LinkedRisk[];
  items?: Level3Item[];
}

interface Level3Item {
  id: number;
  title: string;
  description?: string;
  order_no: number;
  impl_id?: number;
  status?: string;
  owner?: number;
  due_date?: string;
}

interface EvidenceLink {
  id?: number;
  name: string;
  url: string;
  type?: string;
}

interface LinkedRisk {
  id: number;
  title: string;
  severity?: string;
}

interface User {
  id: number;
  name: string;
  surname: string;
}

export const ControlItemDrawer: React.FC<ControlItemDrawerProps> = ({
  open,
  onClose,
  item,
  frameworkData,
  onSave,
  apiServices,
}) => {
  const [formData, setFormData] = useState({
    status: "Not started",
    owner: "",
    reviewer: "",
    approver: "",
    due_date: null as Date | null,
    implementation_details: "",
    evidence_links: [] as EvidenceLink[],
  });
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEvidence, setNewEvidence] = useState({ name: "", url: "" });

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
      return { data: await response.json(), status: response.status };
    },
  };

  // Load users for owner/reviewer dropdowns
  const loadUsers = useCallback(async () => {
    try {
      const response = await api.get("/users");
      const userData = response.data.data || response.data;
      if (Array.isArray(userData)) {
        setUsers(userData);
      }
    } catch (err) {
      console.log("[ControlItemDrawer] Error loading users:", err);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open, loadUsers]);

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        status: item.status || "Not started",
        owner: item.owner?.toString() || "",
        reviewer: item.reviewer?.toString() || "",
        approver: item.approver?.toString() || "",
        due_date: item.due_date ? new Date(item.due_date) : null,
        implementation_details: item.implementation_details || "",
        evidence_links: item.evidence_links || [],
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!item?.impl_id) {
      setError("Cannot save: Implementation ID not found");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        status: formData.status,
        implementation_details: formData.implementation_details,
        evidence_links: formData.evidence_links,
      };

      if (formData.owner) {
        payload.owner = parseInt(formData.owner);
      } else {
        payload.owner = null;
      }

      if (formData.reviewer) {
        payload.reviewer = parseInt(formData.reviewer);
      } else {
        payload.reviewer = null;
      }

      if (formData.approver) {
        payload.approver = parseInt(formData.approver);
      } else {
        payload.approver = null;
      }

      if (formData.due_date) {
        payload.due_date = formData.due_date.toISOString().split("T")[0];
      } else {
        payload.due_date = null;
      }

      const response = await api.patch(
        `/plugins/custom-framework-import/level2/${item.impl_id}`,
        payload
      );

      if (response.status === 200) {
        onSave();
        onClose();
      } else {
        setError("Failed to save changes");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleAddEvidence = () => {
    if (newEvidence.name && newEvidence.url) {
      setFormData((prev) => ({
        ...prev,
        evidence_links: [...prev.evidence_links, { ...newEvidence }],
      }));
      setNewEvidence({ name: "", url: "" });
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      evidence_links: prev.evidence_links.filter((_, i) => i !== index),
    }));
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as StatusType]?.color || "#94a3b8";
  };

  const getStatusBg = (status: string) => {
    return statusColors[status as StatusType]?.bg || "#f1f5f9";
  };

  if (!item) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: "100%", sm: 600, md: 700 }, maxWidth: "100%" },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2.5,
          borderBottom: `1px solid ${borderColors.light}`,
          background: bgColors.modalHeader,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: "15px", fontWeight: 600, color: textColors.primary }}>
            {frameworkData?.level_2_name || "Control"} Details
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={20} color={textColors.muted} />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Title and Description */}
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {item.title}
            </Typography>
            {item.description && (
              <Typography variant="body2" color="text.secondary">
                {item.description}
              </Typography>
            )}
          </Box>

          {/* Questions */}
          {item.questions && item.questions.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f8fafc" }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <HelpCircle size={16} />
                Key Questions
              </Typography>
              <List dense sx={{ pl: 2 }}>
                {item.questions.map((q, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5, px: 0 }}>
                    <ListItemText
                      primary={`${idx + 1}. ${q}`}
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Evidence Examples */}
          {item.evidence_examples && item.evidence_examples.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FileText size={16} />
                Evidence Examples
              </Typography>
              <List dense sx={{ pl: 2 }}>
                {item.evidence_examples.map((e, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5, px: 0 }}>
                    <ListItemText
                      primary={`• ${e}`}
                      primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          <Divider />

          {/* Status */}
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: getStatusColor(status),
                      }}
                    />
                    {status}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Owner */}
          <FormControl fullWidth size="small">
            <InputLabel>Owner</InputLabel>
            <Select
              value={formData.owner}
              label="Owner"
              onChange={(e) => setFormData((prev) => ({ ...prev, owner: e.target.value }))}
            >
              <MenuItem value="">
                <em>Not assigned</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id.toString()}>
                  {user.name} {user.surname}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Reviewer */}
          <FormControl fullWidth size="small">
            <InputLabel>Reviewer</InputLabel>
            <Select
              value={formData.reviewer}
              label="Reviewer"
              onChange={(e) => setFormData((prev) => ({ ...prev, reviewer: e.target.value }))}
            >
              <MenuItem value="">
                <em>Not assigned</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id.toString()}>
                  {user.name} {user.surname}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Approver */}
          <FormControl fullWidth size="small">
            <InputLabel>Approver</InputLabel>
            <Select
              value={formData.approver}
              label="Approver"
              onChange={(e) => setFormData((prev) => ({ ...prev, approver: e.target.value }))}
            >
              <MenuItem value="">
                <em>Not assigned</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id.toString()}>
                  {user.name} {user.surname}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Due Date */}
          <TextField
            label="Due Date"
            type="date"
            size="small"
            fullWidth
            value={formData.due_date ? formData.due_date.toISOString().split("T")[0] : ""}
            onChange={(e) => setFormData((prev) => ({
              ...prev,
              due_date: e.target.value ? new Date(e.target.value) : null
            }))}
            InputLabelProps={{ shrink: true }}
          />

          {/* Implementation Details */}
          <TextField
            label="Implementation Details"
            multiline
            rows={4}
            fullWidth
            size="small"
            value={formData.implementation_details}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, implementation_details: e.target.value }))
            }
            placeholder="Describe how this control is implemented..."
          />

          {/* Evidence Links */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LinkIcon size={16} />
              Evidence Links
            </Typography>

            {formData.evidence_links.length > 0 && (
              <List dense sx={{ mb: 2 }}>
                {formData.evidence_links.map((link, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ mb: 1 }}>
                    <ListItem>
                      <ListItemText
                        primary={link.name}
                        secondary={link.url}
                        primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                        secondaryTypographyProps={{ variant: "caption", sx: { wordBreak: "break-all" } }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveEvidence(idx)}
                          sx={{ color: colors.error }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}

            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                placeholder="Evidence name"
                value={newEvidence.name}
                onChange={(e) => setNewEvidence((prev) => ({ ...prev, name: e.target.value }))}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                placeholder="URL"
                value={newEvidence.url}
                onChange={(e) => setNewEvidence((prev) => ({ ...prev, url: e.target.value }))}
                sx={{ flex: 2 }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddEvidence}
                disabled={!newEvidence.name || !newEvidence.url}
                sx={{ minWidth: 40 }}
              >
                <Plus size={18} />
              </Button>
            </Box>
          </Box>

          {/* Linked Risks */}
          {item.linked_risks && item.linked_risks.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AlertTriangle size={16} color={colors.warning} />
                Linked Risks ({item.linked_risks.length})
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {item.linked_risks.map((risk) => (
                  <Chip
                    key={risk.id}
                    label={risk.title}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: colors.warning, color: textColors.primary }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Level 3 Items (Sub-controls) */}
          {item.items && item.items.length > 0 && frameworkData?.level_3_name && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {frameworkData.level_3_name}s ({item.items.length})
              </Typography>
              <List dense>
                {item.items.map((subItem) => (
                  <Paper key={subItem.id} variant="outlined" sx={{ mb: 1 }}>
                    <ListItem>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: getStatusColor(subItem.status || "Not started"),
                          mr: 1.5,
                        }}
                      />
                      <ListItemText
                        primary={subItem.title}
                        secondary={subItem.description}
                        primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                      <Chip
                        label={subItem.status || "Not started"}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          bgcolor: getStatusBg(subItem.status || "Not started"),
                          color: getStatusColor(subItem.status || "Not started"),
                        }}
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          p: 2.5,
          borderTop: `1px solid ${borderColors.light}`,
          bgcolor: bgColors.subtle,
        }}
      >
        <Button variant="outlined" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
          sx={{
            bgcolor: colors.primary,
            "&:hover": { bgcolor: colors.primaryHover },
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Box>
    </Drawer>
  );
};

export default ControlItemDrawer;
