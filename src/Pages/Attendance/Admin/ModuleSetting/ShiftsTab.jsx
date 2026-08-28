import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CalendarViewWeekOutlinedIcon from "@mui/icons-material/CalendarViewWeekOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import {
  apiAttendanceShiftDays,
  apiAttendanceShifts,
  apiCreateAttendanceShift,
  apiDeleteAttendanceShift,
  apiSaveAttendanceShiftDays,
  apiUpdateAttendanceShift,
  apiUpdateAttendanceShiftStatus,
} from "../../../../API/attendance";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";
import {
  ENABLE_STATUS_FILTER_OPTIONS,
  SHIFT_COLOR_OPTIONS,
  WORKDAY_OPTIONS,
  getShiftColorOption,
} from "./moduleSettingOptions";

const INITIAL_FILTERS = {
  status: "",
};

const INITIAL_FORM = {
  shift_code: "",
  shift_name: "",
  color_hex: "#3b82f6",
  cycle_days: "1",
  day_switch_time: "",
  status: "啟用",
};

const WEEKDAY_ROWS = [
  { weekday_type: "monday", label: "星期一", seq_no: 1 },
  { weekday_type: "tuesday", label: "星期二", seq_no: 2 },
  { weekday_type: "wednesday", label: "星期三", seq_no: 3 },
  { weekday_type: "thursday", label: "星期四", seq_no: 4 },
  { weekday_type: "friday", label: "星期五", seq_no: 5 },
  { weekday_type: "saturday", label: "星期六", seq_no: 6 },
  { weekday_type: "sunday", label: "星期日", seq_no: 7 },
];

const WEEKDAY_OPTIONS = WEEKDAY_ROWS.map((day) => ({
  value: day.weekday_type,
  label: day.label,
}));

function createInitialShiftDays() {
  return WEEKDAY_ROWS.map((day) => ({
    ...day,
    is_workday: ["saturday", "sunday"].includes(day.weekday_type) ? "0" : "1",
    work_start: "",
    work_end: "",
    rest_start: "",
    rest_end: "",
    break_minutes: 0,
  }));
}

const TABLE_COLUMNS = [
  { key: "shift_code", label: "班次代碼", width: "1.1fr" },
  { key: "shift_name", label: "班次名稱", width: "1.3fr" },
  { key: "color", label: "顏色", width: "1fr" },
  { key: "cycle_days_text", label: "循環天數", width: "1fr" },
  { key: "day_switch_time_text", label: "日切換時間", width: "1.1fr" },
  { key: "status", label: "狀態", width: "1fr" },
  { key: "actions", label: "操作", width: "130px" },
];

function getItems(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
}

function normalizeTime(value) {
  const text = String(value || "").trim();

  if (!text) return "-";

  return text.length >= 5 ? text.slice(0, 5) : text;
}

