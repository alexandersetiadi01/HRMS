import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import HelpIcon from "@mui/icons-material/Help";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { apiOvertimeStatistics } from "../../../API/attendance";
import {
  ACTION_BUTTON_SX,
  COMMON_SELECT_SX,
} from "./ApplicationRecord/Options";
import {
  FilterActions,
  MobileSectionTitle,
} from "./ApplicationRecord/SharedFields";
import ResponsiveAttendanceTable from "./ResponsiveAttendanceTable";

const OVERTIME_TYPE_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "weekday", label: "平日" },
  { value: "rest-day", label: "休假日" },
  { value: "national-holiday", label: "國定假日" },
  { value: "make-up-holiday", label: "休息日" },
  { value: "special-holiday", label: "例假日" },
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "overtime-pay", label: "加班費" },
  { value: "comp-leave", label: "補休" },
];

const MOBILE_TABLE_COLUMNS = [
  { key: "attributionDate", label: "加班歸屬日" },
  { key: "paymentMethod", label: "給付方式" },
  { key: "signingHours", label: "簽核中" },
  { key: "approvedHours", label: "已核准" },
  { key: "pendingConfirmHours", label: "待確認" },
  { key: "payableHours", label: "計給時數" },
  { key: "actualPayHours", label: "實際給付時數" },
];

function getErrorMessage(error, fallback = "載入資料失敗，請稍後再試。") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function toApiDate(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  return raw.replaceAll("/", "-");
}

function toLabelFromOvertimeType(value) {
  const raw = String(value || "").trim();
  const normalized = raw.toLowerCase();

  const map = {
    weekday: "平日",
    after_work: "平日",
    "rest-day": "休假日",
    rest_day: "休假日",
    "national-holiday": "國定假日",
    national_holiday: "國定假日",
    "make-up-holiday": "休息日",
    make_up_holiday: "休息日",
    "special-holiday": "例假日",
    special_holiday: "例假日",
    下班後: "下班後",
    上班前: "上班前",
    假日加班: "假日加班",
  };

  return map[raw] || map[normalized] || String(value || "");
}

function toLabelFromPayMethod(value) {
  const raw = String(value || "").trim();
  const normalized = raw.toLowerCase();

  const map = {
    "overtime-pay": "加班費",
    overtime_pay: "加班費",
    cash: "加班費",
    pay: "加班費",
    "comp-leave": "補休",
    comp_leave: "補休",
    leave: "補休",
    加班費: "加班費",
    補休: "補休",
  };

  return map[raw] || map[normalized] || String(value || "");
}

function formatHours(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  if (Number.isInteger(number)) {
    return String(number);
  }

  return number.toFixed(1);
}

function groupStatisticsRows(items = []) {
  const map = new Map();

  items.forEach((item) => {
    const attributionDate = String(
      item?.request_date || item?.work_date || item?.attribution_date || "",
    ).trim();

    const overtimeType = toLabelFromOvertimeType(
      item?.overtime_type_label || item?.overtime_type || "",
    );
    const paymentMethod = toLabelFromPayMethod(
      item?.pay_method_label || item?.pay_method || "",
    );

    const key = [attributionDate, overtimeType, paymentMethod].join("||");

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        attributionDate,
        overtimeType,
        paymentMethod,
        signingHours: 0,
        approvedHours: 0,
        pendingConfirmHours: 0,
        payableHours: 0,
        actualPayHours: 0,
      });
    }

    const row = map.get(key);
    const hours =
      Number(
        item?.requested_hours ?? item?.overtime_hours ?? item?.hours ?? 0,
      ) || 0;

    const status = String(item?.request_status || "").trim();
    const normalizedStatus = status.toLowerCase();

    if (status === "待簽核" || normalizedStatus === "pending") {
      row.signingHours += hours;
    } else if (status === "已核准" || normalizedStatus === "approved") {
      row.approvedHours += hours;
      row.payableHours += hours;
      row.actualPayHours += hours;
    } else if (
      normalizedStatus === "waiting_confirmation" ||
      normalizedStatus === "confirming"
    ) {
      row.pendingConfirmHours += hours;
    }
  });

  return Array.from(map.values()).map((row) => ({
    ...row,
    signingHours: formatHours(row.signingHours),
    approvedHours: formatHours(row.approvedHours),
    pendingConfirmHours: formatHours(row.pendingConfirmHours),
    payableHours: formatHours(row.payableHours),
    actualPayHours: formatHours(row.actualPayHours),
  }));
}

