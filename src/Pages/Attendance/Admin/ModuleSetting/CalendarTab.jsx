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
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";

import {
  apiAttendanceCalendarDates,
  apiAttendanceCalendars,
  apiCreateAttendanceCalendar,
  apiDeactivateAttendanceCalendar,
  apiDeleteAttendanceCalendar,
  apiDeleteAttendanceCalendarDate,
  apiPublishAttendanceCalendar,
  apiSaveAttendanceCalendarDate,
  apiUpdateAttendanceCalendar,
} from "../../../../API/attendance";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import CalendarMonthView from "./CalendarMonthView";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";
import {
  CALENDAR_OVERRIDE_TYPE_OPTIONS,
  CALENDAR_STATUS_FILTER_OPTIONS,
  createCalendarYearOptions,
  getCalendarDateTypeOption,
  getCalendarStatusLabel,
} from "./moduleSettingOptions";

const CURRENT_YEAR = new Date().getFullYear();

const YEAR_OPTIONS = [
  { value: "", label: "全部年度" },
  ...createCalendarYearOptions(CURRENT_YEAR - 5, CURRENT_YEAR + 5),
];

const INITIAL_FILTERS = {
  year: "",
  status: "",
};

const INITIAL_FORM = {
  calendar_code: "",
  calendar_name: "",
  calendar_year: String(CURRENT_YEAR),
};

const TABLE_COLUMNS = [
  { key: "calendar_code", label: "行事曆代碼", width: "1fr" },
  { key: "calendar_name", label: "行事曆名稱", width: "1.15fr" },
  { key: "calendar_year_text", label: "年度", width: "0.75fr" },
  { key: "status_text", label: "狀態", width: "0.75fr" },
  { key: "published_at_text", label: "發布時間", width: "1fr" },
  { key: "updated_at_text", label: "最後更新", width: "1.15fr" },
  { key: "actions", label: "操作", width: "140px" },
];

function getItems(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
}

function formatDateTime(value) {
  const raw = String(value || "").trim();

  if (!raw) return "-";

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?/,
  );

  if (!match) return raw;

  return `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}`;
}