export default function ShiftsTab() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrorText, setFormErrorText] = useState("");
  const [shiftDaysRow, setShiftDaysRow] = useState(null);
  const [shiftDays, setShiftDays] = useState(createInitialShiftDays);
  const [shiftDaysLoading, setShiftDaysLoading] = useState(false);
  const [shiftDaysErrorText, setShiftDaysErrorText] = useState("");
  const [copyPanelOpen, setCopyPanelOpen] = useState(false);
  const [copySourceDay, setCopySourceDay] = useState("");
  const [copyTargetDays, setCopyTargetDays] = useState([]);
  const [actionRow, setActionRow] = useState(null);
  const [actionType, setActionType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const displayRows = useMemo(() => {
    return rows
      .map((row) => ({
        ...row,
        cycle_days_text: `${Number(row.cycle_days || 1)} 天`,
        day_switch_time_text: normalizeTime(row.day_switch_time),
      }))
      .filter((row) => {
        if (
          appliedFilters.status &&
          String(row.status || "") !== appliedFilters.status
        ) {
          return false;
        }

        return true;
      });
  }, [rows, appliedFilters]);

  const loadRows = useCallback(async () => {
    const response = await apiAttendanceShifts();
    setRows(getItems(response));
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorText("");

      try {
        await loadRows();
      } catch (error) {
        console.error(error);

        if (active) {
          setRows([]);
          setErrorText("無法載入班次資料。");
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
  }, [loadRows]);

  const handleSearch = async () => {
    setLoading(true);
    setErrorText("");

    try {
      setAppliedFilters(filters);
      await loadRows();
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入班次資料。");
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
      await loadRows();
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入班次資料。");
    } finally {
      setLoading(false);
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
      shift_code: row.shift_code || "",
      shift_name: row.shift_name || "",
      color_hex: row.color_hex || "#3b82f6",
      cycle_days: String(Number(row.cycle_days || 1)),
      day_switch_time:
        normalizeTime(row.day_switch_time) === "-"
          ? ""
          : normalizeTime(row.day_switch_time),
      status: row.status === "停用" ? "停用" : "啟用",
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

  const handleFormChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const shiftCode = form.shift_code.trim();
    const shiftName = form.shift_name.trim();
    const cycleDays = Number(form.cycle_days || 0);

    if (!shiftCode) {
      setFormErrorText("請輸入班次代碼。");
      return;
    }

    if (!shiftName) {
      setFormErrorText("請輸入班次名稱。");
      return;
    }

    if (!Number.isInteger(cycleDays) || cycleDays <= 0) {
      setFormErrorText("循環天數必須為大於 0 的整數。");
      return;
    }

    const payload = {
      shift_code: shiftCode,
      shift_name: shiftName,
      color_hex: form.color_hex,
      cycle_days: cycleDays,
      day_switch_time: form.day_switch_time,
    };

    setSubmitting(true);
    setFormErrorText("");

    try {
      if (editingRow) {
        await apiUpdateAttendanceShift(editingRow.shift_id, payload);

        if (form.status !== editingRow.status) {
          await apiUpdateAttendanceShiftStatus(
            editingRow.shift_id,
            form.status,
          );
        }
      } else {
        await apiCreateAttendanceShift(payload);
      }

      const editing = Boolean(editingRow);

      setFormOpen(false);
      setEditingRow(null);
      setForm(INITIAL_FORM);
      await loadRows();

      setSuccessDialog({
        open: true,
        title: editing ? "更新成功" : "新增成功",
        message: editing ? "班次資料已成功更新。" : "班次資料已成功新增。",
      });
    } catch (error) {
      console.error(error);
      setFormErrorText(
        error?.response?.data?.message ||
          (editingRow ? "更新班次失敗。" : "新增班次失敗."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenShiftDays = async (row) => {
    setShiftDaysRow(row);
    setShiftDays(createInitialShiftDays());
    setShiftDaysErrorText("");
    setCopyPanelOpen(false);
    setCopySourceDay("");
    setCopyTargetDays([]);
    setShiftDaysLoading(true);

    try {
      const response = await apiAttendanceShiftDays(row.shift_id);
      const payload = response?.data ?? response;
      const savedDays = Array.isArray(payload?.days) ? payload.days : [];

      const savedMap = new Map(savedDays.map((day) => [day.weekday_type, day]));

      setShiftDays(
        createInitialShiftDays().map((day) => {
          const saved = savedMap.get(day.weekday_type);

          if (!saved) return day;

          return {
            ...day,
            is_workday: Number(saved.is_workday || 0) === 1 ? "1" : "0",
            work_start:
              normalizeTime(saved.work_start) === "-"
                ? ""
                : normalizeTime(saved.work_start),
            work_end:
              normalizeTime(saved.work_end) === "-"
                ? ""
                : normalizeTime(saved.work_end),
            rest_start:
              normalizeTime(saved.rest_start) === "-"
                ? ""
                : normalizeTime(saved.rest_start),
            rest_end:
              normalizeTime(saved.rest_end) === "-"
                ? ""
                : normalizeTime(saved.rest_end),
            break_minutes: Number(saved.break_minutes || 0),
          };
        }),
      );
    } catch (error) {
      console.error(error);
      setShiftDaysErrorText(
        error?.response?.data?.message || "無法載入班次日設定。",
      );
    } finally {
      setShiftDaysLoading(false);
    }
  };

  const handleCloseShiftDays = () => {
    if (submitting) return;

    setShiftDaysRow(null);
    setShiftDays(createInitialShiftDays());
    setShiftDaysErrorText("");
    setCopyPanelOpen(false);
    setCopySourceDay("");
    setCopyTargetDays([]);
  };

  const handleShiftDayChange = (weekdayType, field, value) => {
    setShiftDays((current) =>
      current.map((day) =>
        day.weekday_type === weekdayType
          ? {
              ...day,
              [field]: value,
              ...(field === "is_workday" && value === "0"
                ? {
                    work_start: "",
                    work_end: "",
                    rest_start: "",
                    rest_end: "",
                    break_minutes: 0,
                  }
                : {}),
            }
          : day,
      ),
    );
  };

    const handleCopySourceChange = (value) => {
    setCopySourceDay(value);
    setCopyTargetDays((current) =>
      current.filter((weekdayType) => weekdayType !== value),
    );
  };

  const handleCopyTargetChange = (weekdayType, checked) => {
    setCopyTargetDays((current) => {
      if (checked) {
        return current.includes(weekdayType)
          ? current
          : [...current, weekdayType];
      }

      return current.filter((item) => item !== weekdayType);
    });
  };

  const handleSelectAllCopyTargets = (checked) => {
    if (!checked) {
      setCopyTargetDays([]);
      return;
    }

    setCopyTargetDays(
      WEEKDAY_ROWS
        .filter((day) => day.weekday_type !== copySourceDay)
        .map((day) => day.weekday_type),
    );
  };

  const handleApplyShiftDayCopy = () => {
    if (!copySourceDay) {
      setShiftDaysErrorText("請選擇要複製的來源日。");
      return;
    }

    if (copyTargetDays.length === 0) {
      setShiftDaysErrorText("請至少選擇一個套用日期。");
      return;
    }

    const sourceDay = shiftDays.find(
      (day) => day.weekday_type === copySourceDay,
    );

    if (!sourceDay) {
      setShiftDaysErrorText("找不到來源日設定。");
      return;
    }

    setShiftDays((current) =>
      current.map((day) =>
        copyTargetDays.includes(day.weekday_type)
          ? {
              ...day,
              is_workday: sourceDay.is_workday,
              work_start: sourceDay.work_start,
              work_end: sourceDay.work_end,
              rest_start: sourceDay.rest_start,
              rest_end: sourceDay.rest_end,
              break_minutes: sourceDay.break_minutes,
            }
          : day,
      ),
    );

    setShiftDaysErrorText("");
    setCopyPanelOpen(false);
    setCopyTargetDays([]);
  };

  const handleSaveShiftDays = async () => {
    const shiftId = Number(shiftDaysRow?.shift_id || 0);

    if (shiftId <= 0) return;

    for (const day of shiftDays) {
      if (day.is_workday !== "1") continue;

      if (!day.work_start || !day.work_end) {
        setShiftDaysErrorText(`${day.label}為工作日，請完整設定上下班時間。`);
        return;
      }

      const hasRestStart = Boolean(day.rest_start);
      const hasRestEnd = Boolean(day.rest_end);

      if (hasRestStart !== hasRestEnd) {
        setShiftDaysErrorText(`${day.label}的休息開始與結束時間必須同時設定。`);
        return;
      }
    }

    setSubmitting(true);
    setShiftDaysErrorText("");

    try {
      await apiSaveAttendanceShiftDays(
        shiftId,
        shiftDays.map((day) => ({
          weekday_type: day.weekday_type,
          is_workday: day.is_workday === "1" ? 1 : 0,
          work_start: day.work_start,
          work_end: day.work_end,
          rest_start: day.rest_start,
          rest_end: day.rest_end,
        })),
      );

      setShiftDaysRow(null);
      setShiftDays(createInitialShiftDays());

      setSuccessDialog({
        open: true,
        title: "更新成功",
        message: "班次日設定已成功更新。",
      });
    } catch (error) {
      console.error(error);
      setShiftDaysErrorText(
        error?.response?.data?.message || "更新班次日設定失敗。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openActionDialog = (row, type) => {
    setActionRow(row);
    setActionType(type);
    setErrorText("");
  };

  const closeActionDialog = () => {
    if (submitting) return;

    setActionRow(null);
    setActionType("");
  };

  const handleActionSubmit = async () => {
    const shiftId = Number(actionRow?.shift_id || 0);

    if (shiftId <= 0 || actionType !== "delete") {
      return;
    }

    setSubmitting(true);
    setErrorText("");

    try {
      await apiDeleteAttendanceShift(shiftId);

      setActionRow(null);
      setActionType("");

      await loadRows();

      setSuccessDialog({
        open: true,
        title: "刪除成功",
        message: "班次已成功刪除。",
      });
    } catch (error) {
      console.error(error);

      setErrorText(error?.response?.data?.message || "刪除班次失敗。");
    } finally {
      setSubmitting(false);
    }
  };

  const renderTableValue = (row, column) => {
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
          <Tooltip title="編輯">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="班次日設定">
            <IconButton size="small" onClick={() => handleOpenShiftDays(row)}>
              <CalendarViewWeekOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="刪除">
            <IconButton
              size="small"
              onClick={() => openActionDialog(row, "delete")}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }
    if (column.key === "color") {
      const color = String(row.color_hex || "").trim();
      const colorOption = getShiftColorOption(color);

      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: "14px",
              height: "14px",
              flex: "0 0 auto",
              borderRadius: "3px",
              bgcolor: color || "#d1d5db",
              border: "1px solid #d1d5db",
            }}
          />

          <Typography
            component="span"
            sx={{
              minWidth: 0,
              fontSize: "15px",
              color: "#111827",
            }}
          >
            {colorOption?.label || color || "-"}
          </Typography>
        </Box>
      );
    }

    return row[column.key] || "-";
  };

  return (
    <Box>
      <Box
        sx={{
          mb: "18px",
          display: "flex",
          alignItems: { xs: "stretch", sm: "flex-start" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: "12px",
        }}
      >
        <Box>
          <Typography
            sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}
          >
            班次
          </Typography>

          <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
            管理班次基本資料及循環工作日設定
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          新增班次
        </Button>
      </Box>

      <Box sx={{ mb: "18px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "minmax(0, 1fr)",
              md: "minmax(0, 320px)",
            },
            gap: "14px",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              狀態
            </Typography>

            <SelectField
              value={filters.status}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  status: value,
                }))
              }
              options={ENABLE_STATUS_FILTER_OPTIONS}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>
        </Box>

        <Box sx={{ mt: "14px", display: "flex", justifyContent: "flex-end" }}>
          <ActionButtons
            onClear={handleClear}
            onSearch={handleSearch}
            disabled={loading}
          />
        </Box>
      </Box>

      {errorText ? (
        <Alert severity="error" sx={{ mb: "14px" }}>
          {errorText}
        </Alert>
      ) : null}

      <Box sx={{ position: "relative" }}>
        {loading ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "140px",
              bgcolor: "rgba(255, 255, 255, 0.72)",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : null}

        <ResponsiveAttendanceTable
          columns={TABLE_COLUMNS}
          rows={displayRows}
          getRowKey={(row) => row.shift_id}
          mobileCardTitleKey="shift_name"
          emptyText="查無班次資料"
          renderValue={renderTableValue}
          fitToContainer
          pagination
          rowsPerPage={10}
        />
      </Box>

      <FormDialog
        open={formOpen}
        title={editingRow ? "編輯班次" : "新增班次"}
        submitLabel={editingRow ? "更新" : "新增"}
        submitting={submitting}
        maxWidth="sm"
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      >
        {formErrorText ? <Alert severity="error">{formErrorText}</Alert> : null}

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            班次代碼
          </Typography>

          <TextField
            value={form.shift_code}
            onChange={(event) =>
              handleFormChange("shift_code", event.target.value)
            }
            placeholder="請輸入班次代碼"
            fullWidth
            size="small"
            disabled={submitting}
          />
        </Box>

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            班次名稱
          </Typography>

          <TextField
            value={form.shift_name}
            onChange={(event) =>
              handleFormChange("shift_name", event.target.value)
            }
            placeholder="請輸入班次名稱"
            fullWidth
            size="small"
            disabled={submitting}
          />
        </Box>

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            顏色
          </Typography>

          <SelectField
            value={form.color_hex}
            onChange={(value) => handleFormChange("color_hex", value)}
            options={SHIFT_COLOR_OPTIONS}
            renderOption={(option) => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Box
                  sx={{
                    width: "14px",
                    height: "14px",
                    flex: "0 0 auto",
                    borderRadius: "3px",
                    bgcolor: option.color,
                    border: "1px solid #d1d5db",
                  }}
                />

                <Box component="span">{option.label}</Box>
              </Box>
            )}
            renderValue={(option) =>
              option ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Box
                    sx={{
                      width: "14px",
                      height: "14px",
                      flex: "0 0 auto",
                      borderRadius: "3px",
                      bgcolor: option.color,
                      border: "1px solid #d1d5db",
                    }}
                  />

                  <Box component="span">{option.label}</Box>
                </Box>
              ) : (
                "-"
              )
            }
            fullWidth
            height="38px"
            disabled={submitting}
          />
        </Box>

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            循環天數
          </Typography>

          <TextField
            type="number"
            value={form.cycle_days}
            onChange={(event) =>
              handleFormChange("cycle_days", event.target.value)
            }
            inputProps={{
              min: 1,
              step: 1,
            }}
            fullWidth
            size="small"
            disabled={submitting}
          />

          <Typography sx={{ mt: "6px", fontSize: "13px", color: "#6b7280" }}>
            循環日的實際上下班時間將於「循環日設定」中管理。
          </Typography>
        </Box>

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            日切換時間
          </Typography>

          <TextField
            type="time"
            value={form.day_switch_time}
            onChange={(event) =>
              handleFormChange("day_switch_time", event.target.value)
            }
            fullWidth
            size="small"
            disabled={submitting}
            InputLabelProps={{ shrink: true }}
          />

          <Typography sx={{ mt: "6px", fontSize: "13px", color: "#6b7280" }}>
            用於判斷跨午夜班次應歸屬的工作日；未設定時可留空。
          </Typography>
        </Box>
        {editingRow ? (
          <Box>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              狀態
            </Typography>

            <Box
              sx={{
                minHeight: "38px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Switch
                checked={form.status === "啟用"}
                onChange={(event) =>
                  handleFormChange(
                    "status",
                    event.target.checked ? "啟用" : "停用",
                  )
                }
                disabled={submitting}
              />

              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: form.status === "啟用" ? "#16a34a" : "#6b7280",
                }}
              >
                {form.status}
              </Typography>
            </Box>
          </Box>
        ) : null}
      </FormDialog>
      <FormDialog
        open={Boolean(shiftDaysRow)}
        title={`班次日設定${shiftDaysRow?.shift_name ? `－${shiftDaysRow.shift_name}` : ""}`}
        submitLabel="儲存"
        cancelLabel="取消"
        submitting={submitting}
        maxWidth="lg"
        onClose={handleCloseShiftDays}
        onSubmit={handleSaveShiftDays}
      >
        {shiftDaysErrorText ? (
          <Alert severity="error">{shiftDaysErrorText}</Alert>
        ) : null}

        {shiftDaysLoading ? (
          <Box
            sx={{
              minHeight: "180px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box sx={{ display: "grid", gap: "12px" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="outlined"
                startIcon={<ContentCopyOutlinedIcon />}
                onClick={() =>
                  setCopyPanelOpen((current) => !current)
                }
                disabled={submitting}
              >
                複製日設定
              </Button>
            </Box>

            {copyPanelOpen ? (
              <Box
                sx={{
                  p: "14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  bgcolor: "#f9fafb",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "220px minmax(0, 1fr)",
                    },
                    gap: "16px",
                    alignItems: "start",
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        mb: "6px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      來源日
                    </Typography>

                    <SelectField
                      value={copySourceDay}
                      onChange={handleCopySourceChange}
                      options={WEEKDAY_OPTIONS}
                      displayEmpty
                      fullWidth
                      height="38px"
                      disabled={submitting}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        mb: "4px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      套用至
                    </Typography>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            Boolean(copySourceDay) &&
                            copyTargetDays.length ===
                              WEEKDAY_ROWS.length - 1
                          }
                          indeterminate={
                            copyTargetDays.length > 0 &&
                            copyTargetDays.length <
                              WEEKDAY_ROWS.length - 1
                          }
                          onChange={(event) =>
                            handleSelectAllCopyTargets(
                              event.target.checked,
                            )
                          }
                          disabled={
                            submitting || !copySourceDay
                          }
                        />
                      }
                      label="全選其他日期"
                    />

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "2px 12px",
                      }}
                    >
                      {WEEKDAY_ROWS.map((day) => {
                        const source =
                          day.weekday_type === copySourceDay;

                        return (
                          <FormControlLabel
                            key={day.weekday_type}
                            control={
                              <Checkbox
                                checked={copyTargetDays.includes(
                                  day.weekday_type,
                                )}
                                onChange={(event) =>
                                  handleCopyTargetChange(
                                    day.weekday_type,
                                    event.target.checked,
                                  )
                                }
                                disabled={
                                  submitting ||
                                  !copySourceDay ||
                                  source
                                }
                              />
                            }
                            label={day.label}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    mt: "12px",
                    display: "flex",
                    alignItems: {
                      xs: "stretch",
                      sm: "center",
                    },
                    justifyContent: "space-between",
                    flexDirection: {
                      xs: "column",
                      sm: "row",
                    },
                    gap: "10px",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#6b7280",
                      lineHeight: 1.6,
                    }}
                  >
                    套用後會覆蓋所選日期目前的設定；需點選「儲存」後才會正式更新。
                  </Typography>

                  <Button
                    variant="contained"
                    onClick={handleApplyShiftDayCopy}
                    disabled={
                      submitting ||
                      !copySourceDay ||
                      copyTargetDays.length === 0
                    }
                    sx={{
                      flex: "0 0 auto",
                    }}
                  >
                    套用設定
                  </Button>
                </Box>
              </Box>
            ) : null}

            {shiftDays.map((day) => {
              const workday = day.is_workday === "1";

              return (
                <Box
                  key={day.weekday_type}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "110px 130px repeat(4, minmax(110px, 1fr))",
                    },
                    gap: "10px",
                    alignItems: "end",
                    p: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                >
                  <Typography
                    sx={{
                      alignSelf: "center",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {day.label}
                  </Typography>

                  <Box>
                    <Typography
                      sx={{
                        mb: "6px",
                        fontSize: "13px",
                        color: "#6b7280",
                      }}
                    >
                      類型
                    </Typography>

                    <SelectField
                      value={day.is_workday}
                      onChange={(value) =>
                        handleShiftDayChange(
                          day.weekday_type,
                          "is_workday",
                          value,
                        )
                      }
                      options={WORKDAY_OPTIONS}
                      fullWidth
                      height="38px"
                      disabled={submitting}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        mb: "6px",
                        fontSize: "13px",
                        color: "#6b7280",
                      }}
                    >
                      上班
                    </Typography>

                    <TextField
                      type="time"
                      value={day.work_start}
                      onChange={(event) =>
                        handleShiftDayChange(
                          day.weekday_type,
                          "work_start",
                          event.target.value,
                        )
                      }
                      inputProps={{ step: 1800 }}
                      fullWidth
                      size="small"
                      disabled={submitting || !workday}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        mb: "6px",
                        fontSize: "13px",
                        color: "#6b7280",
                      }}
                    >
                      下班
                    </Typography>

                    <TextField
                      type="time"
                      value={day.work_end}
                      onChange={(event) =>
                        handleShiftDayChange(
                          day.weekday_type,
                          "work_end",
                          event.target.value,
                        )
                      }
                      inputProps={{ step: 1800 }}
                      fullWidth
                      size="small"
                      disabled={submitting || !workday}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        mb: "6px",
                        fontSize: "13px",
                        color: "#6b7280",
                      }}
                    >
                      休息開始
                    </Typography>

                    <TextField
                      type="time"
                      value={day.rest_start}
                      onChange={(event) =>
                        handleShiftDayChange(
                          day.weekday_type,
                          "rest_start",
                          event.target.value,
                        )
                      }
                      inputProps={{ step: 1800 }}
                      fullWidth
                      size="small"
                      disabled={submitting || !workday}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        mb: "6px",
                        fontSize: "13px",
                        color: "#6b7280",
                      }}
                    >
                      休息結束
                    </Typography>

                    <TextField
                      type="time"
                      value={day.rest_end}
                      onChange={(event) =>
                        handleShiftDayChange(
                          day.weekday_type,
                          "rest_end",
                          event.target.value,
                        )
                      }
                      inputProps={{ step: 1800 }}
                      fullWidth
                      size="small"
                      disabled={submitting || !workday}
                    />
                  </Box>
                </Box>
              );
            })}

            <Typography
              sx={{
                fontSize: "13px",
                color: "#6b7280",
                lineHeight: 1.6,
              }}
            >
              上下班及休息時間以 30
              分鐘為單位。若下班時間早於上班時間，系統會視為跨日班次。休息分鐘由休息開始與結束時間自動計算。
            </Typography>
          </Box>
        )}
      </FormDialog>

      <FormDialog
        open={Boolean(actionRow)}
        title="確認刪除"
        submitLabel="刪除"
        cancelLabel="取消"
        maxWidth="xs"
        submitting={submitting}
        onClose={closeActionDialog}
        onSubmit={handleActionSubmit}
      >
        <Typography
          sx={{
            fontSize: "15px",
            color: "#374151",
            lineHeight: 1.7,
          }}
        >
          {`確認刪除「${actionRow?.shift_name || ""}」？已有員工指派或排班紀錄的班次無法刪除。`}
        </Typography>
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
    </Box>
  );
}
