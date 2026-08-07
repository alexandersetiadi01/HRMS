import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";

import {
  apiAttendanceAdminMeta,
  apiAttendancePunches,
  apiCreateAttendancePunch,
  apiUpdateAttendancePunch,
  apiDeleteAttendancePunch,
  apiAttendancePunchMaintenanceLogs,
} from "../../../../API/attendance";
import { renderDateField } from "../../../../Components/GlobalComponent";
import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import { MobileTimeSelect } from "../../../../Utils/Attendance/SharedForm";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";

const INITIAL_FILTERS = {
  unit_id: "",
  employee_id: "",
  date_from: "",
  date_to: "",
  punch_type: "",
  method: "",
  location: "",
};

const PUNCH_TYPE_OPTIONS = [
  { value: "", label: "全部" },
  { value: "in", label: "上班" },
  { value: "out", label: "下班" },
  { value: "break_out", label: "休息開始" },
  { value: "break_in", label: "休息結束" },
];

const PUNCH_METHOD_OPTIONS = [
  { value: "web", label: "網頁" },
  { value: "app", label: "應用程式" },
  { value: "gps", label: "GPS" },
  { value: "ip", label: "IP" },
  { value: "manual", label: "手動" },
  { value: "missed_punch", label: "忘打卡" },
];

const PUNCH_LOCATION_OPTIONS = [
  {
    value: "office",
    label: "公司",
    latitude: 25.0729,
    longitude: 121.3615,
  },
];

const PUNCH_METHOD_FILTER_OPTIONS = [
  { value: "", label: "全部方式" },
  ...PUNCH_METHOD_OPTIONS,
];

const PUNCH_LOCATION_FILTER_OPTIONS = [
  { value: "", label: "全部地點" },
  { value: "office", label: "公司" },
];

const TABLE_COLUMNS = [
  { key: "employee", label: "員工", width: "1.4fr" },
  {
    key: "punch_time",
    label: "打卡時間",
    width: "1.3fr",
    desktopWhiteSpace: "nowrap",
  },
  { key: "punch_type", label: "類型", width: "0.8fr" },
  { key: "method", label: "方式", width: "0.8fr" },
  { key: "location", label: "地點", width: "1fr" },
  { key: "actions", label: "操作", width: "120px" },
];

const HISTORY_COLUMNS = [
  { key: "created_at", label: "維護時間", width: "1.2fr" },
  { key: "action_type", label: "動作", width: "0.7fr" },
  { key: "operator_name", label: "操作人", width: "1fr" },
  { key: "change", label: "異動內容", width: "1.8fr" },
  { key: "reason", label: "維護原因", width: "1.5fr" },
];

function getItems(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function formatPunchType(value) {
  const map = {
    in: "上班",
    out: "下班",
    break_out: "休息開始",
    break_in: "休息結束",
    上班: "上班",
    下班: "下班",
  };

  return map[value] || value || "-";
}

function formatDateTime(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "-";
  }

  return raw.replace(/-/g, "/").slice(0, 16);
}

function getPunchSnapshotText(snapshot) {
  if (!snapshot) {
    return "-";
  }

  const parts = [
    formatDateTime(snapshot.punch_time),
    formatPunchType(snapshot.punch_type),
    snapshot.method || "",
    snapshot.location_label || "",
  ].filter(Boolean);

  return parts.join("｜") || "-";
}

function getMaintenanceChangeText(row) {
  if (row.action_type === "新增") {
    return `新增：${getPunchSnapshotText(row.after_snapshot)}`;
  }

  if (row.action_type === "刪除") {
    return `刪除：${getPunchSnapshotText(row.before_snapshot)}`;
  }

  if (row.action_type === "修改") {
    return (
      `${getPunchSnapshotText(row.before_snapshot)}` +
      ` → ${getPunchSnapshotText(row.after_snapshot)}`
    );
  }

  return "-";
}

const EMPTY_PUNCH_FORM = {
  employee_id: "",
  punch_date: "",
  punch_hour: "09",
  punch_minute: "00",
  punch_type: "in",
  method: "manual",
  location_label: "office",
  maintenance_reason: "",
};

function getToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 10);
}

