import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { fetchTaiwanCalendarYear } from "../../Utils/TaiwanHolidays";
import { apiAttendanceScheduleMonth } from "../../API/attendance";
import {
  formatCellKey,
  formatRange,
  getNextMonthYear,
  getPrevMonthYear,
  getTodayYearMonth,
  isSameDate,
  pad2,
} from "../../Utils/Calendar/DateHelpers";
import { getMonthGrid } from "../../Utils/Calendar/MonthGrid";
import { getDisplayHolidayName } from "../../Utils/Calendar/DayStatus";
import YearMonthPicker from "../../Utils/Calendar/YearMonthPicker";
import MobileCalendar from "../../Utils/Calendar/MobileCalendar";
import Breadcrumb from "../../Utils/Breadcrumb";

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

const SHIFT_FILTERS = [
  { key: "all", label: "全部", color: "#000000", dotColor: "#000000" },
  { key: "support", label: "支援", color: "#cfe8ff", dotColor: "#7ab8ff" },
  { key: "leave", label: "請假", color: "#f7b3c2", dotColor: "#f49aa6" },
  { key: "rest", label: "休假", color: "#d1d5db", dotColor: "#9ca3af" },
  { key: "trip", label: "公出/出差", color: "#f6b73c", dotColor: "#f5a623" },
  { key: "normal", label: "常日班", color: "#f5a04a", dotColor: "#f59a42" },
];

const DEFAULT_DAY_DATA = {
  schedule_id: 0,
  employee_id: 0,
  shift_id: 0,
  work_date: "",
  date: "",
  status: "",
  day_type: "unscheduled",
  filter_key: "rest",
  title: "未排班",
  time: "",
  display_title: "未排班",
  display_subtitle: "",
  display_time: "",
  expected_start: null,
  expected_end: null,
  break_minutes: 0,
  block_bg: "#d9dde3",
  text_color: "#111827",
  people_color: "#22c55e",
  shift_name: "",
  employee_no: "",
  display_name: "",
  attendance_status: "",
  actual_in: null,
  actual_out: null,
  late_minutes: 0,
  early_leave_minutes: 0,
  worked_hours: 0,
  leave_hours: 0,
  overtime_hours: 0,
  has_clock_in: false,
  has_clock_out: false,
  is_overtime_day: false,
  is_attendance_ready: false,
  has_approved_overtime: false,
  overtime_request_ids: [],
  overtime_approved_hours: 0,
  overtime_requested_hours: 0,
  leave_request_id: 0,
  leave_type_id: 0,
  leave_code: "",
  leave_name: "",
  leave_relation_type: "",
  leave_display_name: "",
  leave_filter_key: "",
  entitlement_instance_id: 0,
  leave_request_status: "",
  leave_reason: "",
  leave_requested_hours: 0,
  indicator: {
    show: false,
    icon: "person",
    color: "#9ca3af",
    count: 1,
    status: "none",
  },
};

function getNormalizedAttendanceStatus(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();

  if (!raw) {
    return {
      raw,
      base: "",
      hasMissedClockIn: false,
      hasMissedClockOut: false,
    };
  }

  const hasMissedClockIn = raw.includes("missed clock-in");
  const hasMissedClockOut = raw.includes("missed clock-out");

  const base = raw.replace(/\s*\(missed clock-in\/out\)\s*/g, "").trim();

  return {
    raw,
    base,
    hasMissedClockIn,
    hasMissedClockOut,
  };
}

function getMissedPunchDetailSuffix(dayData) {
  const parsed = getNormalizedAttendanceStatus(dayData?.attendance_status);

  if (parsed.hasMissedClockIn && parsed.hasMissedClockOut) {
    return "（忘打卡【上/下班】）";
  }

  if (parsed.hasMissedClockIn) {
    return "（忘打卡【上班】）";
  }

  if (parsed.hasMissedClockOut) {
    return "（忘打卡【下班】）";
  }

  return "";
}

function AttendanceIndicator({ indicator, fallbackColor = "#22c55e" }) {
  const safeIndicator = indicator || {};
  const show = safeIndicator.show !== false;
  const color = safeIndicator.color || fallbackColor;

  if (!show) {
    return null;
  }

  return (
    <PersonRoundedIcon
      sx={{
        fontSize: { xs: "14px", sm: "18px" },
        color,
      }}
    />
  );
}

