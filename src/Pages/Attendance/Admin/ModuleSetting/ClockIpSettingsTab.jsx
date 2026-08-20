import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  apiAttendancePunchIpSettings,
  apiAttendancePunchLocations,
  apiCreateAttendancePunchIpRule,
  apiDeleteAttendancePunchIpRule,
  apiUpdateAttendancePunchIpRule,
  apiUpdateAttendancePunchIpSettings,
} from "../../../../API/attendance";

const INITIAL_FORM = {
  restrict_ip: true,
  ip_start: "",
  ip_end: "",
  location_id: "",
};

const TABLE_COLUMNS = [
  { key: "ip_address", label: "IP位址", width: "1.8fr" },
  { key: "location_name", label: "公司地點", width: "1.4fr" },
  { key: "actions", label: "設定", width: "100px" },
];

function unwrapData(response, fallback = null) {
  return response?.data?.data ?? response?.data ?? response ?? fallback;
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function isValidIpv4(value) {
  const parts = String(value || "").trim().split(".");
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const number = Number(part);
    return number >= 0 && number <= 255;
  });
}

function ipv4ToNumber(value) {
  return String(value)
    .split(".")
    .reduce((result, part) => result * 256 + Number(part), 0);
}

function formatIpAddress(row) {
  if (!Number(row.restrict_ip || 0)) {
    return "0.0.0.0 ~ 255.255.255.255";
  }

  if (row.ip_start === row.ip_end) {
    return row.ip_start;
  }

  return `${row.ip_start} ~ ${row.ip_end}`;
}