function punchRowToForm(row) {
  const punchTime = String(row?.punch_time || "");
  const timeMatch = punchTime.match(/(\d{2}):(\d{2})/);

  return {
    employee_id: String(row?.employee_id || ""),
    punch_date: punchTime.slice(0, 10),
    punch_hour: timeMatch?.[1] || "09",
    punch_minute: timeMatch?.[2] || "00",
    punch_type: String(row?.punch_type || "in"),
    method: String(row?.method || "manual"),
    location_label:
      String(row?.location_label || "") === "公司"
        ? "office"
        : String(row?.location_label || "office"),
    maintenance_reason: "",
  };
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function PunchRecordsTab() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);

  const [unitOptions, setUnitOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [punchForm, setPunchForm] = useState({
    ...EMPTY_PUNCH_FORM,
    punch_date: getToday(),
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteRow, setDeleteRow] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [historyRow, setHistoryRow] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const filteredEmployeeOptions = useMemo(() => {
    if (!filters.unit_id) {
      return employeeOptions;
    }

    return employeeOptions.filter(
      (employee) => String(employee.unit_id || "") === String(filters.unit_id),
    );
  }, [employeeOptions, filters.unit_id]);

  const employeeMap = useMemo(
    () =>
      new Map(
        employeeOptions.map((employee) => [
          Number(employee.employee_id || 0),
          employee,
        ]),
      ),
    [employeeOptions],
  );

  const displayRows = useMemo(() => {
    return rows
      .map((row) => {
        const employee = employeeMap.get(Number(row.employee_id || 0));

        return {
          ...row,
          employee:
            row.employee_no && row.display_name
              ? `${row.employee_no}/${row.display_name}`
              : employee?.label ||
                row.display_name ||
                row.employee_no ||
                `#${row.employee_id}`,
          unit_id: Number(row.unit_id || employee?.unit_id || 0),
        };
      })
      .filter((row) => {
        if (!appliedFilters.unit_id) {
          return true;
        }

        return String(row.unit_id || "") === String(appliedFilters.unit_id);
      });
  }, [rows, employeeMap, appliedFilters.unit_id]);

  const loadMeta = useCallback(async () => {
    const result = await apiAttendanceAdminMeta();

    setUnitOptions([
      { value: "", label: "全部單位" },
      ...(Array.isArray(result?.unitOptions) ? result.unitOptions : []),
    ]);

    setEmployeeOptions(
      Array.isArray(result?.employeeOptions) ? result.employeeOptions : [],
    );
  }, []);

  const loadRows = useCallback(async (nextFilters) => {
    const result = await apiAttendancePunches({
      employee_id: nextFilters.employee_id || undefined,
      date_from: nextFilters.date_from || undefined,
      date_to: nextFilters.date_to || undefined,
      punch_type: nextFilters.punch_type || undefined,
      method: nextFilters.method || undefined,
      location: nextFilters.location || undefined,
    });

    setRows(getItems(result));
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorText("");

      try {
        await Promise.all([loadMeta(), loadRows(INITIAL_FILTERS)]);
      } catch (error) {
        console.error(error);

        if (active) {
          setErrorText("無法載入打卡紀錄。");
          setRows([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [loadMeta, loadRows]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "unit_id") {
        next.employee_id = "";
      }

      return next;
    });
  };

  const handleSearch = async () => {
    setLoading(true);
    setErrorText("");

    try {
      setAppliedFilters(filters);
      await loadRows(filters);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入打卡紀錄。");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setLoading(true);
    setErrorText("");

    try {
      await loadRows(INITIAL_FILTERS);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入打卡紀錄。");
    } finally {
      setLoading(false);
    }
  };

  const showSuccessDialog = (title, message) => {
    setSuccessDialog({ open: true, title, message });
  };

  const handleCloseSuccessDialog = () => {
    setSuccessDialog((current) => ({ ...current, open: false }));
  };

  const handleCreate = () => {
    setEditingRow(null);
    setPunchForm({
      ...EMPTY_PUNCH_FORM,
      punch_date: getToday(),
    });
    setFormError("");
    setFormOpen(true);
  };

  const handleEdit = (row) => {
    setEditingRow(row);
    setPunchForm(punchRowToForm(row));
    setFormError("");
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (submitting) {
      return;
    }

    setFormOpen(false);
    setEditingRow(null);
    setFormError("");
  };

  const handlePunchFormChange = (field, value) => {
    setPunchForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmitPunch = async () => {
    if (!punchForm.employee_id) {
      setFormError("請選擇員工。");
      return;
    }

    if (!punchForm.punch_date) {
      setFormError("請選擇打卡日期。");
      return;
    }

    if (!punchForm.maintenance_reason.trim()) {
      setFormError("請輸入維護原因。");
      return;
    }

    const punchTime =
      `${punchForm.punch_date} ` +
      `${punchForm.punch_hour}:${punchForm.punch_minute}:00`;

    const selectedLocation =
      PUNCH_LOCATION_OPTIONS.find(
        (option) => option.value === punchForm.location_label,
      ) || PUNCH_LOCATION_OPTIONS[0];

    const payload = {
      employee_id: Number(punchForm.employee_id),
      punch_time: punchTime,
      punch_type: punchForm.punch_type,
      method: punchForm.method,
      location_label: selectedLocation.value,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      maintenance_reason: punchForm.maintenance_reason.trim(),
    };

    setSubmitting(true);
    setFormError("");

    try {
      if (editingRow) {
        await apiUpdateAttendancePunch(editingRow.punch_id, payload);
      } else {
        await apiCreateAttendancePunch(payload);
      }

      setFormOpen(false);
      setEditingRow(null);

      showSuccessDialog(
        editingRow ? "更新成功" : "新增成功",
        editingRow ? "打卡紀錄已成功更新。" : "打卡紀錄已成功新增。",
      );

      await loadRows(appliedFilters);
    } catch (error) {
      console.error(error);
      setFormError(
        getErrorMessage(
          error,
          editingRow ? "更新打卡紀錄失敗。" : "新增打卡紀錄失敗。",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (row) => {
    setDeleteRow(row);
    setDeleteReason("");
    setDeleteError("");
  };

  const handleCloseDelete = () => {
    if (deleting) {
      return;
    }

    setDeleteRow(null);
    setDeleteReason("");
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteRow?.punch_id) {
      return;
    }

    if (!deleteReason.trim()) {
      setDeleteError("請輸入維護原因。");
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      await apiDeleteAttendancePunch(deleteRow.punch_id, deleteReason.trim());

      setDeleteRow(null);
      setDeleteReason("");
      setDeleteError("");

      showSuccessDialog("刪除成功", "打卡紀錄已成功刪除。");

      await loadRows(appliedFilters);
    } catch (error) {
      console.error(error);
      setDeleteError(getErrorMessage(error, "刪除打卡紀錄失敗。"));
    } finally {
      setDeleting(false);
    }
  };

  const handleHistory = async (row) => {
    setHistoryRow(row);
    setHistoryRows([]);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const result = await apiAttendancePunchMaintenanceLogs({
        punch_id: row.punch_id,
      });

      setHistoryRows(getItems(result));
    } catch (error) {
      console.error(error);
      setHistoryError(getErrorMessage(error, "無法載入打卡維護歷程。"));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistory = () => {
    if (historyLoading) {
      return;
    }

    setHistoryRow(null);
    setHistoryRows([]);
    setHistoryError("");
  };

  const renderTableValue = (row, column) => {
    if (column.key === "punch_time") {
      return formatDateTime(row.punch_time);
    }

    if (column.key === "punch_type") {
      return formatPunchType(row.punch_type);
    }

    if (column.key === "method") {
      return row.method_label || row.method || "-";
    }

    if (column.key === "location") {
      return row.location_label_display || row.location_label || "-";
    }

    if (column.key === "actions") {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <Tooltip title="編輯">
            <IconButton size="small" onClick={() => handleEdit(row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="維護歷程">
            <IconButton size="small" onClick={() => handleHistory(row)}>
              <HistoryOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="刪除">
            <IconButton size="small" onClick={() => handleDelete(row)}>
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }

    return row[column.key] || "-";
  };

  const renderHistoryValue = (row, column) => {
    if (column.key === "created_at") {
      return formatDateTime(row.created_at);
    }

    if (column.key === "operator_name") {
      return (
        row.operator_name ||
        (row.operator_user_id ? `使用者 #${row.operator_user_id}` : "-")
      );
    }

    if (column.key === "change") {
      return getMaintenanceChangeText(row);
    }

    return row[column.key] || "-";
  };

  return (
    <Box sx={{ p: { xs: "14px", sm: "20px" } }}>
      <Box
        sx={{
          mb: "18px",
          display: "flex",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          alignItems: {
            xs: "stretch",
            sm: "center",
          },
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            打卡紀錄
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            查詢及維護員工打卡紀錄
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={handleCreate}
        >
          新增打卡
        </Button>
      </Box>

      <Box sx={{ mb: "18px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: "14px",
            alignItems: "end",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              單位
            </Typography>

            <SelectField
              value={filters.unit_id}
              onChange={(value) => handleFilterChange("unit_id", value)}
              options={unitOptions}
              displayEmpty
              fullWidth
              height="38px"
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              員工
            </Typography>

            <SelectField
              value={filters.employee_id}
              onChange={(value) => handleFilterChange("employee_id", value)}
              options={[
                { value: "", label: "全部員工" },
                ...filteredEmployeeOptions,
              ]}
              displayEmpty
              fullWidth
              height="38px"
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              打卡類型
            </Typography>

            <SelectField
              value={filters.punch_type}
              onChange={(value) => handleFilterChange("punch_type", value)}
              options={PUNCH_TYPE_OPTIONS}
              displayEmpty
              fullWidth
              height="38px"
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              打卡方式
            </Typography>

            <SelectField
              value={filters.method}
              onChange={(value) => handleFilterChange("method", value)}
              options={PUNCH_METHOD_FILTER_OPTIONS}
              displayEmpty
              fullWidth
              height="38px"
            />
          </Box>
        </Box>

        <Box
          sx={{
            mt: "14px",
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: "14px",
            alignItems: "end",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              開始日期
            </Typography>

            <Box sx={{ width: "100%", "& > *": { width: "100% !important" } }}>
              {renderDateField(filters.date_from, (event) =>
                handleFilterChange("date_from", event.target.value),
              )}
            </Box>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              結束日期
            </Typography>

            <Box sx={{ width: "100%", "& > *": { width: "100% !important" } }}>
              {renderDateField(filters.date_to, (event) =>
                handleFilterChange("date_to", event.target.value),
              )}
            </Box>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              地點
            </Typography>

            <SelectField
              value={filters.location}
              onChange={(value) => handleFilterChange("location", value)}
              options={PUNCH_LOCATION_FILTER_OPTIONS}
              displayEmpty
              fullWidth
              height="38px"
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: { xs: "stretch", md: "flex-end" },
              alignItems: "flex-end",
            }}
          >
            <ActionButtons onClear={handleClear} onSearch={handleSearch} />
          </Box>
        </Box>
      </Box>

      {errorText ? (
        <Typography
          sx={{
            mb: "12px",
            fontSize: "14px",
            color: "#dc2626",
          }}
        >
          {errorText}
        </Typography>
      ) : null}

      <ResponsiveAttendanceTable
        columns={TABLE_COLUMNS}
        rows={displayRows.filter((row) => {
          if (!appliedFilters.unit_id) {
            return true;
          }

          return String(row.unit_id || "") === String(appliedFilters.unit_id);
        })}
        getRowKey={(row) => row.punch_id}
        mobileCardTitleKey="employee"
        emptyText={loading ? "讀取中..." : "查無打卡紀錄"}
        desktopMinWidth="850px"
        renderValue={renderTableValue}
      />
      <FormDialog
        open={formOpen}
        title={editingRow ? "編輯打卡紀錄" : "新增打卡紀錄"}
        submitting={submitting}
        submitLabel={editingRow ? "儲存修改" : "新增"}
        onClose={handleCloseForm}
        onSubmit={handleSubmitPunch}
      >
        {formError ? <Alert severity="error">{formError}</Alert> : null}

        <TextField
          select
          fullWidth
          size="small"
          label="員工"
          value={punchForm.employee_id}
          onChange={(event) =>
            handlePunchFormChange("employee_id", event.target.value)
          }
        >
          {employeeOptions.map((employee) => (
            <MenuItem key={employee.value} value={employee.value}>
              {employee.label}
            </MenuItem>
          ))}
        </TextField>

        <Box>
          <Typography
            sx={{
              mb: "6px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
            }}
          >
            打卡日期
          </Typography>

          {renderDateField(punchForm.punch_date, (event) =>
            handlePunchFormChange("punch_date", event.target.value),
          )}
        </Box>

        <Box>
          <Typography
            sx={{
              mb: "6px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
            }}
          >
            打卡時間
          </Typography>

          <Box
            sx={{
              width: {
                xs: "100%",
                sm: "260px",
              },
            }}
          >
            <MobileTimeSelect
              hour={punchForm.punch_hour}
              minute={punchForm.punch_minute}
              onChangeHour={(value) =>
                handlePunchFormChange("punch_hour", value)
              }
              onChangeMinute={(value) =>
                handlePunchFormChange("punch_minute", value)
              }
            />
          </Box>
        </Box>

        <TextField
          select
          fullWidth
          size="small"
          label="打卡類型"
          value={punchForm.punch_type}
          onChange={(event) =>
            handlePunchFormChange("punch_type", event.target.value)
          }
        >
          <MenuItem value="in">上班</MenuItem>
          <MenuItem value="out">下班</MenuItem>
          <MenuItem value="break_out">休息開始</MenuItem>
          <MenuItem value="break_in">休息結束</MenuItem>
        </TextField>

        <TextField
          select
          fullWidth
          size="small"
          label="打卡方式"
          value={punchForm.method}
          onChange={(event) =>
            handlePunchFormChange("method", event.target.value)
          }
        >
          {PUNCH_METHOD_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          fullWidth
          size="small"
          label="地點"
          value={punchForm.location_label}
          onChange={(event) =>
            handlePunchFormChange("location_label", event.target.value)
          }
        >
          {PUNCH_LOCATION_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          required
          fullWidth
          multiline
          minRows={3}
          label="維護原因"
          value={punchForm.maintenance_reason}
          onChange={(event) =>
            handlePunchFormChange("maintenance_reason", event.target.value)
          }
        />
      </FormDialog>
      <FormDialog
        open={Boolean(deleteRow)}
        title="確認刪除打卡紀錄"
        submitting={deleting}
        submitLabel="刪除"
        onClose={handleCloseDelete}
        onSubmit={handleConfirmDelete}
      >
        {deleteError ? <Alert severity="error">{deleteError}</Alert> : null}

        <Typography sx={{ fontSize: "15px" }}>
          確定要刪除這筆打卡紀錄嗎？
        </Typography>

        {deleteRow ? (
          <Box
            sx={{
              p: "12px",
              borderRadius: "6px",
              bgcolor: "#f9fafb",
            }}
          >
            <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
              {deleteRow.employee || `#${deleteRow.employee_id}`}
            </Typography>

            <Typography
              sx={{
                mt: "4px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              {formatDateTime(deleteRow.punch_time)}
              {"　"}
              {formatPunchType(deleteRow.punch_type)}
            </Typography>
          </Box>
        ) : null}

        <TextField
          required
          fullWidth
          multiline
          minRows={3}
          label="維護原因"
          value={deleteReason}
          onChange={(event) => setDeleteReason(event.target.value)}
          helperText="刪除打卡紀錄必須填寫維護原因"
        />
      </FormDialog>
      <FormDialog
        open={Boolean(historyRow)}
        title="打卡維護歷程"
        submitLabel="關閉"
        cancelLabel=""
        maxWidth="md"
        submitting={historyLoading}
        onClose={handleCloseHistory}
        onSubmit={handleCloseHistory}
      >
        {historyRow ? (
          <Box
            sx={{
              p: "12px",
              borderRadius: "6px",
              bgcolor: "#f9fafb",
            }}
          >
            <Typography sx={{ fontSize: "14px", fontWeight: 700 }}>
              {historyRow.employee || `#${historyRow.employee_id}`}
            </Typography>

            <Typography
              sx={{
                mt: "4px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              {formatDateTime(historyRow.punch_time)}
              {"　"}
              {formatPunchType(historyRow.punch_type)}
            </Typography>
          </Box>
        ) : null}

        {historyError ? <Alert severity="error">{historyError}</Alert> : null}

        <ResponsiveAttendanceTable
          columns={HISTORY_COLUMNS}
          rows={historyRows}
          getRowKey={(row) => row.maintenance_log_id}
          emptyText={historyLoading ? "讀取中..." : "查無維護歷程"}
          desktopMinWidth="850px"
          renderValue={renderHistoryValue}
        />
      </FormDialog>
      <SuccessDialog
        open={successDialog.open}
        title={successDialog.title}
        message={successDialog.message}
        onClose={handleCloseSuccessDialog}
      />
    </Box>
  );
}
