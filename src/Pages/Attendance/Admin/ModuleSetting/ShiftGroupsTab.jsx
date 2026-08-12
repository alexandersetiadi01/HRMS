import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  apiAttendanceShiftGroups,
  apiCreateAttendanceShiftGroup,
  apiUpdateAttendanceShiftGroup,
  apiAttendanceShiftGroupShifts,
  apiAttendanceShifts,
  apiSaveAttendanceShiftGroupShifts,
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
};

const TABLE_COLUMNS = [
  { key: "shift_group_code", label: "班別代碼", width: "1fr" },
  { key: "shift_group_name", label: "班別名稱", width: "1.2fr" },
  { key: "calendar_name_text", label: "行事曆", width: "1.2fr" },
  { key: "default_shift_name_text", label: "預設班次", width: "1.1fr" },
  { key: "shift_activation_date_text", label: "班次啟用日", width: "1fr" },
  { key: "status", label: "狀態", width: "0.8fr" },
  { key: "actions", label: "操作", width: "100px" },
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
  const [shiftOptions, setShiftOptions] = useState([]);
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);
  const [defaultShiftId, setDefaultShiftId] = useState("");
  const [shiftConfigLoading, setShiftConfigLoading] = useState(false);
  const [shiftConfigErrorText, setShiftConfigErrorText] = useState("");

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

    setSubmitting(true);
    setFormErrorText("");

    try {
      if (editingRow) {
        await apiUpdateAttendanceShiftGroup(editingRow.shift_group_id, payload);
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
    setShiftOptions([]);
    setSelectedShiftIds([]);
    setDefaultShiftId("");
    setShiftConfigErrorText("");
    setShiftConfigLoading(true);

    try {
      const [shiftResponse, configResponse] = await Promise.all([
        apiAttendanceShifts(),
        apiAttendanceShiftGroupShifts(shiftGroupId),
      ]);

      const shifts = getItems(shiftResponse);
      const configPayload = configResponse?.data ?? configResponse;
      const configuredShifts = Array.isArray(configPayload?.shifts)
        ? configPayload.shifts
        : [];

      const groupCycleDays = Number(row.cycle_days || 1);

      setShiftOptions(
        shifts
          .filter(
            (shift) =>
              ["active", "啟用"].includes(shift.status) &&
              Number(shift.cycle_days || 1) === groupCycleDays,
          )
          .map((shift) => ({
            value: String(shift.shift_id),
            label: `${shift.shift_code}－${shift.shift_name}`,
          })),
      );

      setSelectedShiftIds(
        configuredShifts.map((shift) => String(shift.shift_id)),
      );

      setDefaultShiftId(
        configPayload?.shift_group?.default_shift_id
          ? String(configPayload.shift_group.default_shift_id)
          : "",
      );
    } catch (error) {
      console.error(error);
      setShiftConfigErrorText(
        error?.response?.data?.message || "無法載入班別班次設定。",
      );
    } finally {
      setShiftConfigLoading(false);
    }
  };

  const handleCloseShiftConfig = () => {
    if (submitting) return;

    setShiftConfigRow(null);
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
      await apiSaveAttendanceShiftGroupShifts(shiftGroupId, {
        shift_ids: selectedShiftIds.map(Number),
        default_shift_id: Number(defaultShiftId),
      });

      setShiftConfigRow(null);
      setShiftOptions([]);
      setSelectedShiftIds([]);
      setDefaultShiftId("");
      await loadRows(filters);

      setSuccessDialog({
        open: true,
        title: "更新成功",
        message: "班別班次設定已成功更新。",
      });
    } catch (error) {
      console.error(error);
      setShiftConfigErrorText(
        error?.response?.data?.message || "更新班別班次設定失敗。",
      );
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

          <Tooltip title="班次設定">
            <IconButton size="small" onClick={() => handleOpenShiftConfig(row)}>
              <SettingsOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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

          <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
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
              options={SHIFT_GROUP_STATUS_FILTER_OPTIONS}
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
        {formErrorText ? <Alert severity="error">{formErrorText}</Alert> : null}

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
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
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

          <Typography sx={{ mt: "6px", fontSize: "13px", color: "#6b7280" }}>
            此日期為班次循環第 1 順序的起始日期。
          </Typography>
        </Box>

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            依預設班次產生班表
          </Typography>

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

          <Typography sx={{ mt: "6px", fontSize: "13px", color: "#6b7280" }}>
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
        title={`班次設定${shiftConfigRow?.shift_group_name ? `－${shiftConfigRow.shift_group_name}` : ""}`}
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
              <Typography sx={{ mb: "8px", fontSize: "15px", fontWeight: 500 }}>
                班次
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
              <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
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
