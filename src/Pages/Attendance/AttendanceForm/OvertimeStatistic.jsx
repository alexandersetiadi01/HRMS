import { useMemo, useRef, useState } from "react";
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

export default function OvertimeStatistic() {
  const now = useMemo(() => new Date(), []);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const toInputDate = (value) => value.replaceAll("/", "-");

  const defaultStartDate = useMemo(() => formatDate(now), [now]);
  const defaultEndDate = useMemo(() => {
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + 1);
    return formatDate(nextDate);
  }, [now]);

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [overtimeType, setOvertimeType] = useState("all");
  const [paymentType, setPaymentType] = useState("all");

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

  const handleClear = () => {
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setOvertimeType("all");
    setPaymentType("all");
  };

  return (
    <Box>
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
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <Typography
            sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}
          >
            <Box component="span" sx={{ color: "#ef4444", mr: "2px" }}>
              *
            </Box>
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
              width: "150px",
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

          <Typography sx={{ fontSize: "16px", color: "#111827" }}>~</Typography>

          <TextField
            size="small"
            type="date"
            value={toInputDate(endDate)}
            onChange={(event) =>
              setEndDate(event.target.value.replaceAll("-", "/"))
            }
            inputRef={endDateRef}
            sx={{
              width: "150px",
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
              }}
            />
          </Tooltip>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="outlined"
            sx={{
              minWidth: "50px",
              height: "32px",
              px: "14px",
              borderColor: "#9ca3af",
              color: "#111827",
              fontSize: "15px",
              borderRadius: "4px",
            }}
          >
            搜尋
          </Button>

          <Button
            variant="outlined"
            onClick={handleClear}
            sx={{
              minWidth: "50px",
              height: "32px",
              px: "14px",
              borderColor: "#9ca3af",
              color: "#111827",
              fontSize: "15px",
              borderRadius: "4px",
            }}
          >
            清空
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                minWidth: "204px",
                height: "32px",
                fontSize: "15px",
                bgcolor: "#ffffff",
                "& .MuiSelect-select": {
                  py: "4px",
                },
              }}
            >
              {OVERTIME_TYPE_OPTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                minWidth: "204px",
                height: "32px",
                fontSize: "15px",
                bgcolor: "#ffffff",
                "& .MuiSelect-select": {
                  py: "4px",
                },
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

      <Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "12% 10% 12% 13% 13% 13% 13% 14%",
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
            加班類型
          </Typography>

          <Typography
            sx={{
              gridColumn: "3 / 4",
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
              gridColumn: "4 / 7",
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
              gridColumn: "4 / 5",
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
              gridColumn: "5 / 6",
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
              gridColumn: "6 / 7",
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
              gridColumn: "7 / 8",
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
              gridColumn: "8 / 9",
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
      </Box>
    </Box>
  );
}