export default function ClockIpSettingsTab() {
  const [appIpRestrictionEnabled, setAppIpRestrictionEnabled] = useState(false);
  const [rows, setRows] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [deletingId, setDeletingId] = useState(0);
  const [pageErrorText, setPageErrorText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrorText, setFormErrorText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const loadData = async () => {
    setLoading(true);
    setPageErrorText("");

    try {
      const [settingsResponse, locationsResponse] = await Promise.all([
        apiAttendancePunchIpSettings(),
        apiAttendancePunchLocations(),
      ]);

      const settings = unwrapData(settingsResponse, {});
      const locationRows = unwrapData(locationsResponse, []);

      setAppIpRestrictionEnabled(Boolean(settings?.enabled));
      setRows(Array.isArray(settings?.rules) ? settings.rules : []);
      setLocations(
        (Array.isArray(locationRows) ? locationRows : []).filter(
          (item) => String(item?.status || "") === "啟用",
        ),
      );
    } catch (error) {
      console.error("Failed to load punch IP settings:", error);
      setPageErrorText(getErrorMessage(error, "IP設定載入失敗。"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const displayRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        ip_address: formatIpAddress(row),
      })),
    [rows],
  );

  const handleGlobalRestrictionChange = async (checked) => {
    if (savingGlobal) return;

    const previousValue = appIpRestrictionEnabled;
    setAppIpRestrictionEnabled(checked);
    setSavingGlobal(true);
    setPageErrorText("");

    try {
      const response = await apiUpdateAttendancePunchIpSettings(checked);
      const settings = unwrapData(response, {});
      setAppIpRestrictionEnabled(Boolean(settings?.enabled));
      setRows(Array.isArray(settings?.rules) ? settings.rules : []);
    } catch (error) {
      console.error("Failed to update punch IP setting:", error);
      setAppIpRestrictionEnabled(previousValue);
      setPageErrorText(getErrorMessage(error, "APP定位打卡限制IP更新失敗。"));
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRow(null);
    setForm(INITIAL_FORM);
    setFormErrorText("");
    setFormOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditingRow(row);
    setForm({
      restrict_ip: Number(row.restrict_ip || 0) === 1,
      ip_start: String(row.ip_start || ""),
      ip_end: String(row.ip_end || ""),
      location_id: String(row.location_id || ""),
    });
    setFormErrorText("");
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (submitting) return;

    setFormOpen(false);
    setEditingRow(null);
    setForm(INITIAL_FORM);
    setFormErrorText("");
  };

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.location_id) {
      return "請選擇公司地點。";
    }

    if (!form.restrict_ip) {
      return "";
    }

    if (!isValidIpv4(form.ip_start)) {
      return "請輸入正確的起始IP位址。";
    }

    if (!isValidIpv4(form.ip_end)) {
      return "請輸入正確的結束IP位址。";
    }

    if (ipv4ToNumber(form.ip_start) > ipv4ToNumber(form.ip_end)) {
      return "起始IP位址不可大於結束IP位址。";
    }

    return "";
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const validationError = validateForm();

    if (validationError) {
      setFormErrorText(validationError);
      return;
    }

    setSubmitting(true);
    setFormErrorText("");

    const payload = {
      location_id: Number(form.location_id || 0),
      restrict_ip: form.restrict_ip ? 1 : 0,
      ip_start: form.restrict_ip ? form.ip_start.trim() : "",
      ip_end: form.restrict_ip ? form.ip_end.trim() : "",
    };

    try {
      if (editingRow) {
        await apiUpdateAttendancePunchIpRule(editingRow.ip_rule_id, payload);
      } else {
        await apiCreateAttendancePunchIpRule(payload);
      }

      await loadData();

      const message = editingRow
        ? "IP設定已成功更新。"
        : "IP設定已成功新增。";

      setFormOpen(false);
      setEditingRow(null);
      setForm(INITIAL_FORM);
      setSuccessDialog({
        open: true,
        title: "操作成功",
        message,
      });
    } catch (error) {
      console.error("Failed to save punch IP rule:", error);
      setFormErrorText(getErrorMessage(error, "IP設定儲存失敗。"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    const ipRuleId = Number(row.ip_rule_id || 0);

    if (ipRuleId <= 0 || deletingId > 0) return;

    const confirmed = window.confirm(`確定要刪除「${formatIpAddress(row)}」嗎？`);
    if (!confirmed) return;

    setDeletingId(ipRuleId);
    setPageErrorText("");

    try {
      await apiDeleteAttendancePunchIpRule(ipRuleId);
      await loadData();

      setSuccessDialog({
        open: true,
        title: "刪除成功",
        message: "IP設定已成功刪除。",
      });
    } catch (error) {
      console.error("Failed to delete punch IP rule:", error);
      setPageErrorText(getErrorMessage(error, "IP設定刪除失敗。"));
    } finally {
      setDeletingId(0);
    }
  };

  const renderValue = (row, column) => {
    if (column.key === "actions") {
      return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
          <Tooltip title="編輯">
            <IconButton size="small" onClick={() => handleOpenEdit(row)} aria-label="編輯">
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="刪除">
            <span>
              <IconButton
                size="small"
                disabled={deletingId === Number(row.ip_rule_id || 0)}
                onClick={() => handleDelete(row)}
                aria-label="刪除"
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      );
    }

    return row[column.key] ?? "-";
  };

  return (
    <Box>
      <Box
        sx={{
          mb: "18px",
          display: "flex",
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: "12px",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
            IP設定
          </Typography>

          <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
            設定APP定位打卡可使用的固定IP位址。
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={handleOpenCreate}>
          新增
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: "16px" }}>
        IP位址必須是對外固定IP，而非內部區網IP。
      </Alert>

      {pageErrorText ? (
        <Alert severity="error" sx={{ mb: "16px" }}>
          {pageErrorText}
        </Alert>
      ) : null}

      <Box sx={{ mb: "16px", px: "14px", py: "10px", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
        <FormControlLabel
          control={
            <Switch
              checked={appIpRestrictionEnabled}
              disabled={savingGlobal || loading}
              onChange={(event) => handleGlobalRestrictionChange(event.target.checked)}
            />
          }
          label="APP定位打卡限制IP"
        />
      </Box>

      {loading ? (
        <Box sx={{ minHeight: "180px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <ResponsiveAttendanceTable
          columns={TABLE_COLUMNS}
          rows={displayRows}
          getRowKey={(row) => row.ip_rule_id}
          mobileCardTitleKey="ip_address"
          desktopMinWidth="680px"
          emptyText="查無IP設定"
          renderValue={renderValue}
          fitToContainer
        />
      )}

      <FormDialog
        open={formOpen}
        title={editingRow ? "編輯IP" : "新增IP"}
        submitting={submitting}
        submitLabel="儲存"
        maxWidth="sm"
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      >
        {formErrorText ? <Alert severity="error">{formErrorText}</Alert> : null}

        <FormControlLabel
          control={
            <Switch
              checked={form.restrict_ip}
              onChange={(event) => handleChange("restrict_ip", event.target.checked)}
            />
          }
          label="限制IP打卡位址"
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "minmax(0, 1fr) auto minmax(0, 1fr)",
            },
            alignItems: "center",
            gap: "10px",
          }}
        >
          <TextField
            label="允許IP位址"
            value={form.restrict_ip ? form.ip_start : "0.0.0.0"}
            onChange={(event) => handleChange("ip_start", event.target.value)}
            size="small"
            disabled={!form.restrict_ip}
            fullWidth
          />

          <Typography sx={{ display: { xs: "none", sm: "block" }, color: "#6b7280" }}>
            ~
          </Typography>

          <TextField
            label="允許IP位址"
            value={form.restrict_ip ? form.ip_end : "255.255.255.255"}
            onChange={(event) => handleChange("ip_end", event.target.value)}
            size="small"
            disabled={!form.restrict_ip}
            fullWidth
          />
        </Box>

        <TextField
          select
          label="公司地點"
          value={form.location_id}
          onChange={(event) => handleChange("location_id", event.target.value)}
          size="small"
          fullWidth
          required
        >
          {locations.map((location) => (
            <MenuItem key={location.location_id} value={String(location.location_id)}>
              {location.location_name}
            </MenuItem>
          ))}
        </TextField>
      </FormDialog>

      <SuccessDialog
        open={successDialog.open}
        title={successDialog.title}
        message={successDialog.message}
        onClose={() => setSuccessDialog({ open: false, title: "", message: "" })}
      />
    </Box>
  );
}