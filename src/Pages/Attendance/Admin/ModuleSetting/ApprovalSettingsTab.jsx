import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  apiAttendanceApprovalSettings,
  apiUpdateAttendanceApprovalSetting,
} from "../../../../API/attendance";

const TABLE_COLUMNS = [
  { key: "request_name", label: "申請類型", width: "1fr" },
  { key: "flow_summary", label: "簽核流程", width: "3fr" },
  { key: "actions", label: "操作", width: "110px" },
];

function unwrapData(response, fallback = {}) {
  return response?.data?.data ?? response?.data ?? response ?? fallback;
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function roleLabel(role = {}) {
  const roleCode = String(role?.role_code || "").trim();

  const labels = {
    admin: "行政",
    manager: "管理者",
    supervisor: "主管",
    employee: "員工",
  };

  const translated = labels[roleCode];

  if (!translated) {
    return role?.role_name || roleCode || "";
  }

  return `${translated} - ${roleCode}`;
}

function normalizeStep(step = {}) {
  const roleId = Number(step?.role_id || 0);

  return {
    approver_type: String(step?.approver_type || "direct_supervisor"),
    role_id: roleId > 0 ? String(roleId) : "",
  };
}

export default function ApprovalSettingsTab() {
  const [requestTypes, setRequestTypes] = useState({});
  const [approverTypes, setApproverTypes] = useState({});
  const [roles, setRoles] = useState([]);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageErrorText, setPageErrorText] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("view");
  const [requestType, setRequestType] = useState("");
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dialogErrorText, setDialogErrorText] = useState("");

  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const roleMap = useMemo(
    () =>
      roles.reduce((result, role) => {
        result[String(role.role_id)] = role;
        return result;
      }, {}),
    [roles],
  );

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      setLoading(true);
      setPageErrorText("");

      try {
        const response = await apiAttendanceApprovalSettings();
        const data = unwrapData(response, {});

        if (!active) return;

        setRequestTypes(
          data?.request_types && typeof data.request_types === "object"
            ? data.request_types
            : {},
        );
        setApproverTypes(
          data?.approver_types && typeof data.approver_types === "object"
            ? data.approver_types
            : {},
        );
        setRoles(Array.isArray(data?.roles) ? data.roles : []);
        setFlows(Array.isArray(data?.flows) ? data.flows : []);
      } catch (error) {
        if (!active) return;

        setRequestTypes({});
        setApproverTypes({});
        setRoles([]);
        setFlows([]);
        setPageErrorText(getErrorMessage(error, "載入簽核設定失敗。"));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const handleOpenDialog = (flow, mode) => {
    const nextSteps =
      Array.isArray(flow?.steps) && flow.steps.length > 0
        ? flow.steps.map(normalizeStep)
        : [{ approver_type: "direct_supervisor", role_id: "" }];

    setRequestType(String(flow?.request_type || ""));
    setSteps(nextSteps);
    setDialogMode(mode);
    setDialogErrorText("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setRequestType("");
    setSteps([]);
    setDialogMode("view");
    setDialogErrorText("");
  };

  const handleStepTypeChange = (index, value) => {
    setSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index
          ? {
              approver_type: value,
              role_id: value === "system_role" ? step.role_id : "",
            }
          : step,
      ),
    );

    setDialogErrorText("");
  };

  const handleStepRoleChange = (index, value) => {
    setSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index
          ? {
              ...step,
              role_id: value,
            }
          : step,
      ),
    );

    setDialogErrorText("");
  };

  const handleAddStep = () => {
    setSteps((current) => [
      ...current,
      {
        approver_type: "direct_supervisor",
        role_id: "",
      },
    ]);

    setDialogErrorText("");
  };

  const handleDeleteStep = (index) => {
    if (steps.length <= 1) return;

    setSteps((current) =>
      current.filter((_step, stepIndex) => stepIndex !== index),
    );

    setDialogErrorText("");
  };

  const handleMoveStep = (index, direction) => {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= steps.length) {
      return;
    }

    setSteps((current) => {
      const next = [...current];
      const currentStep = next[index];

      next[index] = next[targetIndex];
      next[targetIndex] = currentStep;

      return next;
    });

    setDialogErrorText("");
  };

  const handleSave = async () => {
    if (!requestType || saving) return;

    const invalidRoleStep = steps.find(
      (step) =>
        step.approver_type === "system_role" &&
        !String(step.role_id || "").trim(),
    );

    if (invalidRoleStep) {
      setDialogErrorText("使用「指定系統角色」時，請選擇系統角色。");
      return;
    }

    const payloadSteps = steps.map((step) => ({
      approver_type: step.approver_type,
      ...(step.approver_type === "system_role"
        ? { role_id: Number(step.role_id) }
        : {}),
    }));

    setSaving(true);
    setDialogErrorText("");

    try {
      const response = await apiUpdateAttendanceApprovalSetting(
        requestType,
        payloadSteps,
      );
      const updatedFlow = unwrapData(response, {});

      setFlows((current) =>
        current.map((flow) =>
          flow.request_type === requestType ? updatedFlow : flow,
        ),
      );

      setDialogOpen(false);
      setRequestType("");
      setSteps([]);
      setDialogMode("view");

      setSuccessDialog({
        open: true,
        title: "儲存成功",
        message: "簽核流程已成功儲存。",
      });
    } catch (error) {
      setDialogErrorText(getErrorMessage(error, "儲存簽核流程失敗。"));
    } finally {
      setSaving(false);
    }
  };

  const handleDialogSubmit = () => {
    if (dialogMode === "view") {
      setDialogMode("edit");
      setDialogErrorText("");
      return;
    }

    handleSave();
  };

  const getStepLabel = (step = {}) => {
    const approverType = String(step?.approver_type || "");

    if (approverType === "direct_supervisor") {
      return approverTypes?.direct_supervisor || "直屬主管";
    }

    if (approverType === "system_role") {
      const role = roleMap[String(step?.role_id || "")];
      const roleText = role ? roleLabel(role) : "";

      return roleText
        ? `${approverTypes?.system_role || "指定系統角色"}（${roleText}）`
        : approverTypes?.system_role || "指定系統角色";
    }

    return approverTypes?.[approverType] || approverType || "-";
  };

  const getFlowSummary = (flow = {}) => {
    const flowSteps = Array.isArray(flow?.steps) ? flow.steps : [];

    if (flowSteps.length === 0) {
      return "尚未設定";
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {flowSteps.map((step, index) => (
          <Typography key={index} component="div" sx={{ fontSize: "inherit" }}>
            第 {index + 1} 關：{getStepLabel(step)}
          </Typography>
        ))}
      </Box>
    );
  };

  const selectedFlow = useMemo(
    () => flows.find((flow) => flow.request_type === requestType) || null,
    [flows, requestType],
  );

  const renderValue = (row, column) => {
    if (column.key === "request_name") {
      return row.request_name || requestTypes?.[row.request_type] || "-";
    }

    if (column.key === "flow_summary") {
      return getFlowSummary(row);
    }

    if (column.key === "actions") {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <Tooltip title="查看">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(row, "view")}
              aria-label="查看"
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="編輯">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(row, "edit")}
              aria-label="編輯"
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }

    return row[column.key] || "-";
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "320px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={30} />
      </Box>
    );
  }

  return (
    <>
      <Box>
        <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
          簽核設定
        </Typography>

        <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
          請假、加班、忘打卡、公出及出差簽核流程設定
        </Typography>

        {pageErrorText ? (
          <Alert severity="error" sx={{ mt: "16px" }}>
            {pageErrorText}
          </Alert>
        ) : null}

        <Box sx={{ mt: "18px" }}>
          <ResponsiveAttendanceTable
            columns={TABLE_COLUMNS}
            rows={flows}
            getRowKey={(row) => row.request_type}
            mobileCardTitleKey="request_name"
            emptyText="查無簽核設定"
            renderValue={renderValue}
            fitToContainer
          />
        </Box>
      </Box>

      <FormDialog
        open={dialogOpen}
        title={`${selectedFlow?.request_name || requestTypes?.[requestType] || ""}簽核設定`}
        submitting={saving}
        submitLabel={dialogMode === "view" ? "編輯" : "儲存"}
        cancelLabel={dialogMode === "view" ? "關閉" : "取消"}
        maxWidth="md"
        onClose={handleCloseDialog}
        onSubmit={handleDialogSubmit}
      >
        {dialogErrorText ? (
          <Alert severity="error">
            {dialogErrorText}
          </Alert>
        ) : null}

        {dialogMode === "edit" ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<AddOutlinedIcon />}
              onClick={handleAddStep}
              disabled={saving}
            >
              新增簽核關卡
            </Button>
          </Box>
        ) : null}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {steps.map((step, index) => (
            <Paper
              key={`${requestType}-${index}`}
              variant="outlined"
              sx={{
                borderColor: "#d1d5db",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: { xs: "14px", sm: "18px" },
                  py: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  bgcolor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  第 {index + 1} 關
                </Typography>

                {dialogMode === "edit" ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Tooltip title="往前移">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveStep(index, -1)}
                          disabled={index === 0 || saving}
                        >
                          <KeyboardArrowUpIcon />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title="往後移">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveStep(index, 1)}
                          disabled={index === steps.length - 1 || saving}
                        >
                          <KeyboardArrowDownIcon />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip
                      title={
                        steps.length <= 1
                          ? "簽核流程至少需要一個簽核關卡"
                          : "刪除"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteStep(index)}
                          disabled={steps.length <= 1 || saving}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                ) : null}
              </Box>

              <Box
                sx={{
                  p: { xs: "14px", sm: "18px" },
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md:
                      step.approver_type === "system_role"
                        ? "minmax(0, 1fr) minmax(0, 1fr)"
                        : "minmax(0, 1fr)",
                  },
                  gap: "14px",
                }}
              >
                <TextField
                  select
                  label="簽核人類型"
                  value={step.approver_type}
                  onChange={(event) =>
                    handleStepTypeChange(index, event.target.value)
                  }
                  size="small"
                  fullWidth
                  disabled={dialogMode === "view" || saving}
                >
                  {Object.entries(approverTypes).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>

                {step.approver_type === "system_role" ? (
                  <TextField
                    select
                    label="系統角色"
                    value={step.role_id}
                    onChange={(event) =>
                      handleStepRoleChange(index, event.target.value)
                    }
                    size="small"
                    fullWidth
                    disabled={dialogMode === "view" || saving}
                  >
                    {roles.map((role) => (
                      <MenuItem
                        key={role.role_id}
                        value={String(role.role_id)}
                      >
                        {roleLabel(role)}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : null}
              </Box>
            </Paper>
          ))}
        </Box>

        {selectedFlow ? (
          <Typography
            sx={{
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            目前設定：{selectedFlow.request_name}共 {steps.length} 個簽核關卡
          </Typography>
        ) : null}
      </FormDialog>

      <SuccessDialog
        open={successDialog.open}
        title={successDialog.title}
        message={successDialog.message}
        onClose={() =>
          setSuccessDialog({
            open: false,
            title: "",
            message: "",
          })
        }
      />
    </>
  );
}