export default function CalendarTab() {
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
  const [detailRow, setDetailRow] = useState(null);
  const [detailDates, setDetailDates] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErrorText, setDetailErrorText] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(1);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dateForm, setDateForm] = useState({ event_type: "", event_name: "" });
  const [dateFormErrorText, setDateFormErrorText] = useState("");
  const [dateSubmitting, setDateSubmitting] = useState(false);
  const [publishRow, setPublishRow] = useState(null);
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const [actionRow, setActionRow] = useState(null);
  const [actionType, setActionType] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const displayRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      calendar_year_text: row.calendar_year ? `${row.calendar_year} 年` : "-",
      status_text: getCalendarStatusLabel(row.status),
      published_at_text: formatDateTime(row.published_at),
      updated_at_text: formatDateTime(row.updated_at),
    }));
  }, [rows]);

  const loadRows = useCallback(async (params = {}) => {
    const response = await apiAttendanceCalendars(params);
    setRows(getItems(response));
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const response = await apiAttendanceCalendars();

        if (active) {
          setRows(getItems(response));
        }
      } catch (error) {
        console.error(error);

        if (active) {
          setRows([]);
          setErrorText("無法載入行事曆資料。");
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

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSearch = async () => {
    setLoading(true);
    setErrorText("");

    try {
      await loadRows(filters);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入行事曆資料。");
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
      setErrorText("無法載入行事曆資料。");
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
    if (row.status === "published") {
      setErrorText("已發布的行事曆無法直接編輯基本資料。");
      return;
    }

    setEditingRow(row);
    setForm({
      calendar_code: row.calendar_code || "",
      calendar_name: row.calendar_name || "",
      calendar_year: String(row.calendar_year || CURRENT_YEAR),
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
    const calendarCode = form.calendar_code.trim();
    const calendarName = form.calendar_name.trim();
    const calendarYear = Number(form.calendar_year || 0);

    if (!calendarCode) {
      setFormErrorText("請輸入行事曆代碼。");
      return;
    }

    if (!calendarName) {
      setFormErrorText("請輸入行事曆名稱。");
      return;
    }

    if (
      !Number.isInteger(calendarYear) ||
      calendarYear < 2000 ||
      calendarYear > 2100
    ) {
      setFormErrorText("行事曆年度必須介於 2000 至 2100 年。");
      return;
    }

    const payload = {
      calendar_code: calendarCode,
      calendar_name: calendarName,
      calendar_year: calendarYear,
    };

    setSubmitting(true);
    setFormErrorText("");

    try {
      if (editingRow) {
        await apiUpdateAttendanceCalendar(editingRow.calendar_id, payload);
      } else {
        await apiCreateAttendanceCalendar(payload);
      }

      const editing = Boolean(editingRow);

      setFormOpen(false);
      setEditingRow(null);
      setForm(INITIAL_FORM);
      await loadRows(filters);

      setSuccessDialog({
        open: true,
        title: editing ? "更新成功" : "新增成功",
        message: editing ? "行事曆資料已成功更新。" : "行事曆資料已成功新增。",
      });
    } catch (error) {
      console.error(error);

      setFormErrorText(
        error?.response?.data?.message ||
          (editingRow ? "更新行事曆失敗。" : "新增行事曆失敗。"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const loadCalendarDates = async (calendarId) => {
    const response = await apiAttendanceCalendarDates(calendarId);
    const payload = response?.data ?? response;

    setDetailDates(Array.isArray(payload?.dates) ? payload.dates : []);
  };

  const handleOpenCalendarDetail = async (row) => {
    const calendarId = Number(row?.calendar_id || 0);
    const calendarYear = Number(row?.calendar_year || 0);

    if (calendarId <= 0 || calendarYear <= 0) return;

    setDetailRow(row);
    setDetailDates([]);
    setDetailErrorText("");
    setVisibleMonth(
      calendarYear === CURRENT_YEAR ? new Date().getMonth() + 1 : 1,
    );
    setDetailLoading(true);

    try {
      await loadCalendarDates(calendarId);
    } catch (error) {
      console.error(error);
      setDetailErrorText(
        error?.response?.data?.message || "無法載入行事曆日期資料。",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseCalendarDetail = () => {
    if (detailLoading || dateSubmitting) return;

    setDetailRow(null);
    setDetailDates([]);
    setDetailErrorText("");
    setVisibleMonth(1);
    setSelectedDay(null);
    setDateForm({ event_type: "", event_name: "" });
    setDateFormErrorText("");
  };

  const handlePrevMonth = () => {
    setVisibleMonth((current) => Math.max(1, current - 1));
  };

  const handleNextMonth = () => {
    setVisibleMonth((current) => Math.min(12, current + 1));
  };

  const handleSelectCalendarDate = (day) => {
    if (!day || !detailRow) return;

    if (["published", "inactive"].includes(detailRow.status)) {
      setDetailErrorText("已發布或已停用的行事曆無法直接修改日期設定。");
      return;
    }

    setSelectedDay(day);
    setDateForm({
      event_type: day.is_override ? day.effective_type || "" : "",
      event_name: day.is_override ? day.event_name || "" : "",
    });
    setDateFormErrorText("");
  };

  const handleCloseDateForm = () => {
    if (dateSubmitting) return;

    setSelectedDay(null);
    setDateForm({ event_type: "", event_name: "" });
    setDateFormErrorText("");
  };

  const handleDateFormChange = (field, value) => {
    setDateForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveCalendarDate = async () => {
    const calendarId = Number(detailRow?.calendar_id || 0);
    const eventDate = String(selectedDay?.date || "");
    const eventType = String(dateForm.event_type || "").trim();

    if (calendarId <= 0 || !eventDate) return;

    if (!eventType) {
      setDateFormErrorText("請選擇日期類型。");
      return;
    }

    setDateSubmitting(true);
    setDateFormErrorText("");

    try {
      await apiSaveAttendanceCalendarDate(calendarId, eventDate, {
        event_type: eventType,
        event_name: dateForm.event_name.trim(),
      });

      await loadCalendarDates(calendarId);

      setSelectedDay(null);
      setDateForm({ event_type: "", event_name: "" });

      setSuccessDialog({
        open: true,
        title: "更新成功",
        message: "行事曆日期設定已成功更新。",
      });
    } catch (error) {
      console.error(error);
      setDateFormErrorText(
        error?.response?.data?.message || "更新行事曆日期設定失敗。",
      );
    } finally {
      setDateSubmitting(false);
    }
  };

  const handleRevertCalendarDate = async () => {
    const calendarId = Number(detailRow?.calendar_id || 0);
    const eventDate = String(selectedDay?.date || "");

    if (calendarId <= 0 || !eventDate || !selectedDay?.is_override) return;

    setDateSubmitting(true);
    setDateFormErrorText("");

    try {
      await apiDeleteAttendanceCalendarDate(calendarId, eventDate);
      await loadCalendarDates(calendarId);

      setSelectedDay(null);
      setDateForm({ event_type: "", event_name: "" });

      setSuccessDialog({
        open: true,
        title: "還原成功",
        message: "日期已還原為原始行事曆設定。",
      });
    } catch (error) {
      console.error(error);
      setDateFormErrorText(
        error?.response?.data?.message || "還原行事曆日期設定失敗。",
      );
    } finally {
      setDateSubmitting(false);
    }
  };

  const handleOpenPublish = (row) => {
    if (!row || row.status !== "draft") return;

    setPublishRow(row);
    setErrorText("");
  };

  const handleClosePublish = () => {
    if (publishSubmitting) return;

    setPublishRow(null);
  };

  const handlePublishCalendar = async () => {
    const calendarId = Number(publishRow?.calendar_id || 0);

    if (calendarId <= 0) return;

    setPublishSubmitting(true);
    setErrorText("");

    try {
      await apiPublishAttendanceCalendar(calendarId);
      setPublishRow(null);
      await loadRows(filters);

      setSuccessDialog({
        open: true,
        title: "發布成功",
        message: "行事曆已成功發布。",
      });
    } catch (error) {
      console.error(error);
      setErrorText(error?.response?.data?.message || "發布行事曆失敗。");
    } finally {
      setPublishSubmitting(false);
    }
  };

  const handleOpenAction = (row, type) => {
    setActionRow(row);
    setActionType(type);
    setErrorText("");
  };

  const handleCloseAction = () => {
    if (actionSubmitting) return;

    setActionRow(null);
    setActionType("");
  };

  const handleActionSubmit = async () => {
    const calendarId = Number(actionRow?.calendar_id || 0);

    if (calendarId <= 0 || !actionType) return;

    setActionSubmitting(true);
    setErrorText("");

    try {
      if (actionType === "deactivate") {
        await apiDeactivateAttendanceCalendar(calendarId);
      } else if (actionType === "delete") {
        await apiDeleteAttendanceCalendar(calendarId);
      }

      const completedAction = actionType;

      setActionRow(null);
      setActionType("");
      await loadRows(filters);

      setSuccessDialog({
        open: true,
        title: completedAction === "deactivate" ? "停用成功" : "刪除成功",
        message:
          completedAction === "deactivate"
            ? "行事曆已成功停用。"
            : "行事曆已成功刪除。",
      });
    } catch (error) {
      console.error(error);
      setErrorText(
        error?.response?.data?.message ||
          (actionType === "deactivate"
            ? "停用行事曆失敗。"
            : "刪除行事曆失敗。"),
      );
    } finally {
      setActionSubmitting(false);
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
          <Tooltip title="查看行事曆">
            <IconButton
              size="small"
              onClick={() => handleOpenCalendarDetail(row)}
            >
              <CalendarMonthOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip
            title={
              ["published", "inactive"].includes(row.status)
                ? "已發布或已停用，無法直接編輯"
                : "編輯"
            }
          >
            <span>
              <IconButton
                size="small"
                disabled={["published", "inactive"].includes(row.status)}
                onClick={() => handleOpenEdit(row)}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {row.status === "draft" ? (
            <Tooltip title="發布">
              <IconButton size="small" onClick={() => handleOpenPublish(row)}>
                <PublishOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          {row.status === "draft" ? (
            <Tooltip title="刪除">
              <IconButton
                size="small"
                onClick={() => handleOpenAction(row, "delete")}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}

          {row.status === "published" ? (
            <Tooltip title="停用">
              <IconButton
                size="small"
                onClick={() => handleOpenAction(row, "deactivate")}
              >
                <BlockOutlinedIcon fontSize="small" />
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
            行事曆管理
          </Typography>

          <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
            建立及管理年度行事曆與特殊日期設定
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          新增行事曆
        </Button>
      </Box>

      <Box sx={{ mb: "18px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(2, minmax(0, 260px))",
            },
            gap: "14px",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              年度
            </Typography>

            <SelectField
              value={filters.year}
              onChange={(value) => handleFilterChange("year", value)}
              options={YEAR_OPTIONS}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              狀態
            </Typography>

            <SelectField
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              options={CALENDAR_STATUS_FILTER_OPTIONS}
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
          getRowKey={(row) => row.calendar_id}
          mobileCardTitleKey="calendar_name"
          emptyText="查無行事曆資料"
          renderValue={renderTableValue}
          fitToContainer
          pagination
          rowsPerPage={10}
        />
      </Box>
      <FormDialog
        open={formOpen}
        title={editingRow ? "編輯行事曆" : "新增行事曆"}
        submitLabel={editingRow ? "更新" : "新增"}
        submitting={submitting}
        maxWidth="sm"
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      >
        {formErrorText ? <Alert severity="error">{formErrorText}</Alert> : null}

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            行事曆代碼
          </Typography>

          <TextField
            value={form.calendar_code}
            onChange={(event) =>
              handleFormChange("calendar_code", event.target.value)
            }
            placeholder="例如 CAL-2026"
            fullWidth
            size="small"
            disabled={submitting}
          />
        </Box>

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            行事曆名稱
          </Typography>

          <TextField
            value={form.calendar_name}
            onChange={(event) =>
              handleFormChange("calendar_name", event.target.value)
            }
            placeholder="例如 2026 公司行事曆"
            fullWidth
            size="small"
            disabled={submitting}
          />
        </Box>

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            年度
          </Typography>

          <SelectField
            value={form.calendar_year}
            onChange={(value) => handleFormChange("calendar_year", value)}
            options={createCalendarYearOptions(
              CURRENT_YEAR - 5,
              CURRENT_YEAR + 5,
            )}
            fullWidth
            height="38px"
            disabled={submitting}
          />
        </Box>

        {!editingRow ? (
          <Typography
            sx={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6 }}
          >
            新增後將先建立為草稿；完成日期設定後再進行發布。
          </Typography>
        ) : null}
      </FormDialog>
      <FormDialog
        open={Boolean(detailRow)}
        title={
          detailRow ? `${detailRow.calendar_name}－行事曆明細` : "行事曆明細"
        }
        hideSubmit
        cancelLabel="關閉"
        maxWidth="lg"
        onClose={handleCloseCalendarDetail}
      >
        {detailErrorText ? (
          <Alert severity="error">{detailErrorText}</Alert>
        ) : null}

        {detailLoading ? (
          <Box
            sx={{
              minHeight: "360px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : detailRow ? (
          <Box>
            <Box
              sx={{
                mb: "14px",
                display: "flex",
                flexWrap: "wrap",
                gap: "8px 20px",
              }}
            >
              <Typography sx={{ fontSize: "14px", color: "#4b5563" }}>
                行事曆代碼：
                <Box
                  component="span"
                  sx={{ fontWeight: 700, color: "#111827" }}
                >
                  {detailRow.calendar_code || "-"}
                </Box>
              </Typography>

              <Typography sx={{ fontSize: "14px", color: "#4b5563" }}>
                年度：
                <Box
                  component="span"
                  sx={{ fontWeight: 700, color: "#111827" }}
                >
                  {detailRow.calendar_year || "-"}
                </Box>
              </Typography>

              <Typography sx={{ fontSize: "14px", color: "#4b5563" }}>
                狀態：
                <Box
                  component="span"
                  sx={{ fontWeight: 700, color: "#111827" }}
                >
                  {getCalendarStatusLabel(detailRow.status)}
                </Box>
              </Typography>
            </Box>

            <CalendarMonthView
              year={Number(detailRow.calendar_year)}
              month={visibleMonth}
              dates={detailDates}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSelectDate={handleSelectCalendarDate}
            />

            <Box
              sx={{
                mt: "14px",
                display: "flex",
                flexWrap: "wrap",
                gap: "12px 18px",
              }}
            >
              {[
                "workday",
                "special_workday",
                "regular_holiday",
                "national_holiday",
              ].map((type) => {
                const option = getCalendarDateTypeOption(type);

                if (!option) return null;

                return (
                  <Box
                    key={type}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Box
                      sx={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "3px",
                        bgcolor: option.color,
                        border: "1px solid #d1d5db",
                      }}
                    />

                    <Typography sx={{ fontSize: "13px", color: "#4b5563" }}>
                      {option.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ) : null}
      </FormDialog>

      <FormDialog
        open={Boolean(selectedDay)}
        title={selectedDay?.date ? `日期設定－${selectedDay.date}` : "日期設定"}
        submitLabel="儲存"
        submitting={dateSubmitting}
        maxWidth="sm"
        onClose={handleCloseDateForm}
        onSubmit={handleSaveCalendarDate}
      >
        {dateFormErrorText ? (
          <Alert severity="error">{dateFormErrorText}</Alert>
        ) : null}

        {selectedDay ? (
          <>
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
                  原始類型
                </Typography>

                <Typography sx={{ fontSize: "15px", color: "#374151" }}>
                  {getCalendarDateTypeOption(selectedDay.base_type)?.label ||
                    selectedDay.base_type ||
                    "-"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                >
                  目前類型
                </Typography>

                <Typography sx={{ fontSize: "15px", color: "#374151" }}>
                  {selectedDay.effective_type_label || "-"}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
                日期類型
              </Typography>

              <SelectField
                value={dateForm.event_type}
                onChange={(value) => handleDateFormChange("event_type", value)}
                options={CALENDAR_OVERRIDE_TYPE_OPTIONS}
                displayEmpty
                fullWidth
                height="38px"
                disabled={dateSubmitting}
              />
            </Box>

            <Box>
              <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
                名稱 / 備註
              </Typography>

              <TextField
                value={dateForm.event_name}
                onChange={(event) =>
                  handleDateFormChange("event_name", event.target.value)
                }
                placeholder="例如：公司補班日"
                fullWidth
                size="small"
                disabled={dateSubmitting}
              />
            </Box>

            {selectedDay.is_override ? (
              <Box
                sx={{
                  pt: "4px",
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRevertCalendarDate}
                  disabled={dateSubmitting}
                >
                  還原原始設定
                </Button>
              </Box>
            ) : null}
          </>
        ) : null}
      </FormDialog>

      <FormDialog
        open={Boolean(publishRow)}
        title="確認發布"
        submitLabel="發布"
        cancelLabel="取消"
        submitting={publishSubmitting}
        maxWidth="xs"
        onClose={handleClosePublish}
        onSubmit={handlePublishCalendar}
      >
        <Typography
          sx={{ fontSize: "15px", color: "#374151", lineHeight: 1.7 }}
        >
          {`確認發布「${publishRow?.calendar_name || ""}」？發布後將無法直接修改基本資料及日期設定。`}
        </Typography>
      </FormDialog>

      <FormDialog
        open={Boolean(actionRow)}
        title={actionType === "deactivate" ? "確認停用" : "確認刪除"}
        submitLabel={actionType === "deactivate" ? "停用" : "刪除"}
        cancelLabel="取消"
        submitting={actionSubmitting}
        maxWidth="xs"
        onClose={handleCloseAction}
        onSubmit={handleActionSubmit}
      >
        <Typography
          sx={{ fontSize: "15px", color: "#374151", lineHeight: 1.7 }}
        >
          {actionType === "deactivate"
            ? `確認停用「${actionRow?.calendar_name || ""}」？停用後將保留已發布的行事曆及日期資料，但不再作為有效行事曆使用。`
            : `確認刪除「${actionRow?.calendar_name || ""}」？只有從未發布過的草稿行事曆可以刪除。`}
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
