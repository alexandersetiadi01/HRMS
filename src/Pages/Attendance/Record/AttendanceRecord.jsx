import { useEffect, useMemo, useState } from "react";
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
import { apiAttendanceRecords } from "../../../API/attendance";

const DEFAULT_LOCATION_OPTIONS = ["全部"];
const DEFAULT_METHOD_OPTIONS = ["全部"];
const ABNORMAL_REASON_OPTIONS = ["全部", "遲到", "早退", "忘打卡"];

const RECORD_TYPE_MAP = {
  上下班: "punch",
  請假: "leave",
  外出: "punch",
};

const ABNORMAL_DATA = [
  {
    date: "2026/03/04",
    reason: "遲到6分鐘",
    formRecord: "",
  },
];

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

function getLeaveType(detail = {}) {
  return (
    detail?.leave_type ||
    detail?.type ||
    detail?.raw?.leave_type ||
    detail?.raw?.type ||
    "-"
  );
}

function formatHours(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const num = Number(value);

  if (Number.isNaN(num)) {
    return String(value);
  }

  // remove .00, keep .5
  return Number.isInteger(num) ? String(num) : String(parseFloat(num.toFixed(2)));
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

  return formatHours(value);
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

function normalizePunchItems(items = [], currentLocation = "全部", currentMethod = "全部") {
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
        paidHours: safeText(item?.payable_hours, "0"),
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
      id: item?.id || detail?.leave_request_id || detail?.raw?.leave_request_id || `leave-${index}`,
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
  const [tab, setTab] = useState(0);
  const [recordType, setRecordType] = useState("上下班");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("全部");
  const [method, setMethod] = useState("全部");
  const [locationOptions, setLocationOptions] = useState(DEFAULT_LOCATION_OPTIONS);
  const [methodOptions, setMethodOptions] = useState(DEFAULT_METHOD_OPTIONS);
  const [recordRows, setRecordRows] = useState([]);
  const [recordLoading, setRecordLoading] = useState(false);
  const [abnormalReason, setAbnormalReason] = useState("全部");
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const isLeaveMode = recordType === "請假";

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
        nextRecordType === "請假"
          ? normalizeLeaveItems(items)
          : normalizePunchItems(items, nextLocation, nextMethod);

      setRecordRows(normalized.rows);
      setLocationOptions(normalized.locationOptions || DEFAULT_LOCATION_OPTIONS);
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
        <Breadcrumb rootLabel="個人專區" currentLabel="打卡紀錄" mb="14px" />

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
            <Tab label="上下班/請假/外出" />
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
                      <Typography sx={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                        *資料類型
                      </Typography>

                      <RadioGroup
                        row
                        value={recordType}
                        onChange={(e) => setRecordType(e.target.value)}
                      >
                        {["上下班", "請假", "外出"].map((item) => (
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
                            disabled = {item === "外出"}
                          />
                        ))}
                      </RadioGroup>

                      <Typography sx={{ fontSize: "14px", whiteSpace: "nowrap" }}>
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
                          <Typography sx={{ fontSize: "14px", whiteSpace: "nowrap" }}>
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

                          <Typography sx={{ fontSize: "14px", whiteSpace: "nowrap" }}>
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
                        {["上下班", "請假", "外出"].map((item) => (
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

                      <Stack direction="row" alignItems="center" sx={{ width: "100%" }}>
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
                      <Typography sx={{ fontSize: "14px", whiteSpace: "nowrap" }}>
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
                      <Typography sx={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                        *原因
                      </Typography>

                      <FormControl size="small" sx={{ minWidth: "320px", flex: 1 }}>
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

                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button
                        variant="contained"
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

                      <Stack direction="row" alignItems="center" sx={{ width: "100%" }}>
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
              <AttendanceAbnormalTable rows={ABNORMAL_DATA} />
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
              <DetailRow label="狀態" value={detail?.status_label || detail?.status} />
              <DetailRow label="上班時間" value={detail?.clock_in_display} />
              <DetailRow label="上班地點" value={detail?.clock_in_location_label} />
              <DetailRow label="上班方式" value={detail?.clock_in_method_label} />
              <DetailRow label="下班時間" value={detail?.clock_out_display} />
              <DetailRow label="下班地點" value={detail?.clock_out_location_label} />
              <DetailRow label="下班方式" value={detail?.clock_out_method_label} />
              <DetailRow label="工時" value={detail?.worked_hours} />
              <DetailRow label="請假時數" value={detail?.leave_hours} />
              <DetailRow label="加班時數" value={detail?.overtime_hours} />
              <DetailRow label="曠職時數" value={detail?.absent_hours} />
              <DetailRow label="計薪時數" value={detail?.payable_hours} />
              <DetailRow label="遲到分鐘" value={detail?.late_minutes} />
              <DetailRow label="早退分鐘" value={detail?.early_leave_minutes} />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSelectedRow(null)}>關閉</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}