function SidebarCard({ title, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #b9b9b9",
        borderRadius: 0,
        overflow: "hidden",
        bgcolor: "#ffffff",
      }}
    >
      <Box
        sx={{
          px: "14px",
          py: "10px",
          borderBottom: "1px solid #b9b9b9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}
        >
          {title}
        </Typography>
        <Typography
          sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}
        >
          ▼
        </Typography>
      </Box>

      <Box sx={{ p: "14px" }}>{children}</Box>
    </Paper>
  );
}

function DetailField({ label, value, valueColor = "#111827" }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "92px 1fr", sm: "110px 1fr" },
        gap: "12px",
        alignItems: "start",
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: "14px", sm: "15px" },
          fontWeight: 700,
          color: "#6b7280",
          lineHeight: 1.5,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: { xs: "14px", sm: "15px" },
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {value || "－"}
      </Typography>
    </Box>
  );
}

function formatDateDisplay(date) {
  if (!date) {
    return "";
  }

  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(
    date.getDate(),
  )}`;
}

function formatDateTimeDisplay(value) {
  if (!value || typeof value !== "string") {
    return "－";
  }

  const normalized = value.trim();
  if (!normalized) {
    return "－";
  }

  if (normalized.length >= 16) {
    return normalized.slice(0, 16).replace("T", " ");
  }

  return normalized.replace("T", " ");
}

function formatExpectedTime(dayData) {
  const start = dayData?.expected_start;
  const end = dayData?.expected_end;

  if (!start || !end) {
    return "－";
  }

  const startTime = String(start).slice(11, 16);
  const endTime = String(end).slice(11, 16);

  if (!startTime || !endTime) {
    return "－";
  }

  return `${startTime} ~ ${endTime}`;
}

function formatActualTime(dayData) {
  const displayTime = dayData?.display_time || dayData?.time || "";

  if (!displayTime) {
    return "－";
  }

  return displayTime.replace("~", " ~ ");
}

function formatHoursText(value) {
  const numeric = Number(value || 0);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "0 小時";
  }

  return `${numeric} 小時`;
}

function formatMinutesText(value) {
  const numeric = Number(value || 0);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "0 分鐘";
  }

  return `${numeric} 分鐘`;
}

function formatSummaryMinutes(hours, minutes) {
  const safeHours = Number(hours || 0);
  const safeMinutes = Number(minutes || 0);

  return `${Number.isFinite(safeHours) ? safeHours : 0} 時 ${
    Number.isFinite(safeMinutes) ? safeMinutes : 0
  } 分`;
}

function getLeaveDisplayName(dayData) {
  const displayName = String(dayData?.leave_display_name || "").trim();
  const leaveName = String(dayData?.leave_name || "").trim();
  const relationType = String(dayData?.leave_relation_type || "").trim();

  if (displayName) {
    return displayName;
  }

  if (leaveName && relationType) {
    return `${leaveName} - ${relationType}`;
  }

  if (leaveName) {
    return leaveName;
  }

  return "";
}

function buildLeaveTypeFilterKey(leaveTypeId) {
  return `leave-type:${leaveTypeId}`;
}

function buildLeaveFilterGroups(leaveBreakdown = []) {
  const groupMap = {};

  leaveBreakdown.forEach((item) => {
    const leaveTypeId = Number(item?.leave_type_id || 0);
    const leaveName = String(item?.leave_name || "").trim();
    const relationType = String(item?.relation_type || "").trim();
    const filterKey = String(item?.filter_key || "").trim();
    const displayName = String(item?.display_name || "").trim();

    if (!filterKey) {
      return;
    }

    const safeLeaveTypeId = leaveTypeId || filterKey;
    const safeLeaveName = leaveName || displayName || "請假";

    if (!groupMap[leaveTypeId]) {
      groupMap[leaveTypeId] = {
        leave_type_id: leaveTypeId,
        leave_name: leaveName,
        filter_key: buildLeaveTypeFilterKey(leaveTypeId),
        children: [],
      };
    }

    groupMap[leaveTypeId].children.push({
      leave_type_id: leaveTypeId,
      leave_name: leaveName,
      relation_type: relationType,
      filter_key: filterKey,
      display_name:
        displayName ||
        (relationType ? `${leaveName} - ${relationType}` : leaveName),
    });
  });

  return Object.values(groupMap);
}

function getDisplayTitle(dayData, fallbackHolidayName = "") {
  return (
    dayData?.display_title ||
    dayData?.title ||
    fallbackHolidayName ||
    DEFAULT_DAY_DATA.display_title
  );
}

function getDetailStatusLabel(dayData) {
  const parsed = getNormalizedAttendanceStatus(dayData?.attendance_status);
  const attendanceStatus = parsed.base;
  const indicatorStatus = String(
    dayData?.indicator?.status || "",
  ).toLowerCase();
  const missedPunchSuffix = getMissedPunchDetailSuffix(dayData);

  let baseLabel = "";

  if (dayData?.day_type === "leave") {
    baseLabel = "請假";
  } else if (dayData?.day_type === "rest") {
    baseLabel = "休假";
  } else if (dayData?.day_type === "unscheduled") {
    baseLabel = "未排班";
  } else if (
    indicatorStatus === "overtime" ||
    dayData?.is_overtime_day ||
    attendanceStatus === "overtime"
  ) {
    baseLabel = "已出勤（含加班）";
  } else if (indicatorStatus === "warning") {
    baseLabel = "異常出勤";
  } else if (indicatorStatus === "problem") {
    baseLabel = "缺卡 / 異常";
  } else if (indicatorStatus === "clocked_in") {
    baseLabel = "已上班，尚未下班";
  } else if (indicatorStatus === "on_time") {
    baseLabel = "正常出勤";
  } else if (attendanceStatus === "leave") {
    baseLabel = "請假";
  } else if (
    ["missing_clock_in", "missing_clock_out", "absent"].includes(
      attendanceStatus,
    )
  ) {
    baseLabel = "缺卡 / 異常";
  } else if (
    ["late", "early_leave", "late_early_leave"].includes(attendanceStatus)
  ) {
    baseLabel = "異常出勤";
  } else if (dayData?.has_clock_in) {
    baseLabel = "已出勤";
  } else {
    baseLabel = "尚未打卡";
  }

  return `${baseLabel}${missedPunchSuffix}`;
}

function getStatusColor(dayData) {
  if (dayData?.indicator?.show === false) {
    return "#6b7280";
  }

  return dayData?.indicator?.color || "#111827";
}

function getScheduleDayMap(days) {
  const map = {};

  if (!Array.isArray(days)) {
    return map;
  }

  days.forEach((item) => {
    const key = item?.work_date;
    if (typeof key === "string" && key !== "") {
      map[key] = item;
    }
  });

  return map;
}

function getScheduleDayData(date, scheduleDayMap) {
  if (!date) {
    return null;
  }

  const key = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;

  return scheduleDayMap[key] || null;
}

function shouldDisplayDay(selectedFilters, dayData) {
  if (selectedFilters.includes("all")) {
    return true;
  }

  const filterKey = String(dayData?.filter_key || "");
  const dayType = String(dayData?.day_type || "");

  return selectedFilters.some((selectedFilter) => {
    if (selectedFilter === "leave") {
      return dayType === "leave" || filterKey === "leave";
    }

    return filterKey === selectedFilter;
  });
}

function AttendanceDetailDialog({
  open,
  onClose,
  selectedDate,
  dayData,
  holidayMap,
  isMobile,
}) {
  const fallbackHolidayName = selectedDate
    ? getDisplayHolidayName(selectedDate, holidayMap)
    : "";
  const displayTitle = getDisplayTitle(dayData, fallbackHolidayName);
  const displaySubtitle = dayData?.display_subtitle || "";
  const statusLabel = getDetailStatusLabel(dayData);
  const statusColor = getStatusColor(dayData);
  const leaveLabel =
    getLeaveDisplayName(dayData) ||
    dayData?.leave_code ||
    (dayData?.day_type === "leave" ? "請假" : "－");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : "16px",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: "16px", sm: "22px" },
          py: { xs: "14px", sm: "18px" },
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: { xs: "18px", sm: "22px" },
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.2,
                mb: "4px",
              }}
            >
              出勤明細
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: "13px", sm: "14px" },
                color: "#6b7280",
                lineHeight: 1.4,
              }}
            >
              {formatDateDisplay(selectedDate)}
            </Typography>
          </Box>

          <IconButton onClick={onClose} sx={{ mt: "-4px", mr: "-6px" }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: { xs: "16px", sm: "22px" } }}>
          <Box
            sx={{
              borderRadius: "16px",
              bgcolor: dayData?.block_bg || "#d9dde3",
              color: dayData?.text_color || "#111827",
              px: { xs: "14px", sm: "18px" },
              py: { xs: "14px", sm: "18px" },
              mb: "18px",
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: "20px", sm: "24px" },
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {displayTitle}
            </Typography>

            {displaySubtitle ? (
              <Typography
                sx={{
                  fontSize: { xs: "14px", sm: "16px" },
                  fontWeight: 700,
                  lineHeight: 1.35,
                  mt: "6px",
                }}
              >
                {displaySubtitle}
              </Typography>
            ) : null}

            {dayData?.display_time ? (
              <Typography
                sx={{
                  fontSize: { xs: "14px", sm: "16px" },
                  fontWeight: 700,
                  lineHeight: 1.35,
                  mt: "6px",
                }}
              >
                {formatActualTime(dayData)}
              </Typography>
            ) : null}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                mt: "12px",
              }}
            >
              <AttendanceIndicator
                indicator={dayData?.indicator}
                fallbackColor={dayData?.people_color || "#22c55e"}
              />

              <Typography
                sx={{
                  fontSize: { xs: "14px", sm: "15px" },
                  fontWeight: 700,
                  color:
                    dayData?.indicator?.show === false
                      ? "#ffffff"
                      : statusColor,
                }}
              >
                {statusLabel}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <DetailField label="班次名稱" value={displayTitle} />
            <DetailField label="班表時間" value={formatExpectedTime(dayData)} />
            <DetailField
              label="實際上班"
              value={formatDateTimeDisplay(dayData?.actual_in)}
            />
            <DetailField
              label="實際下班"
              value={formatDateTimeDisplay(dayData?.actual_out)}
            />
            <DetailField
              label="出勤狀態"
              value={statusLabel}
              valueColor={statusColor}
            />
            <DetailField
              label="遲到分鐘"
              value={formatMinutesText(dayData?.late_minutes)}
            />
            <DetailField
              label="早退分鐘"
              value={formatMinutesText(dayData?.early_leave_minutes)}
            />
            <DetailField
              label="工時"
              value={formatHoursText(dayData?.worked_hours)}
            />
            <DetailField
              label="加班時數"
              value={
                dayData?.overtime_hours > 0
                  ? formatHoursText(dayData?.overtime_hours)
                  : dayData?.overtime_approved_hours > 0
                    ? formatHoursText(dayData?.overtime_approved_hours)
                    : "0 小時"
              }
              valueColor={dayData?.is_overtime_day ? "#2563eb" : "#111827"}
            />
            <DetailField label="請假類別" value={leaveLabel} />
            <DetailField
              label="請假時數"
              value={
                dayData?.leave_requested_hours > 0
                  ? formatHoursText(dayData?.leave_requested_hours)
                  : "0 小時"
              }
            />
            <DetailField
              label="備註"
              value={dayData?.leave_reason || fallbackHolidayName || "－"}
            />
          </Box>

          <Divider sx={{ my: "18px" }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: "12px",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                p: "14px",
                bgcolor: "#ffffff",
              }}
            >
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#6b7280",
                  mb: "8px",
                }}
              >
                員工資訊
              </Typography>

              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#111827",
                  lineHeight: 1.5,
                }}
              >
                {dayData?.display_name || "－"}
              </Typography>

              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#6b7280",
                  lineHeight: 1.5,
                }}
              >
                工號：{dayData?.employee_no || "－"}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                p: "14px",
                bgcolor: "#ffffff",
              }}
            >
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#6b7280",
                  mb: "8px",
                }}
              >
                打卡概況
              </Typography>

              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#111827",
                  lineHeight: 1.6,
                }}
              >
                已上班：{dayData?.has_clock_in ? "是" : "否"}
              </Typography>

              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#111827",
                  lineHeight: 1.6,
                }}
              >
                已下班：{dayData?.has_clock_out ? "是" : "否"}
              </Typography>

              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#111827",
                  lineHeight: 1.6,
                }}
              >
                加班日：{dayData?.is_overtime_day ? "是" : "否"}
              </Typography>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function CalendarDayCell({
  date,
  today,
  holidayMap,
  scheduleDayMap,
  selectedFilters,
  leaveFilterGroups,
  onClickDate,
}) {
  if (!date) {
    return (
      <Box
        sx={{
          minHeight: { xs: "82px", sm: "160px" },
          borderRight: "1px solid #303030",
          borderBottom: "1px solid #303030",
          bgcolor: "#f5f5f5",
        }}
      />
    );
  }

  const scheduleDay = getScheduleDayData(date, scheduleDayMap);
  const dayData = scheduleDay || DEFAULT_DAY_DATA;
  const fallbackHolidayName = getDisplayHolidayName(date, holidayMap);
  const displayTitle = getDisplayTitle(dayData, fallbackHolidayName);
  const displaySubtitle = dayData?.display_subtitle || "";
  const displayTime = dayData?.display_time || dayData?.time || "";
  const isToday = isSameDate(date, today);
  const isVisible = shouldDisplayDay(selectedFilters, dayData);

  return (
    <Box
      onClick={() => onClickDate?.(date)}
      sx={{
        minHeight: { xs: "82px", sm: "160px" },
        borderRight: "1px solid #303030",
        borderBottom: "1px solid #303030",
        bgcolor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        outline: isToday ? "2px solid #0c93d4" : "none",
        outlineOffset: "-2px",
        opacity: isVisible ? 1 : 0.22,
        cursor: "pointer",
        transition: "0.2s ease",
        "&:hover": {
          boxShadow: "inset 0 0 0 2px #0c93d4",
        },
      }}
    >
      <Box
        sx={{
          height: { xs: "22px", sm: "34px" },
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          px: { xs: "4px", sm: "8px" },
          fontSize: { xs: "11px", sm: "16px" },
          fontWeight: isToday ? 700 : 500,
          color: isToday ? "#ffffff" : "#1e3a8a",
          bgcolor: isToday ? "#0c93d4" : "#ffffff",
        }}
      >
        {pad2(date.getDate())}
      </Box>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            flex: 1,
            bgcolor: dayData.block_bg || "#d9dde3",
            color: dayData.text_color || "#111827",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: { xs: "2px", sm: "8px" },
            py: { xs: "4px", sm: "10px" },
            wordBreak: "break-word",
            overflow: "hidden",
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: "9px", sm: "15px" },
              fontWeight: 700,
              lineHeight: { xs: 1.15, sm: 1.35 },
              wordBreak: "break-word",
            }}
          >
            {displayTitle}
          </Typography>

          {displaySubtitle ? (
            <Typography
              sx={{
                fontSize: { xs: "8px", sm: "13px" },
                fontWeight: 700,
                mt: { xs: "2px", sm: "4px" },
                lineHeight: { xs: 1.15, sm: 1.3 },
                wordBreak: "break-word",
              }}
            >
              {displaySubtitle}
            </Typography>
          ) : null}

          {displayTime ? (
            <Typography
              sx={{
                fontSize: { xs: "8px", sm: "14px" },
                fontWeight: 700,
                mt: { xs: "2px", sm: "6px" },
                lineHeight: { xs: 1.15, sm: 1.35 },
                wordBreak: "break-word",
              }}
            >
              {displayTime}
            </Typography>
          ) : null}
        </Box>

        <Box
          sx={{
            height: { xs: "22px", sm: "42px" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#ffffff",
          }}
        >
          <AttendanceIndicator
            indicator={dayData.indicator}
            fallbackColor={dayData.people_color || "#22c55e"}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default function AttendanceSchedule() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const today = new Date();
  const todayYearMonth = getTodayYearMonth();

  const [selectedYear, setSelectedYear] = useState(todayYearMonth.year);
  const [selectedMonth, setSelectedMonth] = useState(todayYearMonth.month);
  const [holidayMap, setHolidayMap] = useState({});
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidaySourceNote, setHolidaySourceNote] = useState("");
  const [selectedFilters, setSelectedFilters] = useState(["all"]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [scheduleDays, setScheduleDays] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSummary, setScheduleSummary] = useState({
    work_minutes: 0,
    leave_minutes: 0,
    rest_minutes: 0,
    overtime_minutes: 0,
    work_hours: 0,
    work_remaining_minutes: 0,
    leave_hours: 0,
    leave_remaining_minutes: 0,
    rest_hours: 0,
    rest_remaining_minutes: 0,
    overtime_hours: 0,
    overtime_remaining_minutes: 0,
    leave_breakdown: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadYearCalendar() {
      setHolidayLoading(true);
      setHolidaySourceNote("");

      try {
        const map = await fetchTaiwanCalendarYear(selectedYear);

        if (!cancelled) {
          setHolidayMap(map || {});

          if (!map || Object.keys(map).length === 0) {
            setHolidaySourceNote(
              "該年度尚無已發布的官方行事曆資料，先以週末休假顯示。",
            );
          }
        }
      } catch (error) {
        console.error("Failed to load Taiwan calendar:", error);

        if (!cancelled) {
          setHolidayMap({});
          setHolidaySourceNote("台灣行事曆資料載入失敗，先以週末休假顯示。");
        }
      } finally {
        if (!cancelled) {
          setHolidayLoading(false);
        }
      }
    }

    loadYearCalendar();

    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  useEffect(() => {
    let cancelled = false;

    async function loadScheduleMonth() {
      setScheduleLoading(true);
      setScheduleError("");

      try {
        const res = await apiAttendanceScheduleMonth({
          year: selectedYear,
          month: selectedMonth,
        });

        const payload = res?.data || {};
        const days = Array.isArray(payload?.days) ? payload.days : [];
        const summary = payload?.summary || {
          work_minutes: 0,
          leave_minutes: 0,
          rest_minutes: 0,
          overtime_minutes: 0,
          work_hours: 0,
          work_remaining_minutes: 0,
          leave_hours: 0,
          leave_remaining_minutes: 0,
          rest_hours: 0,
          rest_remaining_minutes: 0,
          overtime_hours: 0,
          overtime_remaining_minutes: 0,
        };

        if (!cancelled) {
          setScheduleDays(days);
          setScheduleSummary(summary);
        }
      } catch (error) {
        console.error("Failed to load attendance schedule month:", error);

        if (!cancelled) {
          setScheduleDays([]);
          setScheduleSummary({
            work_minutes: 0,
            leave_minutes: 0,
            rest_minutes: 0,
            overtime_minutes: 0,
            work_hours: 0,
            work_remaining_minutes: 0,
            leave_hours: 0,
            leave_remaining_minutes: 0,
            rest_hours: 0,
            rest_remaining_minutes: 0,
            overtime_hours: 0,
            overtime_remaining_minutes: 0,
            leave_breakdown: [],
          });
          setScheduleError("班表資料載入失敗。");
        }
      } finally {
        if (!cancelled) {
          setScheduleLoading(false);
        }
      }
    }

    loadScheduleMonth();

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedMonth]);

  const monthGrid = useMemo(
    () => getMonthGrid(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
  );

  const scheduleDayMap = useMemo(
    () => getScheduleDayMap(scheduleDays),
    [scheduleDays],
  );

  useEffect(() => {
    const currentMonthDates = monthGrid.flat().filter(Boolean);
    if (currentMonthDates.length === 0) {
      return;
    }

    const todayInView = currentMonthDates.find((date) =>
      isSameDate(date, today),
    );

    setSelectedDate(
      todayInView || currentMonthDates[currentMonthDates.length - 1],
    );
  }, [selectedYear, selectedMonth]);

  const selectedDayData = useMemo(() => {
    if (!selectedDate) {
      return DEFAULT_DAY_DATA;
    }

    return getScheduleDayData(selectedDate, scheduleDayMap) || DEFAULT_DAY_DATA;
  }, [selectedDate, scheduleDayMap]);

  const monthTitle = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth - 1, 1);
    return date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [selectedYear, selectedMonth]);

  function handleOpenDateDetail(date) {
    if (!date) {
      return;
    }

    setSelectedDate(date);
    setDetailOpen(true);
  }

  function handleCloseDateDetail() {
    setDetailOpen(false);
  }

  function isFilterChecked(filterKey) {
    return (
      selectedFilters.includes("all") || selectedFilters.includes(filterKey)
    );
  }

  function handleSelectFilter(filterKey) {
    if (filterKey === "all") {
      setSelectedFilters(["all"]);
      return;
    }

    setSelectedFilters((prev) => {
      const current = prev.includes("all") ? [] : prev;
      const exists = current.includes(filterKey);

      const next = exists
        ? current.filter((item) => item !== filterKey)
        : [...current, filterKey];

      return next.length > 0 ? next : ["all"];
    });
  }

  const sidebarSummary =
    scheduleSummary?.sidebar_summary || scheduleSummary || {};

  return (
    <Box>
      <Breadcrumb rootLabel="個人專區" currentLabel="個人班表" mb="14px" />

      <Typography
        sx={{
          fontSize: { xs: "28px", md: "32px" },
          fontWeight: 700,
          color: "#111827",
          mb: "20px",
        }}
      >
        個人班表
      </Typography>

      <AttendanceDetailDialog
        open={detailOpen}
        onClose={handleCloseDateDetail}
        selectedDate={selectedDate}
        dayData={selectedDayData}
        holidayMap={holidayMap}
        isMobile={isMobile}
      />

      {isMobile ? (
        <>
          <MobileCalendar
            filters={SHIFT_FILTERS}
            selectedFilter={
              selectedFilters.includes("all") ? "all" : selectedFilters[0]
            }
            onSelectFilter={(value) => setSelectedFilters([value])}
            monthTitle={monthTitle}
            monthGrid={monthGrid}
            holidayMap={holidayMap}
            scheduleDayMap={scheduleDayMap}
            selectedDate={selectedDate}
            onSelectDate={handleOpenDateDetail}
            workHours={sidebarSummary.work_hours}
            workMinutes={sidebarSummary.work_remaining_minutes}
            leaveHours={sidebarSummary.leave_hours}
            leaveMinutes={sidebarSummary.leave_remaining_minutes}
            restHours={sidebarSummary.rest_hours}
            restMinutes={sidebarSummary.rest_remaining_minutes}
            onPrevMonth={() => {
              const prev = getPrevMonthYear(selectedYear, selectedMonth);
              setSelectedYear(prev.year);
              setSelectedMonth(prev.month);
            }}
            onNextMonth={() => {
              const next = getNextMonthYear(selectedYear, selectedMonth);
              setSelectedYear(next.year);
              setSelectedMonth(next.month);
            }}
          />

          {scheduleLoading ? (
            <Typography sx={{ fontSize: "14px", color: "#6b7280", mt: "12px" }}>
              載入班表資料中...
            </Typography>
          ) : scheduleError ? (
            <Typography sx={{ fontSize: "14px", color: "#b91c1c", mt: "12px" }}>
              {scheduleError}
            </Typography>
          ) : holidayLoading ? (
            <Typography sx={{ fontSize: "14px", color: "#6b7280", mt: "12px" }}>
              載入台灣行事曆中...
            </Typography>
          ) : holidaySourceNote ? (
            <Typography sx={{ fontSize: "14px", color: "#b45309", mt: "12px" }}>
              {holidaySourceNote}
            </Typography>
          ) : null}
        </>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              mb: "14px",
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{ fontSize: "16px", fontWeight: 700, color: "#374151" }}
            >
              年度/月份
            </Typography>

            <YearMonthPicker
              valueYear={selectedYear}
              valueMonth={selectedMonth}
              onConfirm={(year, month) => {
                setSelectedYear(year);
                setSelectedMonth(month);
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              mb: "8px",
            }}
          >
            <Typography
              sx={{ fontSize: "16px", color: "#374151", width: "100%" }}
            >
              簽核中：{formatRange(selectedYear, selectedMonth)}
            </Typography>

            <Button
              variant="outlined"
              onClick={() => {
                const prev = getPrevMonthYear(selectedYear, selectedMonth);
                setSelectedYear(prev.year);
                setSelectedMonth(prev.month);
              }}
              sx={{
                minWidth: "78px",
                height: "36px",
                borderRadius: 0,
                fontSize: "14px",
                color: "#111827",
                borderColor: "#b9b9b9",
              }}
            >
              上一月
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                const next = getNextMonthYear(selectedYear, selectedMonth);
                setSelectedYear(next.year);
                setSelectedMonth(next.month);
              }}
              sx={{
                minWidth: "78px",
                height: "36px",
                borderRadius: 0,
                fontSize: "14px",
                color: "#111827",
                borderColor: "#b9b9b9",
              }}
            >
              下一月
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                const current = getTodayYearMonth();
                setSelectedYear(current.year);
                setSelectedMonth(current.month);
              }}
              sx={{
                minWidth: "78px",
                height: "36px",
                borderRadius: 0,
                fontSize: "14px",
                color: "#111827",
                borderColor: "#b9b9b9",
              }}
            >
              今天
            </Button>
          </Box>

          {scheduleLoading ? (
            <Typography sx={{ fontSize: "14px", color: "#6b7280", mb: "16px" }}>
              載入班表資料中...
            </Typography>
          ) : scheduleError ? (
            <Typography sx={{ fontSize: "14px", color: "#b91c1c", mb: "16px" }}>
              {scheduleError}
            </Typography>
          ) : holidayLoading ? (
            <Typography sx={{ fontSize: "14px", color: "#6b7280", mb: "16px" }}>
              載入台灣行事曆中...
            </Typography>
          ) : holidaySourceNote ? (
            <Typography sx={{ fontSize: "14px", color: "#b45309", mb: "16px" }}>
              {holidaySourceNote}
            </Typography>
          ) : (
            <Box sx={{ mb: "24px" }} />
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 180px" },
              gap: "18px",
              alignItems: "start",
            }}
          >
            <Box sx={{ width: "100%" }}>
              <Box
                sx={{
                  border: "1px solid #303030",
                  bgcolor: "#ffffff",
                  overflow: "hidden",
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                  }}
                >
                  {WEEK_LABELS.map((label) => (
                    <Box
                      key={label}
                      sx={{
                        height: { xs: "32px", sm: "48px" },
                        bgcolor: "#333333",
                        color: "#ffffff",
                        fontSize: { xs: "12px", sm: "18px" },
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRight: "1px solid #111111",
                        px: { xs: "1px", sm: 0 },
                      }}
                    >
                      {label}
                    </Box>
                  ))}
                </Box>

                {monthGrid.map((week, rowIndex) => (
                  <Box
                    key={`${selectedYear}-${selectedMonth}-week-${rowIndex}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                    }}
                  >
                    {week.map((date, colIndex) => (
                      <CalendarDayCell
                        key={
                          date
                            ? formatCellKey(
                                date.getFullYear(),
                                date.getMonth() + 1,
                                date.getDate(),
                              )
                            : `empty-${rowIndex}-${colIndex}`
                        }
                        date={date}
                        today={today}
                        holidayMap={holidayMap}
                        scheduleDayMap={scheduleDayMap}
                        selectedFilters={selectedFilters}
                        onClickDate={handleOpenDateDetail}
                      />
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Paper
                elevation={0}
                sx={{
                  border: "1px solid #b9b9b9",
                  borderRadius: 0,
                  p: "14px",
                  bgcolor: "#ffffff",
                  minHeight: "160px",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#111827",
                    mb: "10px",
                  }}
                >
                  統計
                </Typography>

                <Typography
                  sx={{ fontSize: "16px", color: "#374151", mb: "6px" }}
                >
                  上班時數：
                  {formatSummaryMinutes(
                    sidebarSummary.work_hours,
                    sidebarSummary.work_remaining_minutes,
                  )}
                </Typography>

                <Typography
                  sx={{ fontSize: "16px", color: "#374151", mb: "6px" }}
                >
                  請假時數：
                  {formatSummaryMinutes(
                    sidebarSummary.leave_hours,
                    sidebarSummary.leave_remaining_minutes,
                  )}
                </Typography>

                {Array.isArray(sidebarSummary.leave_breakdown) &&
                sidebarSummary.leave_breakdown.length > 0 ? (
                  <Box sx={{ pl: "12px", mb: "6px" }}>
                    {sidebarSummary.leave_breakdown.map((item) => {
                      const displayName =
                        item.display_name ||
                        (item.relation_type
                          ? `${item.leave_name} - ${item.relation_type}`
                          : item.leave_name) ||
                        "請假";

                      return (
                        <Typography
                          key={item.filter_key || displayName}
                          sx={{ fontSize: "14px", color: "#4b5563", mb: "4px" }}
                        >
                          {displayName}：
                          {formatSummaryMinutes(
                            item.hours,
                            item.remaining_minutes,
                          )}
                        </Typography>
                      );
                    })}
                  </Box>
                ) : null}

                <Typography sx={{ fontSize: "16px", color: "#374151" }}>
                  加班時數：
                  {formatSummaryMinutes(
                    sidebarSummary.overtime_hours,
                    sidebarSummary.overtime_remaining_minutes,
                  )}
                </Typography>
              </Paper>

              <SidebarCard title="班次篩選">
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
                >
                  {SHIFT_FILTERS.map((item) => (
                    <Box
                      key={item.key}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => handleSelectFilter(item.key)}
                    >
                      <Checkbox
                        checked={
                          item.key === "all"
                            ? selectedFilters.includes("all")
                            : isFilterChecked(item.key)
                        }
                        size="small"
                        sx={{ p: "4px" }}
                      />

                      {item.key === "all" ? (
                        <Typography sx={{ fontSize: "15px" }}>全選</Typography>
                      ) : (
                        <Box
                          sx={{
                            px: "8px",
                            py: "2px",
                            bgcolor: item.color,
                            fontSize: "14px",
                            color: "#111827",
                            minWidth: "74px",
                            textAlign: "center",
                          }}
                        >
                          {item.label}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </SidebarCard>

              <SidebarCard title="人員篩選">
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 34px",
                    gap: "8px",
                  }}
                >
                  <Box
                    sx={{
                      height: "34px",
                      border: "1px solid #d1d5db",
                      display: "flex",
                      alignItems: "center",
                      px: "10px",
                      color: "#9ca3af",
                      fontSize: "14px",
                    }}
                  >
                    請選擇
                  </Box>

                  <Box
                    sx={{
                      height: "34px",
                      border: "1px solid #9ca3af",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "#374151",
                    }}
                  >
                    +
                  </Box>
                </Box>
              </SidebarCard>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
