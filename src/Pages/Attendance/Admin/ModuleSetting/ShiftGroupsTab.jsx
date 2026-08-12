import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Switch,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  apiAttendanceCalendarMasters,
  apiAttendanceShiftGroupConfiguration,
  apiAttendanceShiftGroupFutureUpdatePreview,
  apiAttendanceShiftGroups,
  apiAttendanceShifts,
  apiCreateAttendanceShiftGroup,
  apiSaveAttendanceShiftGroupConfiguration,
  apiUpdateAttendanceShiftGroup,
  apiUpdateAttendanceShiftGroupFuture,
  apiDeleteAttendanceShiftGroup,
  apiUpdateAttendanceShiftGroupStatus,
} from "../../../../API/attendance";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";
import {
  SHIFT_GROUP_STATUS_FILTER_OPTIONS,
  YES_NO_OPTIONS,
} from "./moduleSettingOptions";

const INITIAL_FILTERS = {
  status: "",
};

const INITIAL_FORM = {
  shift_group_code: "",
  shift_group_name: "",
  daily_base_hours: "8",
  cycle_days: "1",
  shift_activation_date: "",
  generate_schedule_from_default: "1",
  status: "inactive",
};

const TABLE_COLUMNS = [
  { key: "shift_group_code", label: "班別代碼", width: "1fr" },
  { key: "shift_group_name", label: "班別名稱", width: "1.2fr" },
  { key: "calendar_name_text", label: "行事曆", width: "1.2fr" },
  { key: "default_shift_name_text", label: "預設班次", width: "1.1fr" },
  { key: "shift_activation_date_text", label: "班次啟用日", width: "1fr" },
  { key: "status", label: "狀態", width: "0.8fr" },
  { key: "actions", label: "操作", width: "120px" },
];

function getItems(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
}

function formatDate(value) {
  const raw = String(value || "").trim();

  if (!raw) return "-";

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return raw;

  return `${match[1]}/${match[2]}/${match[3]}`;
}