export default function OvertimeStatistic() {
  const toInputDate = (value) => {
    if (!value) return "";
    return value.replaceAll("/", "-");
  };

  const defaultStartDate = "";
  const defaultEndDate = "";

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [overtimeType, setOvertimeType] = useState("all");
  const [paymentType, setPaymentType] = useState("all");

  const [submittedStartDate, setSubmittedStartDate] =
    useState(defaultStartDate);
  const [submittedEndDate, setSubmittedEndDate] = useState(defaultEndDate);
  const [submittedOvertimeType, setSubmittedOvertimeType] = useState("all");
  const [submittedPaymentType, setSubmittedPaymentType] = useState("all");

  const [sourceItems, setSourceItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const openNativeDatePicker = (inputRef) => {
    const input = inputRef?.current;
    if (!input) return;

    input.focus();

    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  };

  const filteredRows = useMemo(() => {
    let rows = groupStatisticsRows(sourceItems);

    if (submittedOvertimeType !== "all") {
      const typeLabel =
        OVERTIME_TYPE_OPTIONS.find(
          (item) => item.value === submittedOvertimeType,
        )?.label || "";

      rows = rows.filter((row) => row.overtimeType === typeLabel);
    }

    if (submittedPaymentType !== "all") {
      const paymentLabel =
        PAYMENT_OPTIONS.find((item) => item.value === submittedPaymentType)
          ?.label || "";

      rows = rows.filter((row) => row.paymentMethod === paymentLabel);
    }

    return rows;
  }, [sourceItems, submittedOvertimeType, submittedPaymentType]);

  const loadData = async (
    nextStartDate,
    nextEndDate,
    nextOvertimeType,
    nextPaymentType,
  ) => {
    try {
      setLoading(true);
      setErrorText("");

      const response = await apiOvertimeStatistics({
        date_from: toApiDate(nextStartDate),
        date_to: toApiDate(nextEndDate),
      });

      const payload = response?.data?.data || response?.data || response || {};

      const items = Array.isArray(payload?.items) ? payload.items : [];
      setSourceItems(items);
    } catch (error) {
      console.error(error);
      setErrorText(getErrorMessage(error));
      setSourceItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(
      submittedStartDate,
      submittedEndDate,
      submittedOvertimeType,
      submittedPaymentType,
    );
  }, [
    submittedStartDate,
    submittedEndDate,
    submittedOvertimeType,
    submittedPaymentType,
  ]);

  const handleSearch = () => {
    setSubmittedStartDate(startDate);
    setSubmittedEndDate(endDate);
    setSubmittedOvertimeType(overtimeType);
    setSubmittedPaymentType(paymentType);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setOvertimeType("all");
    setPaymentType("all");

    setSubmittedStartDate("");
    setSubmittedEndDate("");
    setSubmittedOvertimeType("all");
    setSubmittedPaymentType("all");
  };

  return (
    <Box>
      <MobileSectionTitle>加班紀錄 / 加班統計</MobileSectionTitle>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          mb: "14px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              gap: { xs: "8px", sm: "10px" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Typography
              sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}
            >
              查詢日期
            </Typography>

            <TextField
              size="small"
              type="date"
              value={toInputDate(startDate)}
              onChange={(event) =>
                setStartDate(event.target.value.replaceAll("-", "/"))
              }
              inputRef={startDateRef}
              sx={{
                width: { xs: "100%", sm: "150px" },
                "& .MuiInputBase-root": {
                  height: "32px",
                  fontSize: "15px",
                  bgcolor: "#ffffff",
                },
                "& input::-webkit-calendar-picker-indicator": {
                  opacity: 0,
                  position: "absolute",
                  right: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                },
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={() => openNativeDatePicker(startDateRef)}
                    sx={{
                      mr: "-4px",
                      p: "4px",
                    }}
                  >
                    <CalendarTodayIcon
                      sx={{ fontSize: "18px", color: "#6b7280" }}
                    />
                  </IconButton>
                ),
              }}
            />

            <Typography
              sx={{
                fontSize: "16px",
                color: "#111827",
                textAlign: { xs: "center", sm: "left" },
                width: { xs: "100%", sm: "auto" },
                my: { xs: "4px", sm: 0 },
              }}
            >
              ~
            </Typography>

            <TextField
              size="small"
              type="date"
              value={toInputDate(endDate)}
              onChange={(event) =>
                setEndDate(event.target.value.replaceAll("-", "/"))
              }
              inputRef={endDateRef}
              sx={{
                width: { xs: "100%", sm: "150px" },
                "& .MuiInputBase-root": {
                  height: "32px",
                  fontSize: "15px",
                  bgcolor: "#ffffff",
                },
                "& input::-webkit-calendar-picker-indicator": {
                  opacity: 0,
                  position: "absolute",
                  right: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                },
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={() => openNativeDatePicker(endDateRef)}
                    sx={{
                      mr: "-4px",
                      p: "4px",
                    }}
                  >
                    <CalendarTodayIcon
                      sx={{ fontSize: "18px", color: "#6b7280" }}
                    />
                  </IconButton>
                ),
              }}
            />

            <Tooltip
              title={
                <Typography sx={{ fontSize: "14px", color: "#111827" }}>
                  查詢區間不得超過 180 天
                </Typography>
              }
              arrow
              placement="right"
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: "#ffffff",
                    color: "#111827",
                    border: "1px solid #d1d5db",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                    px: "12px",
                    py: "8px",
                  },
                },
                arrow: {
                  sx: {
                    color: "#ffffff",
                    "&:before": {
                      border: "1px solid #d1d5db",
                    },
                  },
                },
              }}
            >
              <HelpIcon
                sx={{
                  fontSize: "20px",
                  color: "#6b7bb5",
                  cursor: "pointer",
                  alignSelf: { xs: "flex-start", sm: "center" },
                }}
              />
            </Tooltip>
          </Box>

          <FilterActions>
            <Button
              variant="outlined"
              onClick={handleSearch}
              sx={ACTION_BUTTON_SX}
            >
              搜尋
            </Button>

            <Button
              variant="outlined"
              onClick={handleClear}
              sx={ACTION_BUTTON_SX}
            >
              清空
            </Button>
          </FilterActions>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            gap: "28px",
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              gap: { xs: "8px", sm: "10px" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Typography
              sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}
            >
              加班類型
            </Typography>

            <Select
              size="small"
              value={overtimeType}
              onChange={(event) => setOvertimeType(event.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    mt: "2px",
                    borderRadius: "2px",
                    boxShadow: "none",
                    border: "1px solid #cfcfcf",
                    maxHeight: 220,
                    "& .MuiMenuItem-root": {
                      minHeight: "36px",
                      fontSize: "15px",
                      color: "#374151",
                    },
                    "& .Mui-selected": {
                      bgcolor: "#dbe5f1 !important",
                      color: "#111827",
                    },
                    "& .MuiMenuItem-root:hover": {
                      bgcolor: "#eef3f8",
                    },
                  },
                },
              }}
              sx={{
                minWidth: { xs: "100%", sm: "204px" },
                width: { xs: "100%", sm: "auto" },
                ...COMMON_SELECT_SX,
              }}
            >
              {OVERTIME_TYPE_OPTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              gap: { xs: "8px", sm: "10px" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Typography
              sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}
            >
              給付方式
            </Typography>

            <Select
              size="small"
              value={paymentType}
              onChange={(event) => setPaymentType(event.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    mt: "2px",
                    borderRadius: "2px",
                    boxShadow: "none",
                    border: "1px solid #cfcfcf",
                    maxHeight: 220,
                    "& .MuiMenuItem-root": {
                      minHeight: "36px",
                      fontSize: "15px",
                      color: "#374151",
                    },
                    "& .Mui-selected": {
                      bgcolor: "#dbe5f1 !important",
                      color: "#111827",
                    },
                    "& .MuiMenuItem-root:hover": {
                      bgcolor: "#eef3f8",
                    },
                  },
                },
              }}
              sx={{
                minWidth: { xs: "100%", sm: "204px" },
                width: { xs: "100%", sm: "auto" },
                ...COMMON_SELECT_SX,
              }}
            >
              {PAYMENT_OPTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "16% 16% 13% 13% 13% 14% 15%",
              gridTemplateRows: "40px 40px",
              alignItems: "center",
              bgcolor: "#d4d4d4",
              px: "12px",
            }}
          >
            <Typography
              sx={{
                gridColumn: "1 / 2",
                gridRow: "1 / 3",
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              加班歸屬日
            </Typography>

            <Typography
              sx={{
                gridColumn: "2 / 3",
                gridRow: "1 / 3",
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              給付方式
            </Typography>

            <Box
              sx={{
                gridColumn: "3 / 6",
                gridRow: "1 / 2",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderBottom: "1px solid #bdbdbd",
              }}
            >
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                申請時數
              </Typography>
            </Box>

            <Typography
              sx={{
                gridColumn: "3 / 4",
                gridRow: "2 / 3",
                textAlign: "center",
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              簽核中
            </Typography>

            <Typography
              sx={{
                gridColumn: "4 / 5",
                gridRow: "2 / 3",
                textAlign: "center",
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              已核准
            </Typography>

            <Typography
              sx={{
                gridColumn: "5 / 6",
                gridRow: "2 / 3",
                textAlign: "center",
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              待確認
            </Typography>

            <Typography
              sx={{
                gridColumn: "6 / 7",
                gridRow: "1 / 3",
                textAlign: "center",
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              計給時數
            </Typography>

            <Typography
              sx={{
                gridColumn: "7 / 8",
                gridRow: "1 / 3",
                textAlign: "center",
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              實際給付時數
            </Typography>
          </Box>

          {loading ? (
            <Box
              sx={{
                px: "12px",
                py: "14px",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              <Typography
                sx={{
                  fontSize: "15px",
                  color: "#111827",
                }}
              >
                載入中...
              </Typography>
            </Box>
          ) : errorText ? (
            <Box
              sx={{
                px: "12px",
                py: "14px",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              <Typography
                sx={{
                  fontSize: "15px",
                  color: "#dc2626",
                }}
              >
                {errorText}
              </Typography>
            </Box>
          ) : filteredRows.length === 0 ? (
            <Box
              sx={{
                px: "12px",
                py: "14px",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              <Typography
                sx={{
                  fontSize: "15px",
                  color: "#111827",
                }}
              >
                查無資料
              </Typography>
            </Box>
          ) : (
            filteredRows.map((row) => (
              <Box
                key={row.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "16% 16% 13% 13% 13% 14% 15%",
                  alignItems: "center",
                  px: "12px",
                  py: "14px",
                  borderBottom: "1px solid #d1d5db",
                }}
              >
                <Typography sx={{ fontSize: "15px", color: "#111827" }}>
                  {row.attributionDate}
                </Typography>
                <Typography sx={{ fontSize: "15px", color: "#111827" }}>
                  {row.paymentMethod}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "15px",
                    color: "#111827",
                    textAlign: "center",
                  }}
                >
                  {row.signingHours}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "15px",
                    color: "#111827",
                    textAlign: "center",
                  }}
                >
                  {row.approvedHours}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "15px",
                    color: "#111827",
                    textAlign: "center",
                  }}
                >
                  {row.pendingConfirmHours}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "15px",
                    color: "#111827",
                    textAlign: "center",
                  }}
                >
                  {row.payableHours}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "15px",
                    color: "#111827",
                    textAlign: "center",
                  }}
                >
                  {row.actualPayHours}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <ResponsiveAttendanceTable
          columns={MOBILE_TABLE_COLUMNS}
          rows={filteredRows}
          mobileCardTitleKey="attributionDate"
          getRowKey={(row) => row.id}
        />
      </Box>
    </Box>
  );
}
