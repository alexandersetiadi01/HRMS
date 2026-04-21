import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LabelCell } from "../../Components/GlobalComponent";
import {
  HOURS,
  MINUTES_60,
  selectMenuProps,
} from "../../Utils/Attendance/SharedForm";
import {
  apiCreateMissedPunchRequest,
  apiLeaveRequestFormMeta,
} from "../../API/attendance";
import { getCurrentEmployeeId } from "../../API/account";
import {
  buildDateTimeString,
  getTaiwanTodayDayjs,
  normalizeDateSet,
} from "./Leave/LeaveUtils";

const OFFICE = {
  value: "公司",
  label: "公司",
  lat: 25.0729,
  lng: 121.3615,
};

const TYPE_OPTIONS = [
  { value: "in", label: "上班" },
  { value: "out", label: "下班" },
];

function getErrorMessage(error, fallback = "送出忘打卡申請失敗，請稍後再試。") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function AttendanceMissedPunch() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const employeeId = Number(getCurrentEmployeeId() || 0);
  const today = useMemo(() => getTaiwanTodayDayjs(), []);

  const [open, setOpen] = useState(true);
  const [date, setDate] = useState(today);
  const [type, setType] = useState("");
  const [timeHour, setTimeHour] = useState("");
  const [timeMinute, setTimeMinute] = useState("");
  const [location, setLocation] = useState(OFFICE.value);
  const [reason, setReason] = useState("");

  const [formMeta, setFormMeta] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMeta() {
      try {
        setPageLoading(true);
        setErrorText("");

        const response = await apiLeaveRequestFormMeta({
          employee_id: employeeId,
        });

        if (!active) {
          return;
        }

        const payload = response?.data?.data || response?.data || response || {};
        setFormMeta(payload);
      } catch (error) {
        console.error("Failed to load missed punch form meta:", error);

        if (!active) {
          return;
        }

        setFormMeta({});
        setErrorText("載入忘打卡資料失敗，請稍後再試。");
      } finally {
        if (active) {
          setPageLoading(false);
        }
      }
    }

    loadMeta();

    return () => {
      active = false;
    };
  }, [employeeId]);

  const disabledDateSet = useMemo(() => {
    const holidaySet = normalizeDateSet(formMeta?.holiday_disabled_dates);

    const approvedLeaveRaw = formMeta?.approved_leave_dates_map || {};
    const approvedLeaveSource =
      approvedLeaveRaw?.[String(employeeId)] || approvedLeaveRaw || {};
    const approvedLeaveSet = normalizeDateSet(approvedLeaveSource);

    return new Set([...holidaySet, ...approvedLeaveSet]);
  }, [employeeId, formMeta]);

  const shouldDisableDate = (dateValue) => {
    if (!dateValue || !dayjs(dateValue).isValid()) {
      return false;
    }

    const weekday = dayjs(dateValue).day();
    if (weekday === 0 || weekday === 6) {
      return true;
    }

    const dateKey = dayjs(dateValue).format("YYYY-MM-DD");
    return disabledDateSet.has(dateKey);
  };

  useEffect(() => {
    if (pageLoading) {
      return;
    }

    if (!shouldDisableDate(date)) {
      return;
    }

    let nextDate = today;
    let tries = 0;

    while (tries < 370 && shouldDisableDate(nextDate)) {
      nextDate = nextDate.add(1, "day");
      tries += 1;
    }

    if (!shouldDisableDate(nextDate)) {
      setDate(nextDate);
    }
  }, [date, pageLoading, today, disabledDateSet]);

  const handleClose = () => {
    setOpen(false);
    navigate("/attendance");
  };

  const handleConfirm = async () => {
    setErrorText("");
    setSuccessText("");

    if (!date || !dayjs(date).isValid()) {
      setErrorText("請選擇日期。");
      return;
    }

    if (shouldDisableDate(date)) {
      setErrorText("該日期不可申請忘打卡。");
      return;
    }

    if (!type) {
      setErrorText("請選擇類型。");
      return;
    }

    if (timeHour === "" || timeMinute === "") {
      setErrorText("請完整填寫時間。");
      return;
    }

    const requestDate = dayjs(date).format("YYYY-MM-DD");
    const requestDateTime = buildDateTimeString(
      requestDate,
      timeHour,
      timeMinute,
    );

    if (!requestDateTime) {
      setErrorText("請完整填寫日期與時間。");
      return;
    }

    try {
      setSubmitLoading(true);

      await apiCreateMissedPunchRequest({
        employee_id: employeeId,
        request_punch_type: type,
        request_datetime: requestDateTime,
        location_label: location,
        latitude: OFFICE.lat,
        longitude: OFFICE.lng,
        reason,
      });

      setSuccessText("忘打卡申請已送出。");

      setTimeout(() => {
        handleClose();
      }, 600);
    } catch (error) {
      console.error("Failed to create missed punch request:", error);
      setErrorText(getErrorMessage(error));
    } finally {
      setSubmitLoading(false);
    }
  };

  const commonDatePickerSlotProps = {
    textField: {
      size: "small",
      sx: {
        width: "100%",
        minWidth: 0,
        "& .MuiInputBase-root": {
          height: "38px",
        },
        "& .MuiInputBase-input": {
          px: "12px",
          py: "8px",
          fontSize: "15px",
          minWidth: 0,
        },
      },
    },
    field: {
      clearable: false,
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            overflow: "hidden",
            m: { xs: 0, sm: 4 },
            height: { xs: "100%", sm: "auto" },
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#101b4d",
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: 700,
            px: "18px",
            py: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
            忘打卡申請
          </Typography>

          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: "#ffffff",
              p: 0,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: "20px", sm: "36px", md: "44px" },
            py: "28px",
            position: "relative",
          }}
        >
          {pageLoading ? (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255,255,255,0.5)",
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : null}

          {errorText ? (
            <Alert severity="error" sx={{ mb: "16px" }}>
              {errorText}
            </Alert>
          ) : null}

          {successText ? (
            <Alert severity="success" sx={{ mb: "16px" }}>
              {successText}
            </Alert>
          ) : null}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "90px 1fr" },
              rowGap: "18px",
              columnGap: "28px",
              alignItems: "start",
              maxWidth: "760px",
              opacity: pageLoading ? 0.7 : 1,
              pointerEvents: pageLoading ? "none" : "auto",
            }}
          >
            <LabelCell required>日期</LabelCell>
            <Box sx={{ width: "100%", maxWidth: { xs: "100%", sm: "270px" } }}>
              <DatePicker
                value={date}
                onChange={(value) => setDate(value)}
                format="YYYY-MM-DD"
                shouldDisableDate={shouldDisableDate}
                slotProps={commonDatePickerSlotProps}
              />
            </Box>

            <LabelCell required>類型</LabelCell>
            <Box sx={{ width: "100%", maxWidth: { xs: "100%", sm: "270px" } }}>
              <FormControl fullWidth>
                <Select
                  displayEmpty
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  MenuProps={selectMenuProps}
                  sx={{
                    height: "38px",
                    fontSize: "15px",
                  }}
                >
                  <MenuItem value="" disabled>
                    請選擇
                  </MenuItem>
                  {TYPE_OPTIONS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <LabelCell required>時間</LabelCell>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                maxWidth: { xs: "100%", sm: "270px" },
              }}
            >
              <FormControl
                sx={{
                  width: { xs: "calc((100% - 22px) / 2)", sm: "124px" },
                  flexShrink: 0,
                }}
              >
                <Select
                  displayEmpty
                  value={timeHour}
                  onChange={(e) => setTimeHour(e.target.value)}
                  MenuProps={selectMenuProps}
                  sx={{
                    height: "38px",
                    fontSize: "15px",
                  }}
                >
                  <MenuItem value="" disabled>
                    請選擇
                  </MenuItem>
                  {HOURS.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box
                sx={{
                  width: "22px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "18px",
                    color: "#374151",
                    lineHeight: 1,
                  }}
                >
                  :
                </Typography>
              </Box>

              <FormControl
                sx={{
                  width: { xs: "calc((100% - 22px) / 2)", sm: "124px" },
                  flexShrink: 0,
                }}
              >
                <Select
                  displayEmpty
                  value={timeMinute}
                  onChange={(e) => setTimeMinute(e.target.value)}
                  MenuProps={selectMenuProps}
                  sx={{
                    height: "38px",
                    fontSize: "15px",
                  }}
                >
                  <MenuItem value="" disabled>
                    請選擇
                  </MenuItem>
                  {MINUTES_60.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <LabelCell required>地點</LabelCell>
            <Box sx={{ width: "100%", maxWidth: { xs: "100%", sm: "270px" } }}>
              <FormControl fullWidth>
                <Select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  MenuProps={selectMenuProps}
                  sx={{
                    height: "38px",
                    fontSize: "15px",
                  }}
                >
                  <MenuItem value={OFFICE.value}>{OFFICE.label}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <LabelCell>事由</LabelCell>
            <Box sx={{ width: "100%", maxWidth: { xs: "100%", sm: "550px" } }}>
              <TextField
                fullWidth
                multiline
                minRows={4}
                value={reason}
                onChange={(e) => {
                  if (e.target.value.length <= 250) {
                    setReason(e.target.value);
                  }
                }}
                sx={{
                  "& .MuiInputBase-root": {
                    fontSize: "15px",
                  },
                }}
              />
              <Typography
                sx={{
                  mt: "8px",
                  fontSize: "14px",
                  color: "#9ca3af",
                }}
              >
                字數限制 250 字，已輸入 {reason.length} 字
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: "18px",
            py: "12px",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={pageLoading || submitLoading}
            sx={{
              minWidth: "64px",
              height: "36px",
              bgcolor: "#101b4d",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#0c1438",
                boxShadow: "none",
              },
              "&.Mui-disabled": {
                bgcolor: "#9ca3af",
                color: "#ffffff",
              },
            }}
          >
            {submitLoading ? "送出中" : "確定"}
          </Button>

          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={submitLoading}
            sx={{
              minWidth: "64px",
              height: "36px",
              color: "#374151",
              borderColor: "#9ca3af",
            }}
          >
            取消
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}