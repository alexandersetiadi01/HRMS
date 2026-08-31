import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Button,
  Stack,
  FormControlLabel,
  Radio,
  FormControl,
  Select,
  Checkbox,
  RadioGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AttendanceRecordTable from "./AttendanceRecordTable";
import AttendanceAbnormalTable from "./AttendanceAbnormalTable";
import Breadcrumb from "../../../Utils/Breadcrumb";
import {
  apiAttendanceRecords,
  apiLeaveRequests,
  apiMissedPunchRequests,
} from "../../../API/attendance";

const DEFAULT_LOCATION_OPTIONS = ["全部"];
const DEFAULT_METHOD_OPTIONS = ["全部"];
const ABNORMAL_REASON_OPTIONS = ["全部", "遲到", "早退", "忘打卡"];

const RECORD_TYPE_MAP = {
  上下班: "punch",
  請假: "leave",
  "公出/出差": "leave",
};

function safeText(value, fallback = "-") {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text !== "" ? text : fallback;
}

function formatDateOnly(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return safeText(value);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return safeText(value);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function isBusinessTripLeaveType(value) {
  const text = String(value || "").trim();

  return text === "公出" || text === "出差";
}

function formatHoursMinutes(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const hoursValue = Number(value);

  if (!Number.isFinite(hoursValue)) {
    return String(value);
  }

  const totalMinutes = Math.max(0, Math.round(hoursValue * 60));

  if (totalMinutes === 0) {
    return "-";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}分`;
  }

  if (minutes === 0) {
    return `${hours}時`;
  }

  return `${hours}時 ${minutes}分`;
}

function getLeaveHours(detail = {}) {
  const value =
    detail?.display_hours ??
    detail?.approved_hours ??
    detail?.requested_hours ??
    detail?.hours ??
    detail?.raw?.approved_hours ??
    detail?.raw?.requested_hours ??
    detail?.raw?.hours;

  return formatHoursMinutes(value);
}

function getLeaveReason(detail = {}) {
  return (
    detail?.reason ||
    detail?.leave_reason ||
    detail?.remark ||
    detail?.description ||
    detail?.notes ||
    detail?.raw?.reason ||
    detail?.raw?.leave_reason ||
    detail?.raw?.remark ||
    detail?.raw?.description ||
    detail?.raw?.notes ||
    "-"
  );
}

function getLeaveCreatedAt(item = {}) {
  return (
    item?.detail?.created_at ||
    item?.detail?.raw?.created_at ||
    item?.created_at ||
    item?.raw?.created_at ||
    item?.attendance_date ||
    ""
  );
}

function normalizePunchItems(
  items = [],
  currentLocation = "全部",
  currentMethod = "全部",
) {
  const nextLocationOptions = new Set(["全部"]);
  const nextMethodOptions = new Set(["全部"]);

  const rows = (Array.isArray(items) ? items : [])
    .map((item) => {
      const inLocation = safeText(item?.clock_in_location_label, "");
      const outLocation = safeText(item?.clock_out_location_label, "");
      const inMethod = safeText(item?.clock_in_method_label, "");
      const outMethod = safeText(item?.clock_out_method_label, "");

      if (inLocation) {
        nextLocationOptions.add(inLocation);
      }

      if (outLocation) {
        nextLocationOptions.add(outLocation);
      }

      if (inMethod) {
        nextMethodOptions.add(inMethod);
      }

      if (outMethod) {
        nextMethodOptions.add(outMethod);
      }

      return {
        id: `${item?.attendance_date || ""}-${item?.clock_in_time || ""}-${item?.clock_out_time || ""}`,
        mode: "punch",
        date: safeText(item?.attendance_date_display),
        start: safeText(item?.clock_in_display),
        end: safeText(item?.clock_out_display),
        paidHours: formatHoursMinutes(item?.payable_hours),
        lateMinutes: safeText(item?.late_minutes, "0"),
        status: safeText(item?.status_label || item?.status),
        detail: item?.detail || item || {},
        _clockInLocation: safeText(item?.clock_in_location_label, ""),
        _clockOutLocation: safeText(item?.clock_out_location_label, ""),
        _clockInMethod: safeText(item?.clock_in_method_label, ""),
        _clockOutMethod: safeText(item?.clock_out_method_label, ""),
      };
    })
    .filter((row) => {
      const matchesLocation =
        currentLocation === "全部" ||
        row._clockInLocation === currentLocation ||
        row._clockOutLocation === currentLocation;

      const matchesMethod =
        currentMethod === "全部" ||
        row._clockInMethod === currentMethod ||
        row._clockOutMethod === currentMethod;

      return matchesLocation && matchesMethod;
    });

  return {
    rows,
    locationOptions: Array.from(nextLocationOptions),
    methodOptions: Array.from(nextMethodOptions),
  };
}

function getResponseItems(response) {
  const payload = response?.data?.data || response?.data || response || {};

  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.items) ? payload.items : [];
}

function getDateKey(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const match = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatRequestStatus(value) {
  const raw = String(value || "").trim();
  const normalized = raw.toLowerCase();

  const map = {
    pending: "待簽核",
    approved: "已核准",
    rejected: "已駁回",
    cancelled: "已取消",
    canceled: "已取消",
    draft: "草稿",
  };

  return map[normalized] || raw || "-";
}

function getLeaveRequestDateKeys(item = {}) {
  const startKey = getDateKey(
    item.start_datetime ||
      item.start_time ||
      item.request_date ||
      item.created_at,
  );
  const endKey = getDateKey(
    item.end_datetime ||
      item.end_time ||
      item.start_datetime ||
      item.start_time ||
      item.request_date ||
      item.created_at,
  );

  if (!startKey) {
    return [];
  }

  if (!endKey || endKey === startKey) {
    return [startKey];
  }

  const start = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return [startKey];
  }

  const keys = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");

    keys.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

function buildAbnormalRows(
  attendanceItems = [],
  missedPunchItems = [],
  leaveItems = [],
  reasonFilter = "全部",
  onlyWithoutForm = false,
) {
  const formRecordMap = new Map();
  const relatedFormMap = new Map();

  const addFormRecord = (dateKey, label, form = null) => {
    if (!dateKey || !label) {
      return;
    }

    if (!formRecordMap.has(dateKey)) {
      formRecordMap.set(dateKey, new Set());
    }

    formRecordMap.get(dateKey).add(label);

    if (form) {
      if (!relatedFormMap.has(dateKey)) {
        relatedFormMap.set(dateKey, []);
      }

      relatedFormMap.get(dateKey).push(form);
    }
  };

  missedPunchItems.forEach((item) => {
    const dateKey = getDateKey(
      item.request_datetime || item.request_date || item.created_at,
    );

    if (!dateKey) {
      return;
    }

    addFormRecord(
      dateKey,
      `忘打卡申請（${formatRequestStatus(item.request_status)}）`,
      {
        type: "missed_punch",
        typeLabel: "忘打卡申請",
        statusLabel: formatRequestStatus(item.request_status),
        data: item,
      },
    );
  });

  leaveItems.forEach((item) => {
    const status = formatRequestStatus(item.request_status);

    getLeaveRequestDateKeys(item).forEach((dateKey) => {
      addFormRecord(dateKey, `請假（${status}）`, {
        type: "leave",
        typeLabel: "請假",
        statusLabel: status,
        data: item,
      });
    });
  });

  const rows = [];

  attendanceItems.forEach((item, index) => {
    const dateKey = getDateKey(
      item.attendance_date || item.attendance_date_display || item.work_date,
    );

    if (!dateKey) {
      return;
    }

    const formRecord = Array.from(formRecordMap.get(dateKey) || []).join("、");
    const relatedForms = relatedFormMap.get(dateKey) || [];
    const lateMinutes = Number(item.late_minutes || 0);
    const earlyLeaveMinutes = Number(item.early_leave_minutes || 0);

    const attendanceStatus = String(
      item.status || item.attendance_status || item.status_code || "",
    )
      .trim()
      .toLowerCase();

    if (Number.isFinite(lateMinutes) && lateMinutes > 0) {
      rows.push({
        id: `${dateKey}-late-${index}`,
        date: dateKey.replace(/-/g, "/"),
        reasonType: "遲到",
        reason: `遲到${Math.round(lateMinutes)}分鐘`,
        formRecord,
        relatedForms,
      });
    }

    if (Number.isFinite(earlyLeaveMinutes) && earlyLeaveMinutes > 0) {
      rows.push({
        id: `${dateKey}-early-${index}`,
        date: dateKey.replace(/-/g, "/"),
        reasonType: "早退",
        reason: `早退${Math.round(earlyLeaveMinutes)}分鐘`,
        formRecord,
        relatedForms,
      });
    }

    const missingClockIn =
      attendanceStatus === "missing_clock_in" ||
      (!item.clock_in_time && !!item.clock_out_time);

    const missingClockOut =
      attendanceStatus === "missing_clock_out" ||
      (!!item.clock_in_time && !item.clock_out_time);

    if (missingClockIn || missingClockOut) {
      rows.push({
        id: `${dateKey}-missed-punch-${index}`,
        date: dateKey.replace(/-/g, "/"),
        reasonType: "忘打卡",
        reason: "忘打卡",
        formRecord,
      });
    }
  });

  return rows
    .filter((row) => reasonFilter === "全部" || row.reasonType === reasonFilter)
    .filter((row) => !onlyWithoutForm || !String(row.formRecord || "").trim())
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function normalizeLeaveItems(items = []) {
  const rows = (Array.isArray(items) ? items : []).map((item, index) => {
    const detail = item?.detail || item || {};
    const createdAt = getLeaveCreatedAt(item);
    const startAt =
      detail?.start_datetime ||
      detail?.start_time ||
      detail?.raw?.start_datetime ||
      detail?.raw?.start_time ||
      "";
    const endAt =
      detail?.end_datetime ||
      detail?.end_time ||
      detail?.raw?.end_datetime ||
      detail?.raw?.end_time ||
      "";

    return {
      id:
        item?.id ||
        detail?.leave_request_id ||
        detail?.raw?.leave_request_id ||
        `leave-${index}`,
      mode: "leave",
      date: formatDateOnly(createdAt),
      start: formatDateTime(startAt),
      end: formatDateTime(endAt),
      appliedHours: getLeaveHours(detail),
      leaveType: safeText(getLeaveType(detail)),
      reason: safeText(getLeaveReason(detail)),
      detail,
    };
  });

  return {
    rows,
    locationOptions: DEFAULT_LOCATION_OPTIONS,
    methodOptions: DEFAULT_METHOD_OPTIONS,
  };
}

function DetailRow({ label, value }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "100px 1fr", sm: "140px 1fr" },
        columnGap: "12px",
        rowGap: "4px",
        py: "10px",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <Typography
        sx={{
          fontSize: "14px",
          color: "#6b7280",
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: "14px",
          color: "#111827",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {safeText(value)}
      </Typography>
    </Box>
  );
}

export default function AttendanceRecord() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [recordType, setRecordType] = useState("上下班");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("全部");
  const [method, setMethod] = useState("全部");
  const [locationOptions, setLocationOptions] = useState(
    DEFAULT_LOCATION_OPTIONS,
  );
  const [methodOptions, setMethodOptions] = useState(DEFAULT_METHOD_OPTIONS);
  const [recordRows, setRecordRows] = useState([]);
  const [recordLoading, setRecordLoading] = useState(false);
  const [abnormalRows, setAbnormalRows] = useState([]);
  const [abnormalLoading, setAbnormalLoading] = useState(false);
  const [abnormalReason, setAbnormalReason] = useState("全部");
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedAbnormalRow, setSelectedAbnormalRow] = useState(null);

  const isLeaveMode = recordType === "請假" || recordType === "公出/出差";

  const fetchRecordData = async ({
    nextRecordType = recordType,
    nextStartDate = startDate,
    nextEndDate = endDate,
    nextLocation = location,
    nextMethod = method,
  } = {}) => {
    try {
      setRecordLoading(true);

      const response = await apiAttendanceRecords({
        record_type: RECORD_TYPE_MAP[nextRecordType] || "punch",
        date_from: nextStartDate || undefined,
        date_to: nextEndDate || undefined,
      });

      const payload = response?.data?.data || response?.data || response || {};
      const items = Array.isArray(payload?.items) ? payload.items : [];

      const normalized =
        nextRecordType === "請假" || nextRecordType === "公出/出差"
          ? normalizeLeaveItems(items)
          : normalizePunchItems(items, nextLocation, nextMethod);

      if (nextRecordType === "請假" || nextRecordType === "公出/出差") {
        normalized.rows = normalized.rows.filter((row) => {
          const isBusinessTrip = isBusinessTripLeaveType(row.leaveType);

          return nextRecordType === "公出/出差"
            ? isBusinessTrip
            : !isBusinessTrip;
        });
      }

      setRecordRows(normalized.rows);
      setLocationOptions(
        normalized.locationOptions || DEFAULT_LOCATION_OPTIONS,
      );
      setMethodOptions(normalized.methodOptions || DEFAULT_METHOD_OPTIONS);

      if (!(normalized.locationOptions || []).includes(nextLocation)) {
        setLocation("全部");
      }

      if (!(normalized.methodOptions || []).includes(nextMethod)) {
        setMethod("全部");
      }
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
      setRecordRows([]);
      setLocationOptions(DEFAULT_LOCATION_OPTIONS);
      setMethodOptions(DEFAULT_METHOD_OPTIONS);
    } finally {
      setRecordLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 0) {
      return;
    }

    fetchRecordData();
  }, [tab, recordType]);

  const fetchAbnormalData = async ({
    nextStartDate = startDate,
    nextEndDate = endDate,
    nextReason = abnormalReason,
    nextShowOnlyPending = showOnlyPending,
  } = {}) => {
    try {
      setAbnormalLoading(true);

      const [attendanceResponse, missedPunchResponse, leaveResponse] =
        await Promise.all([
          apiAttendanceRecords({
            record_type: "punch",
            date_from: nextStartDate || undefined,
            date_to: nextEndDate || undefined,
          }),
          apiMissedPunchRequests({
            date_from: nextStartDate || undefined,
            date_to: nextEndDate || undefined,
          }),
          apiLeaveRequests({
            date_from: nextStartDate || undefined,
            date_to: nextEndDate || undefined,
          }),
        ]);

      setAbnormalRows(
        buildAbnormalRows(
          getResponseItems(attendanceResponse),
          getResponseItems(missedPunchResponse),
          getResponseItems(leaveResponse),
          nextReason,
          nextShowOnlyPending,
        ),
      );
    } catch (error) {
      console.error("Failed to fetch attendance abnormal records:", error);
      setAbnormalRows([]);
    } finally {
      setAbnormalLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 1) {
      return;
    }

    fetchAbnormalData();
  }, [tab]);

  const handleSearchAbnormal = () => {
    fetchAbnormalData();
  };

  const handleResetAbnormal = () => {
    const resetStartDate = "";
    const resetEndDate = "";
    const resetReason = "全部";
    const resetShowOnlyPending = false;

    setStartDate(resetStartDate);
    setEndDate(resetEndDate);
    setAbnormalReason(resetReason);
    setShowOnlyPending(resetShowOnlyPending);

    fetchAbnormalData({
      nextStartDate: resetStartDate,
      nextEndDate: resetEndDate,
      nextReason: resetReason,
      nextShowOnlyPending: resetShowOnlyPending,
    });
  };

  const handleSearchRecord = () => {
    fetchRecordData();
  };

  const handleResetRecord = () => {
    const resetStartDate = "";
    const resetEndDate = "";
    const resetLocation = "全部";
    const resetMethod = "全部";

    setStartDate(resetStartDate);
    setEndDate(resetEndDate);
    setLocation(resetLocation);
    setMethod(resetMethod);

    fetchRecordData({
      nextStartDate: resetStartDate,
      nextEndDate: resetEndDate,
      nextLocation: resetLocation,
      nextMethod: resetMethod,
    });
  };

  const detail = useMemo(() => selectedRow?.detail || {}, [selectedRow]);

  return (
    <>
      <Box
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          p: { xs: "0px", md: "24px" },
        }}
      >
        <Breadcrumb
          rootLabel="個人專區"
          rootTo="/attendance"
          currentLabel="打卡紀錄"
          mb="14px"
        />

        <Typography sx={{ fontSize: "24px", fontWeight: 700, mb: 2 }}>
          打卡紀錄
        </Typography>

        <Paper
          sx={{
            borderRadius: "0px",
            overflow: "hidden",
            border: "1px solid #d1d5db",
          }}
        >
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              minHeight: "52px",
              borderBottom: "1px solid #d1d5db",
              "& .MuiTabs-flexContainer": {
                width: "100%",
              },
              "& .MuiTab-root": {
                minHeight: "52px",
                fontSize: { xs: "14px", sm: "16px" },
                color: "#374151",
                fontWeight: 700,
              },
              "& .Mui-selected": {
                color: "#1976d2",
              },
              "& .MuiTabs-indicator": {
                height: "2px",
              },
            }}
          >
            <Tab label="上下班/請假/公出/出差" />
            <Tab label="異常" />
          </Tabs>

          <Box sx={{ p: { xs: "16px", sm: "20px" } }}>
            {tab === 0 ? (
              <Stack spacing={2.5}>
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Stack spacing={2.5}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography
                        sx={{ fontSize: "14px", whiteSpace: "nowrap" }}
                      >
                        *資料類型
                      </Typography>

                      <RadioGroup
                        row
                        value={recordType}
                        onChange={(e) => setRecordType(e.target.value)}
                      >
                        {["上下班", "請假", "公出/出差"].map((item) => (
                          <FormControlLabel
                            key={item}
                            value={item}
                            control={<Radio size="small" />}
                            label={item}
                            sx={{
                              mr: 0,
                              ml: 0,
                              px: "0px",
                              py: "4px",
                              borderRadius: "4px",
                              "& .MuiFormControlLabel-label": {
                                fontSize: "14px",
                                fontWeight: 700,
                                color:
                                  recordType === item ? "#1976d2" : "#374151",
                              },
                            }}
                          />
                        ))}
                      </RadioGroup>

                      <Typography
                        sx={{ fontSize: "14px", whiteSpace: "nowrap" }}
                      >
                        *查詢日期
                      </Typography>

                      <TextField
                        size="small"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        sx={{
                          width: "190px",
                          "& .MuiInputBase-root": {
                            height: "40px",
                          },
                        }}
                      />

                      <Typography sx={{ fontSize: "16px" }}>~</Typography>

                      <TextField
                        size="small"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        sx={{
                          width: "190px",
                          "& .MuiInputBase-root": {
                            height: "40px",
                          },
                        }}
                      />

                      <Button
                        variant="contained"
                        onClick={handleSearchRecord}
                        sx={{
                          minWidth: "64px",
                          height: "40px",
                          bgcolor: "#1976d2",
                          boxShadow: "none",
                        }}
                      >
                        搜尋
                      </Button>

                      <Button
                        variant="outlined"
                        onClick={handleResetRecord}
                        sx={{
                          minWidth: "64px",
                          height: "40px",
                        }}
                      >
                        清空
                      </Button>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {!isLeaveMode && (
                        <>
                          <Typography
                            sx={{ fontSize: "14px", whiteSpace: "nowrap" }}
                          >
                            地點
                          </Typography>

                          <FormControl size="small" sx={{ minWidth: "120px" }}>
                            <Select
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              sx={{ height: "40px" }}
                            >
                              {locationOptions.map((item) => (
                                <MenuItem key={item} value={item}>
                                  {item}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Typography
                            sx={{ fontSize: "14px", whiteSpace: "nowrap" }}
                          >
                            打卡方式
                          </Typography>

                          <FormControl size="small" sx={{ minWidth: "160px" }}>
                            <Select
                              value={method}
                              onChange={(e) => setMethod(e.target.value)}
                              sx={{ height: "40px" }}
                            >
                              {methodOptions.map((item) => (
                                <MenuItem key={item} value={item}>
                                  {item}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </>
                      )}

                      <Box sx={{ flex: 1 }} />

                      <Button
                        variant="contained"
                        onClick={() => navigate("/attendance/missed-punch")}
                        sx={{
                          minWidth: "100px",
                          height: "36px",
                          bgcolor: "#0f1f57",
                          boxShadow: "none",
                        }}
                      >
                        忘打卡申請
                      </Button>
                    </Stack>
                  </Stack>
                </Box>

                <Box sx={{ display: { xs: "block", md: "none" } }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography sx={{ fontSize: "14px", mb: 1 }}>
                        *資料類型
                      </Typography>

                      <RadioGroup
                        row
                        value={recordType}
                        onChange={(e) => setRecordType(e.target.value)}
                        sx={{
                          flexWrap: "wrap",
                          gap: 0.5,
                        }}
                      >
                        {["上下班", "請假", "公出/出差"].map((item) => (
                          <FormControlLabel
                            key={item}
                            value={item}
                            control={<Radio size="small" />}
                            label={item}
                            sx={{
                              mr: 0.5,
                              ml: 0,
                              "& .MuiFormControlLabel-label": {
                                fontSize: "14px",
                                fontWeight: 700,
                                color:
                                  recordType === item ? "#1976d2" : "#374151",
                              },
                            }}
                          />
                        ))}
                      </RadioGroup>
                    </Box>

                    <Box>
                      <Typography sx={{ fontSize: "14px", mb: 1 }}>
                        *查詢日期
                      </Typography>

                      <Stack
                        direction="row"
                        alignItems="center"
                        sx={{ width: "100%" }}
                      >
                        <TextField
                          size="small"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          sx={{
                            width: "calc((100% - 24px) / 2)",
                            "& .MuiInputBase-root": {
                              height: "40px",
                            },
                            "& .MuiInputBase-input": {
                              px: "10px",
                              fontSize: "13px",
                            },
                          }}
                          InputLabelProps={{ shrink: true }}
                        />

                        <Typography
                          sx={{
                            width: "24px",
                            textAlign: "center",
                            fontSize: "16px",
                            color: "#374151",
                            flexShrink: 0,
                          }}
                        >
                          ~
                        </Typography>

                        <TextField
                          size="small"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          sx={{
                            width: "calc((100% - 24px) / 2)",
                            "& .MuiInputBase-root": {
                              height: "40px",
                            },
                            "& .MuiInputBase-input": {
                              px: "10px",
                              fontSize: "13px",
                            },
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={2.5}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSearchRecord}
                        sx={{
                          height: "40px",
                          bgcolor: "#1976d2",
                          boxShadow: "none",
                        }}
                      >
                        搜尋
                      </Button>

                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleResetRecord}
                        sx={{
                          height: "40px",
                        }}
                      >
                        清空
                      </Button>
                    </Stack>

                    {!isLeaveMode && (
                      <>
                        <Box>
                          <Typography sx={{ fontSize: "14px", mb: 1 }}>
                            地點
                          </Typography>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              sx={{ height: "40px" }}
                            >
                              {locationOptions.map((item) => (
                                <MenuItem key={item} value={item}>
                                  {item}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>

                        <Box>
                          <Typography sx={{ fontSize: "14px", mb: 1 }}>
                            打卡方式
                          </Typography>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={method}
                              onChange={(e) => setMethod(e.target.value)}
                              sx={{ height: "40px" }}
                            >
                              {methodOptions.map((item) => (
                                <MenuItem key={item} value={item}>
                                  {item}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      </>
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        height: "36px",
                        bgcolor: "#0f1f57",
                        boxShadow: "none",
                      }}
                    >
                      忘打卡申請
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            ) : (
              <Stack spacing={2.5}>
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography
                        sx={{ fontSize: "14px", whiteSpace: "nowrap" }}
                      >
                        *查詢日期
                      </Typography>

                      <TextField
                        size="small"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        sx={{
                          width: "190px",
                          "& .MuiInputBase-root": {
                            height: "40px",
                          },
                        }}
                      />

                      <Typography sx={{ fontSize: "16px" }}>~</Typography>

                      <TextField
                        size="small"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        sx={{
                          width: "190px",
                          "& .MuiInputBase-root": {
                            height: "40px",
                          },
                        }}
                      />
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography
                        sx={{ fontSize: "14px", whiteSpace: "nowrap" }}
                      >
                        *原因
                      </Typography>

                      <FormControl
                        size="small"
                        sx={{ minWidth: "320px", flex: 1 }}
                      >
                        <Select
                          value={abnormalReason}
                          onChange={(e) => setAbnormalReason(e.target.value)}
                          sx={{ height: "40px" }}
                        >
                          {ABNORMAL_REASON_OPTIONS.map((item) => (
                            <MenuItem key={item} value={item}>
                              {item}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Button
                        variant="contained"
                        onClick={handleSearchAbnormal}
                        disabled={abnormalLoading}
                        sx={{
                          minWidth: "64px",
                          height: "40px",
                          bgcolor: "#1976d2",
                          boxShadow: "none",
                        }}
                      >
                        搜尋
                      </Button>

                      <Button
                        variant="outlined"
                        onClick={handleResetAbnormal}
                        disabled={abnormalLoading}
                        sx={{
                          minWidth: "64px",
                          height: "40px",
                        }}
                      >
                        清空
                      </Button>
                    </Stack>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showOnlyPending}
                          onChange={(e) => setShowOnlyPending(e.target.checked)}
                          size="small"
                        />
                      }
                      label="僅顯示無表單申請紀錄資料"
                      sx={{
                        m: 0,
                        "& .MuiFormControlLabel-label": {
                          fontSize: "14px",
                        },
                      }}
                    />

                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={1}
                    >
                      <Button
                        variant="contained"
                        onClick={() => navigate("/attendance/leave")}
                        sx={{
                          minWidth: "64px",
                          height: "36px",
                          bgcolor: "#0f1f57",
                          boxShadow: "none",
                        }}
                      >
                        請假
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => navigate("/attendance/missed-punch")}
                        sx={{
                          minWidth: "100px",
                          height: "36px",
                          bgcolor: "#0f1f57",
                          boxShadow: "none",
                        }}
                      >
                        忘打卡申請
                      </Button>
                    </Stack>
                  </Stack>
                </Box>

                <Box sx={{ display: { xs: "block", md: "none" } }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography sx={{ fontSize: "14px", mb: 1 }}>
                        *查詢日期
                      </Typography>

                      <Stack
                        direction="row"
                        alignItems="center"
                        sx={{ width: "100%" }}
                      >
                        <TextField
                          size="small"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          sx={{
                            width: "calc((100% - 24px) / 2)",
                            "& .MuiInputBase-root": {
                              height: "40px",
                            },
                            "& .MuiInputBase-input": {
                              px: "10px",
                              fontSize: "13px",
                            },
                          }}
                          InputLabelProps={{ shrink: true }}
                        />

                        <Typography
                          sx={{
                            width: "24px",
                            textAlign: "center",
                            fontSize: "16px",
                            color: "#374151",
                            flexShrink: 0,
                          }}
                        >
                          ~
                        </Typography>

                        <TextField
                          size="small"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          sx={{
                            width: "calc((100% - 24px) / 2)",
                            "& .MuiInputBase-root": {
                              height: "40px",
                            },
                            "& .MuiInputBase-input": {
                              px: "10px",
                              fontSize: "13px",
                            },
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Stack>
                    </Box>

                    <Box>
                      <Typography sx={{ fontSize: "14px", mb: 1 }}>
                        *原因
                      </Typography>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={abnormalReason}
                          onChange={(e) => setAbnormalReason(e.target.value)}
                          sx={{ height: "40px" }}
                        >
                          {ABNORMAL_REASON_OPTIONS.map((item) => (
                            <MenuItem key={item} value={item}>
                              {item}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showOnlyPending}
                          onChange={(e) => setShowOnlyPending(e.target.checked)}
                          size="small"
                        />
                      }
                      label="僅顯示無表單申請紀錄資料"
                      sx={{
                        m: 0,
                        alignItems: "flex-start",
                        "& .MuiFormControlLabel-label": {
                          fontSize: "14px",
                          mt: "2px",
                        },
                      }}
                    />

                    <Stack direction="row" spacing={2.5}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSearchAbnormal}
                        disabled={abnormalLoading}
                        sx={{
                          height: "40px",
                          bgcolor: "#1976d2",
                          boxShadow: "none",
                        }}
                      >
                        搜尋
                      </Button>

                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleResetAbnormal}
                        disabled={abnormalLoading}
                        sx={{
                          height: "40px",
                        }}
                      >
                        清空
                      </Button>
                    </Stack>

                    <Stack direction="row" spacing={1.5}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate("/attendance/leave")}
                        sx={{
                          height: "36px",
                          bgcolor: "#0f1f57",
                          boxShadow: "none",
                        }}
                      >
                        請假
                      </Button>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate("/attendance/missed-punch")}
                        sx={{
                          height: "36px",
                          bgcolor: "#0f1f57",
                          boxShadow: "none",
                        }}
                      >
                        忘打卡申請
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            )}
          </Box>

          <Box
            sx={{
              px: { xs: "12px", sm: "20px" },
              pb: "20px",
            }}
          >
            {tab === 0 ? (
              <>
                <AttendanceRecordTable
                  rows={recordRows}
                  loading={recordLoading}
                  mode={isLeaveMode ? "leave" : "punch"}
                  onRowClick={(row) => setSelectedRow(row)}
                />

                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={0.5}
                    flexWrap="nowrap"
                  >
                    <Button
                      size="small"
                      sx={{
                        minWidth: { xs: "28px", sm: "40px" },
                        px: 0.25,
                        fontSize: { xs: "11px", sm: "14px" },
                      }}
                    >
                      {"<<"}
                    </Button>

                    <Button
                      size="small"
                      sx={{
                        minWidth: { xs: "28px", sm: "40px" },
                        px: 0.25,
                        fontSize: { xs: "11px", sm: "14px" },
                      }}
                    >
                      {"<"}
                    </Button>

                    <TextField
                      size="small"
                      value="1"
                      sx={{
                        width: { xs: "42px", sm: "60px" },
                        "& .MuiInputBase-root": {
                          height: { xs: "32px", sm: "40px" },
                        },
                        "& .MuiInputBase-input": {
                          px: 0.5,
                          py: 0.25,
                          textAlign: "center",
                          fontSize: { xs: "12px", sm: "14px" },
                        },
                      }}
                    />

                    <Typography sx={{ fontSize: { xs: "12px", sm: "14px" } }}>
                      / 3
                    </Typography>

                    <Button
                      size="small"
                      sx={{
                        minWidth: { xs: "28px", sm: "40px" },
                        px: 0.25,
                        fontSize: { xs: "11px", sm: "14px" },
                      }}
                    >
                      {">"}
                    </Button>

                    <Button
                      size="small"
                      sx={{
                        minWidth: { xs: "28px", sm: "40px" },
                        px: 0.25,
                        fontSize: { xs: "11px", sm: "14px" },
                      }}
                    >
                      {">>"}
                    </Button>
                  </Stack>

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="flex-start"
                    spacing={1}
                    flexWrap="wrap"
                  >
                    <FormControl size="small">
                      <Select
                        value={10}
                        sx={{
                          width: { xs: "64px", sm: "64px" },
                          height: { xs: "36px", sm: "40px" },
                          fontSize: { xs: "12px", sm: "14px" },
                        }}
                      >
                        <MenuItem value={10}>10</MenuItem>
                      </Select>
                    </FormControl>

                    <Typography sx={{ fontSize: { xs: "12px", sm: "14px" } }}>
                      1-10 / 22
                    </Typography>
                  </Stack>
                </Stack>
              </>
            ) : (
              <AttendanceAbnormalTable
                rows={abnormalRows}
                loading={abnormalLoading}
                onView={(row) => setSelectedAbnormalRow(row)}
              />
            )}
          </Box>
        </Paper>
      </Box>

      <Dialog
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontSize: "22px", fontWeight: 700 }}>
          {isLeaveMode ? "請假紀錄明細" : "打卡紀錄明細"}
        </DialogTitle>

        <DialogContent dividers>
          {isLeaveMode ? (
            <Box>
              <DetailRow label="日期" value={selectedRow?.date} />
              <DetailRow label="開始時間" value={selectedRow?.start} />
              <DetailRow label="結束時間" value={selectedRow?.end} />
              <DetailRow label="申請時數" value={selectedRow?.appliedHours} />
              <DetailRow label="假別" value={selectedRow?.leaveType} />
              <DetailRow label="事由" value={selectedRow?.reason} />
            </Box>
          ) : (
            <Box>
              <DetailRow label="日期" value={detail?.attendance_date_display} />
              <DetailRow
                label="狀態"
                value={detail?.status_label || detail?.status}
              />
              <DetailRow label="上班時間" value={detail?.clock_in_display} />
              <DetailRow
                label="上班地點"
                value={detail?.clock_in_location_label}
              />
              <DetailRow
                label="上班方式"
                value={detail?.clock_in_method_label}
              />
              <DetailRow label="下班時間" value={detail?.clock_out_display} />
              <DetailRow
                label="下班地點"
                value={detail?.clock_out_location_label}
              />
              <DetailRow
                label="下班方式"
                value={detail?.clock_out_method_label}
              />
              <DetailRow label="工時" value={formatHoursMinutes(detail?.worked_hours)} />
              <DetailRow label="請假時數" value={formatHoursMinutes(detail?.leave_hours)} />
              <DetailRow label="加班時數" value={formatHoursMinutes(detail?.overtime_hours)} />
              <DetailRow label="系統缺勤時數" value={formatHoursMinutes(detail?.system_absent_hours)} />
              <DetailRow label="曠職時數" value={formatHoursMinutes(detail?.confirmed_absence_hours)} />
              <DetailRow label="尚未處理缺勤" value={formatHoursMinutes(detail?.unresolved_absent_hours)} />
              <DetailRow label="計薪時數" value={formatHoursMinutes(detail?.payable_hours)} />
              <DetailRow label="遲到分鐘" value={detail?.late_minutes} />
              <DetailRow label="早退分鐘" value={detail?.early_leave_minutes} />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSelectedRow(null)}>關閉</Button>
        </DialogActions>
      </Dialog>

            <Dialog
        open={!!selectedAbnormalRow}
        onClose={() => setSelectedAbnormalRow(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontSize: "20px", fontWeight: 700 }}>
          表單詳情
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3}>
            {(selectedAbnormalRow?.relatedForms || []).map((form, index) => {
              const data = form?.data || {};

              return (
                <Box key={`${form?.type || "form"}-${data?.id || data?.request_id || index}`}>
                  {index > 0 ? (
                    <Box sx={{ borderTop: "1px solid #d1d5db", mb: 2 }} />
                  ) : null}

                  <Typography sx={{ fontSize: "16px", fontWeight: 700, mb: 1 }}>
                    {form?.typeLabel || "表單"}
                  </Typography>

                  <DetailRow label="狀態" value={form?.statusLabel} />

                  {form?.type === "missed_punch" ? (
                    <>
                      <DetailRow
                        label="忘打卡類型"
                        value={
                          data?.request_punch_type_label ||
                          (data?.request_punch_type === "in"
                            ? "上班"
                            : data?.request_punch_type === "out"
                              ? "下班"
                              : data?.request_punch_type)
                        }
                      />
                      <DetailRow
                        label="打卡時間"
                        value={formatDateTime(data?.request_datetime)}
                      />
                      <DetailRow
                        label="地點"
                        value={data?.location_label || data?.location_name}
                      />
                      <DetailRow label="地點備註" value={data?.location_note} />
                      <DetailRow label="事由" value={data?.reason} />
                    </>
                  ) : null}

                  {form?.type === "leave" ? (
                    <>
                      <DetailRow
                        label="假別"
                        value={data?.leave_name || data?.leave_type_name}
                      />
                      <DetailRow
                        label="開始時間"
                        value={formatDateTime(data?.start_datetime || data?.start_time)}
                      />
                      <DetailRow
                        label="結束時間"
                        value={formatDateTime(data?.end_datetime || data?.end_time)}
                      />
                      <DetailRow
                        label="申請時數"
                        value={formatHoursMinutes(data?.requested_hours)}
                      />
                      <DetailRow label="事由" value={data?.reason} />
                    </>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSelectedAbnormalRow(null)}>關閉</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