function getTomorrowDate() {
  const date = new Date();

  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function ShiftGroupsTab() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
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

  const [shiftConfigRow, setShiftConfigRow] = useState(null);
  const [calendarOptions, setCalendarOptions] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState("");
  const [shiftOptions, setShiftOptions] = useState([]);
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);
  const [defaultShiftId, setDefaultShiftId] = useState("");
  const [shiftConfigLoading, setShiftConfigLoading] = useState(false);
  const [shiftConfigErrorText, setShiftConfigErrorText] = useState("");
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [futureUpdateDraft, setFutureUpdateDraft] = useState(null);
  const [futureUpdateDate, setFutureUpdateDate] = useState("");
  const [futureUpdatePreview, setFutureUpdatePreview] = useState(null);
  const [futureUpdateErrorText, setFutureUpdateErrorText] = useState("");
  const [futureUpdateLoading, setFutureUpdateLoading] = useState(false);

  const displayRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      calendar_name_text: row.calendar_name || "-",
      default_shift_name_text: row.default_shift_name || "-",
      shift_activation_date_text: formatDate(row.shift_activation_date),
    }));
  }, [rows]);

  const loadRows = useCallback(async (params = {}) => {
    const response = await apiAttendanceShiftGroups(params);
    setRows(getItems(response));
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const response = await apiAttendanceShiftGroups();

        if (active) {
          setRows(getItems(response));
        }
      } catch (error) {
        console.error(error);

        if (active) {
          setRows([]);
          setErrorText("無法載入班別資料。");
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
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setErrorText("");

    try {
      await loadRows(filters);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入班別資料。");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setFilters(INITIAL_FILTERS);
    setLoading(true);
    setErrorText("");

    try {
      await loadRows();
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入班別資料。");
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
      shift_group_code: row.shift_group_code || "",
      shift_group_name: row.shift_group_name || "",
      daily_base_hours: String(Number(row.daily_base_hours || 8)),
      cycle_days: String(Number(row.cycle_days || 1)),
      shift_activation_date: row.shift_activation_date || "",
      generate_schedule_from_default:
        Number(row.generate_schedule_from_default ?? 1) === 1 ? "1" : "0",
      status: row.status_value || "inactive",
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

  const openFutureUpdatePreview = (draft) => {
    setFutureUpdateDraft(draft);
    setFutureUpdateDate(getTomorrowDate());
    setFutureUpdatePreview(null);
    setFutureUpdateErrorText("");
  };

  const handleCloseFutureUpdate = () => {
    if (futureUpdateLoading) return;

    setFutureUpdateDraft(null);
    setFutureUpdateDate("");
    setFutureUpdatePreview(null);
    setFutureUpdateErrorText("");
  };

  const handlePreviewFutureUpdate = async () => {
    const shiftGroupId = Number(
      futureUpdateDraft?.shift_group_id || 0,
    );

    if (shiftGroupId <= 0) return;

    if (!futureUpdateDate) {
      setFutureUpdateErrorText("請選擇班表更新日。");
      return;
    }

    setFutureUpdateLoading(true);
    setFutureUpdateErrorText("");
    setFutureUpdatePreview(null);

    try {
      const response =
        await apiAttendanceShiftGroupFutureUpdatePreview(
          shiftGroupId,
          futureUpdateDate,
        );

      const payload = response?.data ?? response;

      setFutureUpdatePreview(payload || null);
    } catch (error) {
      console.error(error);
      setFutureUpdateErrorText(
        error?.response?.data?.message ||
          "無法預覽未來班表更新影響。",
      );
    } finally {
      setFutureUpdateLoading(false);
    }
  };

  const handleConfirmFutureUpdate = async () => {
    const shiftGroupId = Number(
      futureUpdateDraft?.shift_group_id || 0,
    );

    if (
      shiftGroupId <= 0 ||
      !futureUpdateDate ||
      !futureUpdatePreview
    ) {
      return;
    }

    if (
      Number(
        futureUpdatePreview.protected_schedule_count || 0,
      ) > 0
    ) {
      setFutureUpdateErrorText(
        "受影響的未來班表已有出勤資料，目前無法更新班別。",
      );
      return;
    }

    const payload = {
      update_date: futureUpdateDate,
      shift_group_code:
        futureUpdateDraft.shift_group_code || "",
      shift_group_name:
        futureUpdateDraft.shift_group_name || "",
      daily_base_hours: Number(
        futureUpdateDraft.daily_base_hours || 0,
      ),
      cycle_days: Number(
        futureUpdateDraft.cycle_days || 0,
      ),
      shift_activation_date:
        futureUpdateDraft.shift_activation_date || "",
      generate_schedule_from_default:
        Number(
          futureUpdateDraft.generate_schedule_from_default ?? 1,
        ) === 1
          ? 1
          : 0,
      calendar_id: Number(
        futureUpdateDraft.calendar_id || 0,
      ),
      shift_ids: Array.isArray(
        futureUpdateDraft.shift_ids,
      )
        ? futureUpdateDraft.shift_ids.map(Number)
        : [],
      default_shift_id: Number(
        futureUpdateDraft.default_shift_id || 0,
      ),
    };

    setFutureUpdateLoading(true);
    setFutureUpdateErrorText("");

    try {
      await apiUpdateAttendanceShiftGroupFuture(
        shiftGroupId,
        payload,
      );

      setFutureUpdateDraft(null);
      setFutureUpdateDate("");
      setFutureUpdatePreview(null);
      setFutureUpdateErrorText("");

      await loadRows(filters);

      setSuccessDialog({
        open: true,
        title: "更新成功",
        message: "班別及未來班表已成功更新。",
      });
    } catch (error) {
      console.error(error);
      setFutureUpdateErrorText(
        error?.response?.data?.message ||
          "更新班別及未來班表失敗。",
      );
    } finally {
      setFutureUpdateLoading(false);
    }
  };

  const handleFutureUpdateSubmit = () => {
    if (futureUpdatePreview) {
      handleConfirmFutureUpdate();
      return;
    }

    handlePreviewFutureUpdate();
  };

  const handleSubmit = async () => {
    const shiftGroupCode = form.shift_group_code.trim();
    const shiftGroupName = form.shift_group_name.trim();
    const dailyBaseHours = Number(form.daily_base_hours || 0);
    const cycleDays = Number(form.cycle_days || 0);

    if (!shiftGroupCode) {
      setFormErrorText("請輸入班別代碼。");
      return;
    }

    if (!shiftGroupName) {
      setFormErrorText("請輸入班別名稱。");
      return;
    }

    if (
      !Number.isFinite(dailyBaseHours) ||
      dailyBaseHours <= 0 ||
      dailyBaseHours > 24
    ) {
      setFormErrorText("每日基準工時必須大於 0 且不可超過 24 小時。");
      return;
    }

    if (!Number.isInteger(cycleDays) || cycleDays <= 0) {
      setFormErrorText("循環天數必須為大於 0 的整數。");
      return;
    }

    const payload = {
      shift_group_code: shiftGroupCode,
      shift_group_name: shiftGroupName,
      daily_base_hours: dailyBaseHours,
      cycle_days: cycleDays,
      shift_activation_date: form.shift_activation_date,
      generate_schedule_from_default:
        form.generate_schedule_from_default === "1" ? 1 : 0,
    };
    const requestedStatus = form.status;
    setSubmitting(true);
    setFormErrorText("");

    try {
      if (editingRow?.is_used) {
        const configResponse =
          await apiAttendanceShiftGroupConfiguration(
            editingRow.shift_group_id,
          );

        const configPayload = configResponse?.data ?? configResponse;
        const configuredShifts = Array.isArray(configPayload?.shifts)
          ? configPayload.shifts
          : [];

        openFutureUpdatePreview({
          source: "basic",
          shift_group_id: Number(editingRow.shift_group_id),
          shift_group_code: payload.shift_group_code,
          shift_group_name: payload.shift_group_name,
          daily_base_hours: payload.daily_base_hours,
          cycle_days: payload.cycle_days,
          shift_activation_date: payload.shift_activation_date,
          generate_schedule_from_default:
            payload.generate_schedule_from_default,
          calendar_id: Number(
            configPayload?.shift_group?.calendar_id || 0,
          ),
          shift_ids: configuredShifts
            .map((shift) => Number(shift.shift_id || 0))
            .filter((shiftId) => shiftId > 0),
          default_shift_id: Number(
            configPayload?.shift_group?.default_shift_id || 0,
          ),
        });

        setFormOpen(false);
        setEditingRow(null);
        setForm(INITIAL_FORM);
        return;
      }

      if (editingRow) {
        await apiUpdateAttendanceShiftGroup(editingRow.shift_group_id, payload);

        const currentStatus = editingRow.status_value || "inactive";

        if (requestedStatus !== currentStatus) {
          await apiUpdateAttendanceShiftGroupStatus(
            editingRow.shift_group_id,
            requestedStatus,
          );
        }
      } else {
        await apiCreateAttendanceShiftGroup(payload);
      }

      const editing = Boolean(editingRow);

      setFormOpen(false);
      setEditingRow(null);
      setForm(INITIAL_FORM);
      await loadRows(filters);

      setSuccessDialog({
        open: true,
        title: editing ? "更新成功" : "新增成功",
        message: editing ? "班別資料已成功更新。" : "班別資料已成功新增。",
      });
    } catch (error) {
      console.error(error);
      setFormErrorText(
        error?.response?.data?.message ||
          (editingRow ? "更新班別失敗。" : "新增班別失敗。"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenShiftConfig = async (row) => {
    const shiftGroupId = Number(row?.shift_group_id || 0);

    if (shiftGroupId <= 0) return;

    setShiftConfigRow(row);
    setCalendarOptions([]);
    setSelectedCalendarId("");
    setShiftOptions([]);
    setSelectedShiftIds([]);
    setDefaultShiftId("");
    setShiftConfigErrorText("");
    setShiftConfigLoading(true);

    try {
      const [calendarResponse, shiftResponse, configResponse] =
        await Promise.all([
          apiAttendanceCalendarMasters(),
          apiAttendanceShifts(),
          apiAttendanceShiftGroupConfiguration(shiftGroupId),
        ]);

      const calendars = getItems(calendarResponse);
      const shifts = getItems(shiftResponse);
      const configPayload = configResponse?.data ?? configResponse;
      const configuredShifts = Array.isArray(configPayload?.shifts)
        ? configPayload.shifts
        : [];

      setCalendarOptions(
        calendars.map((calendar) => ({
          value: String(calendar.calendar_id),
          label: `${calendar.calendar_code}－${calendar.calendar_name}`,
        })),
      );

      setSelectedCalendarId(
        configPayload?.shift_group?.calendar_id
          ? String(configPayload.shift_group.calendar_id)
          : "",
      );

      const groupCycleDays = Number(row.cycle_days || 1);

      const compatibleOptions = shifts
        .filter(
          (shift) =>
            ["active", "啟用"].includes(shift.status) &&
            Number(shift.cycle_days || 1) === groupCycleDays,
        )
        .map((shift) => ({
          value: String(shift.shift_id),
          label: `${shift.shift_code}－${shift.shift_name}`,
        }));

      const compatibleIds = new Set(
        compatibleOptions.map((option) => option.value),
      );

      const compatibleSelectedIds = configuredShifts
        .map((shift) => String(shift.shift_id))
        .filter((shiftId) => compatibleIds.has(shiftId));

      const configuredDefaultShiftId = configPayload?.shift_group
        ?.default_shift_id
        ? String(configPayload.shift_group.default_shift_id)
        : "";

      setShiftOptions(compatibleOptions);
      setSelectedShiftIds(compatibleSelectedIds);
      setDefaultShiftId(
        compatibleIds.has(configuredDefaultShiftId)
          ? configuredDefaultShiftId
          : "",
      );
    } catch (error) {
      console.error(error);
      setShiftConfigErrorText(
        error?.response?.data?.message || "無法載入班別配置。",
      );
    } finally {
      setShiftConfigLoading(false);
    }
  };
  const handleCloseShiftConfig = () => {
    if (submitting) return;

    setShiftConfigRow(null);
    setCalendarOptions([]);
    setSelectedCalendarId("");
    setShiftOptions([]);
    setSelectedShiftIds([]);
    setDefaultShiftId("");
    setShiftConfigErrorText("");
  };

  const handleShiftToggle = (shiftId) => {
    const value = String(shiftId);

    setSelectedShiftIds((current) => {
      if (current.includes(value)) {
        if (defaultShiftId === value) setDefaultShiftId("");

        return current.filter((item) => item !== value);
      }

      return [...current, value];
    });
  };

  const handleSaveShiftConfig = async () => {
    const shiftGroupId = Number(shiftConfigRow?.shift_group_id || 0);

    if (shiftGroupId <= 0) return;

    if (!selectedCalendarId) {
      setShiftConfigErrorText("請選擇行事曆。");
      return;
    }

    if (!selectedShiftIds.length) {
      setShiftConfigErrorText("請至少選擇一個班次。");
      return;
    }

    if (!defaultShiftId || !selectedShiftIds.includes(defaultShiftId)) {
      setShiftConfigErrorText("請選擇此班別的預設班次。");
      return;
    }

    setSubmitting(true);
    setShiftConfigErrorText("");

    try {
      if (shiftConfigRow?.is_used) {
        openFutureUpdatePreview({
          source: "configuration",
          shift_group_id: shiftGroupId,
          shift_group_code: shiftConfigRow.shift_group_code || "",
          shift_group_name: shiftConfigRow.shift_group_name || "",
          daily_base_hours: Number(
            shiftConfigRow.daily_base_hours || 0,
          ),
          cycle_days: Number(shiftConfigRow.cycle_days || 0),
          shift_activation_date:
            shiftConfigRow.shift_activation_date || "",
          generate_schedule_from_default:
            Number(
              shiftConfigRow.generate_schedule_from_default ?? 1,
            ) === 1
              ? 1
              : 0,
          calendar_id: Number(selectedCalendarId),
          shift_ids: selectedShiftIds.map(Number),
          default_shift_id: Number(defaultShiftId),
        });

        setShiftConfigRow(null);
        setCalendarOptions([]);
        setSelectedCalendarId("");
        setShiftOptions([]);
        setSelectedShiftIds([]);
        setDefaultShiftId("");
        return;
      }

      await apiSaveAttendanceShiftGroupConfiguration(shiftGroupId, {
        calendar_id: Number(selectedCalendarId),
        shift_ids: selectedShiftIds.map(Number),
        default_shift_id: Number(defaultShiftId),
      });

      setShiftConfigRow(null);
      setCalendarOptions([]);
      setSelectedCalendarId("");
      setShiftOptions([]);
      setSelectedShiftIds([]);
      setDefaultShiftId("");
      await loadRows(filters);

      setSuccessDialog({
        open: true,
        title: "更新成功",
        message: "班別配置已成功更新。",
      });
    } catch (error) {
      console.error(error);
      setShiftConfigErrorText(
        error?.response?.data?.message || "更新班別配置失敗。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (row) => {
    setDeleteRow(row);
    setErrorText("");
  };

  const handleCloseDelete = () => {
    if (deleteSubmitting) return;

    setDeleteRow(null);
  };

  const handleDelete = async () => {
    const shiftGroupId = Number(deleteRow?.shift_group_id || 0);

    if (shiftGroupId <= 0) return;

    setDeleteSubmitting(true);
    setErrorText("");

    try {
      await apiDeleteAttendanceShiftGroup(shiftGroupId);

      setDeleteRow(null);
      await loadRows(filters);

      setSuccessDialog({
        open: true,
        title: "刪除成功",
        message: "班別已成功刪除。",
      });
    } catch (error) {
      console.error(error);
      setErrorText(error?.response?.data?.message || "刪除班別失敗。");
    } finally {
      setDeleteSubmitting(false);
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

          <Tooltip title="班別配置">
            <IconButton size="small" onClick={() => handleOpenShiftConfig(row)}>
              <SettingsOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {!row.is_used ? (
            <Tooltip title="刪除">
              <IconButton size="small" onClick={() => handleOpenDelete(row)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
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
                班別
              </Typography>

              <Typography
                sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}
              >
                管理班別與行事曆、班次組合設定
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            >
              新增班別
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
                <Typography
                  sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                >
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
                  options={SHIFT_GROUP_STATUS_FILTER_OPTIONS}
                  displayEmpty
                  fullWidth
                  height="38px"
                  disabled={loading}
                />
              </Box>
            </Box>

            <Box
              sx={{ mt: "14px", display: "flex", justifyContent: "flex-end" }}
            >
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
              getRowKey={(row) => row.shift_group_id}
              mobileCardTitleKey="shift_group_name"
              emptyText="查無班別資料"
              renderValue={renderTableValue}
              fitToContainer
              pagination
              rowsPerPage={10}
            />
          </Box>
          <FormDialog
            open={formOpen}
            title={editingRow ? "編輯班別" : "新增班別"}
            submitLabel={editingRow ? "更新" : "新增"}
            submitting={submitting}
            maxWidth="sm"
            onClose={handleCloseForm}
            onSubmit={handleSubmit}
          >
            {formErrorText ? (
              <Alert severity="error">{formErrorText}</Alert>
            ) : null}

            <Box>
              <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
                班別代碼
              </Typography>

              <TextField
                value={form.shift_group_code}
                onChange={(event) =>
                  handleFormChange("shift_group_code", event.target.value)
                }
                placeholder="請輸入班別代碼"
                fullWidth
                size="small"
                disabled={submitting}
              />
            </Box>

            <Box>
              <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
                班別名稱
              </Typography>

              <TextField
                value={form.shift_group_name}
                onChange={(event) =>
                  handleFormChange("shift_group_name", event.target.value)
                }
                placeholder="請輸入班別名稱"
                fullWidth
                size="small"
                disabled={submitting}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: "14px",
              }}
            >
              <Box>
                <Typography
                  sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                >
                  每日基準工時
                </Typography>

                <TextField
                  type="number"
                  value={form.daily_base_hours}
                  onChange={(event) =>
                    handleFormChange("daily_base_hours", event.target.value)
                  }
                  inputProps={{
                    min: 0.01,
                    max: 24,
                    step: 0.5,
                  }}
                  fullWidth
                  size="small"
                  disabled={submitting}
                />
              </Box>

              <Box>
                <Typography
                  sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                >
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
              </Box>
            </Box>

            <Box>
              <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
                班次啟用日
              </Typography>

              <TextField
                type="date"
                value={form.shift_activation_date}
                onChange={(event) =>
                  handleFormChange("shift_activation_date", event.target.value)
                }
                fullWidth
                size="small"
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
              />

              <Typography
                sx={{ mt: "6px", fontSize: "13px", color: "#6b7280" }}
              >
                此日期為班次循環第 1 順序的起始日期。
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
                依預設班次產生班表
              </Typography>

              {editingRow ? (
                <Box>
                  <Typography
                    sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                  >
                    啟用狀態
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
                      checked={form.status === "active"}
                      onChange={(event) =>
                        handleFormChange(
                          "status",
                          event.target.checked ? "active" : "inactive",
                        )
                      }
                      disabled={submitting || Boolean(editingRow?.is_used)}
                    />

                    <Typography sx={{ fontSize: "14px", color: "#374151" }}>
                      {form.status === "active" ? "啟用" : "停用"}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{ mt: "4px", fontSize: "13px", color: "#6b7280" }}
                  >
                    {editingRow?.is_used
                      ? "此班別已有使用紀錄，無法變更啟用狀態。"
                      : "啟用前必須完成行事曆、適用班次、預設班次及班次啟用日設定。"}
                  </Typography>
                </Box>
              ) : null}

              <SelectField
                value={form.generate_schedule_from_default}
                onChange={(value) =>
                  handleFormChange("generate_schedule_from_default", value)
                }
                options={YES_NO_OPTIONS}
                fullWidth
                height="38px"
                disabled={submitting}
              />

              <Typography
                sx={{ mt: "6px", fontSize: "13px", color: "#6b7280" }}
              >
                選擇「否」時，之後產生班表將建立空白班表，不自動套用預設班次。
              </Typography>
            </Box>

            {!editingRow ? (
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                新增後班別將先保持停用，完成行事曆及班次設定後再啟用。
              </Typography>
            ) : null}
          </FormDialog>
          <FormDialog
            open={Boolean(shiftConfigRow)}
            title={`班別配置${shiftConfigRow?.shift_group_name ? `－${shiftConfigRow.shift_group_name}` : ""}`}
            submitLabel="儲存"
            submitting={submitting}
            maxWidth="sm"
            onClose={handleCloseShiftConfig}
            onSubmit={handleSaveShiftConfig}
          >
            {shiftConfigErrorText ? (
              <Alert severity="error">{shiftConfigErrorText}</Alert>
            ) : null}

            {shiftConfigLoading ? (
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
              <>
                <Box>
                  <Typography
                    sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                  >
                    行事曆
                  </Typography>

                  <SelectField
                    value={selectedCalendarId}
                    onChange={setSelectedCalendarId}
                    options={calendarOptions}
                    displayEmpty
                    fullWidth
                    height="38px"
                    disabled={submitting}
                  />

                  <Typography
                    sx={{ mt: "6px", fontSize: "13px", color: "#6b7280" }}
                  >
                    班別會使用此行事曆各年度的已發布資料產生班表。
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{ mb: "8px", fontSize: "15px", fontWeight: 500 }}
                  >
                    適用班次
                  </Typography>

                  <Typography
                    sx={{ mb: "10px", fontSize: "13px", color: "#6b7280" }}
                  >
                    僅顯示循環天數與此班別相同的啟用班次。
                  </Typography>

                  {shiftOptions.length === 0 ? (
                    <Alert severity="info">
                      目前沒有循環天數符合此班別的啟用班次。
                    </Alert>
                  ) : null}

                  <Box sx={{ display: "grid", gap: "8px" }}>
                    {shiftOptions.map((option) => {
                      const selected = selectedShiftIds.includes(option.value);

                      return (
                        <Box
                          key={option.value}
                          component="button"
                          type="button"
                          onClick={() => handleShiftToggle(option.value)}
                          sx={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            p: "10px 12px",
                            border: selected
                              ? "1px solid #1976d2"
                              : "1px solid #d1d5db",
                            borderRadius: "6px",
                            bgcolor: selected ? "#eff6ff" : "#ffffff",
                            color: "#111827",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <Box component="span">{option.label}</Box>
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                              color: selected ? "#1976d2" : "#9ca3af",
                            }}
                          >
                            {selected ? "已選擇" : "選擇"}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                <Box>
                  <Typography
                    sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                  >
                    預設班次
                  </Typography>

                  <SelectField
                    value={defaultShiftId}
                    onChange={setDefaultShiftId}
                    options={shiftOptions.filter((option) =>
                      selectedShiftIds.includes(option.value),
                    )}
                    fullWidth
                    height="38px"
                    disabled={submitting}
                  />
                </Box>
              </>
            )}
          </FormDialog>
          <FormDialog
            open={Boolean(futureUpdateDraft)}
            title={`未來班表更新${futureUpdateDraft?.shift_group_name ? `－${futureUpdateDraft.shift_group_name}` : ""}`}
            submitLabel={futureUpdatePreview ? "確認更新" : "預覽影響"}
            cancelLabel="取消"
            submitting={futureUpdateLoading}
            maxWidth="sm"
            onClose={handleCloseFutureUpdate}
            onSubmit={handleFutureUpdateSubmit}
          >
            {futureUpdateErrorText ? (
              <Alert severity="error">
                {futureUpdateErrorText}
              </Alert>
            ) : null}

            <Alert severity="warning">
              此班別已有使用紀錄。修改後將從指定的班表更新日起重新產生既有未來班表，今日及歷史班表不會變更。
            </Alert>

            <Box>
              <Typography
                sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
              >
                班表更新日
              </Typography>

              <TextField
                type="date"
                value={futureUpdateDate}
                onChange={(event) => {
                  setFutureUpdateDate(event.target.value);
                  setFutureUpdatePreview(null);
                  setFutureUpdateErrorText("");
                }}
                inputProps={{
                  min: getTomorrowDate(),
                }}
                fullWidth
                size="small"
                disabled={futureUpdateLoading}
                InputLabelProps={{ shrink: true }}
              />

              <Typography
                sx={{ mt: "6px", fontSize: "13px", color: "#6b7280" }}
              >
                更新日必須晚於今日。指定日期以前的班表與出勤資料不會被修改。
              </Typography>
            </Box>

            {futureUpdatePreview ? (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: "12px",
                  }}
                >
                  {[
                    {
                      label: "受影響員工",
                      value: `${Number(
                        futureUpdatePreview.affected_employee_count || 0,
                      )} 人`,
                    },
                    {
                      label: "受影響班別期間",
                      value: `${Number(
                        futureUpdatePreview.affected_assignment_count || 0,
                      )} 筆`,
                    },
                    {
                      label: "現有未來班表",
                      value: `${Number(
                        futureUpdatePreview.existing_schedule_count || 0,
                      )} 筆`,
                    },
                    {
                      label: "可重新產生",
                      value: `${Number(
                        futureUpdatePreview.regeneratable_schedule_count || 0,
                      )} 筆`,
                    },
                    {
                      label: "受保護班表",
                      value: `${Number(
                        futureUpdatePreview.protected_schedule_count || 0,
                      )} 筆`,
                    },
                    {
                      label: "目前班表最晚日期",
                      value: formatDate(
                        futureUpdatePreview.latest_schedule_date,
                      ),
                    },
                  ].map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        p: "12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        bgcolor: "#f9fafb",
                      }}
                    >
                      <Typography
                        sx={{
                          mb: "4px",
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        {item.label}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {Number(
                  futureUpdatePreview.protected_schedule_count || 0,
                ) > 0 ? (
                  <Alert severity="error">
                    受影響的未來班表已有出勤資料，目前無法進行班別更新。請先處理相關出勤紀錄。
                  </Alert>
                ) : (
                  <Alert severity="warning">
                    確認更新後，班別設定將立即更新，並從 {formatDate(futureUpdateDate)} 起重新產生目前既有的未來班表。此操作不會修改今日及歷史班表。
                  </Alert>
                )}
              </>
            ) : null}
          </FormDialog>

          <FormDialog
            open={Boolean(deleteRow)}
            title="確認刪除"
            submitLabel="刪除"
            cancelLabel="取消"
            submitting={deleteSubmitting}
            maxWidth="xs"
            onClose={handleCloseDelete}
            onSubmit={handleDelete}
          >
            <Typography
              sx={{
                fontSize: "15px",
                color: "#374151",
                lineHeight: 1.7,
              }}
            >
              {`確認刪除「${deleteRow?.shift_group_name || ""}」？已被使用的班別無法刪除。`}
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
