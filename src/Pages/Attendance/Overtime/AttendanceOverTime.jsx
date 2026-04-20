import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  HOURS,
  MINUTES_30,
  selectMenuProps,
  SectionLabel,
  MobileTimeSelect,
  buildAttendanceSectionWrapperSx,
} from "../../../Utils/Attendance/SharedForm";
import Breadcrumb from "../../../Utils/Breadcrumb";
import {
  apiAttendanceScheduleMonth,
  apiCreateOvertimeRequest,
  apiOvertimeRequestMeta,
} from "../../../API/attendance";
import { getCurrentEmployeeId } from "../../../API/account";
import {
  buildDateTimeString,
  calculateOvertimeSummary,
  findScheduleDay,
  formatClockRecordText,
  formatDuration,
  getDateKey,
  getOvertimeEndDefaultTime,
  getSelectableOvertimeDateSet,
  getShiftEndDefaultTime,
  getTaiwanTodayDayjs,
  normalizeScheduleMonthDays,
  safeText,
} from "./OvertimeUtils";

export default function AttendanceOvertime() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const employeeId = Number(getCurrentEmployeeId() || 0);
  const today = getTaiwanTodayDayjs();

  const [workDate, setWorkDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(today.startOf("month"));
  const [startHour, setStartHour] = useState("18");
  const [startMin, setStartMin] = useState("00");
  const [endHour, setEndHour] = useState("18");
  const [endMin, setEndMin] = useState("30");
  const [payType, setPayType] = useState("補休");
  const [reason, setReason] = useState("");

  const [monthDays, setMonthDays] = useState([]);
  const [meta, setMeta] = useState(null);
  const [monthLoading, setMonthLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMonthSchedule() {
      try {
        setMonthLoading(true);

        const response = await apiAttendanceScheduleMonth({
          year: calendarMonth.year(),
          month: calendarMonth.month() + 1,
          employee_id: employeeId,
        });

        if (!active) {
          return;
        }

        const days = normalizeScheduleMonthDays(response);
        setMonthDays(days);
      } catch (error) {
        console.error("Failed to load overtime month schedule:", error);

        if (!active) {
          return;
        }

        setMonthDays([]);
      } finally {
        if (active) {
          setMonthLoading(false);
        }
      }
    }

    loadMonthSchedule();

    return () => {
      active = false;
    };
  }, [calendarMonth, employeeId]);

  const allowedDateSet = useMemo(() => {
    return getSelectableOvertimeDateSet(monthDays);
  }, [monthDays]);

  useEffect(() => {
    if (monthLoading) {
      return;
    }

    const dateKey = getDateKey(workDate);
    if (dateKey && allowedDateSet.has(dateKey)) {
      return;
    }

    const firstAllowedDate = Array.from(allowedDateSet).sort()[0] || "";
    if (firstAllowedDate) {
      setWorkDate(dayjs(firstAllowedDate));
    }
  }, [allowedDateSet, monthLoading, workDate]);

  const selectedDateKey = useMemo(() => getDateKey(workDate), [workDate]);

  const selectedDay = useMemo(() => {
    return findScheduleDay(monthDays, selectedDateKey);
  }, [monthDays, selectedDateKey]);

  useEffect(() => {
    let active = true;

    async function loadMeta() {
      if (!selectedDateKey) {
        setMeta(null);
        return;
      }

      try {
        setMetaLoading(true);
        setErrorText("");

        const response = await apiOvertimeRequestMeta({
          employee_id: employeeId,
          work_date: selectedDateKey,
          year: dayjs(selectedDateKey).year(),
        });

        if (!active) {
          return;
        }

        const payload = response?.data?.data || response?.data || response || {};
        setMeta(payload);

        const defaultStart = getShiftEndDefaultTime(selectedDay, payload);
        const defaultEnd = getOvertimeEndDefaultTime(selectedDay, payload);

        setStartHour(defaultStart.hour);
        setStartMin(defaultStart.minute);
        setEndHour(defaultEnd.hour);
        setEndMin(defaultEnd.minute);
      } catch (error) {
        console.error("Failed to load overtime meta:", error);

        if (!active) {
          return;
        }

        const message =
          error?.response?.data?.message ||
          error?.response?.data?.data?.message ||
          "載入加班資料失敗，請稍後再試。";

        setErrorText(String(message));
        setMeta(null);
      } finally {
        if (active) {
          setMetaLoading(false);
        }
      }
    }

    loadMeta();

    return () => {
      active = false;
    };
  }, [employeeId, selectedDateKey, selectedDay]);

  const summary = useMemo(() => {
    return calculateOvertimeSummary({
      workDate: selectedDateKey,
      startHour,
      startMin,
      endHour,
      endMin,
      selectedDay,
      selectedMeta: meta,
    });
  }, [endHour, endMin, meta, selectedDateKey, selectedDay, startHour, startMin]);

  const clockRecordText = useMemo(() => {
    return formatClockRecordText(
      selectedDay,
      meta,
      selectedDateKey,
      endHour,
      endMin,
    );
  }, [selectedDay, meta, selectedDateKey, endHour, endMin]);

  const sectionWrapperSx = buildAttendanceSectionWrapperSx(isMobile);

  const shouldDisableDate = (dateValue) => {
    if (!dateValue || !dayjs(dateValue).isValid()) {
      return false;
    }

    const dateKey = dayjs(dateValue).format("YYYY-MM-DD");
    return !allowedDateSet.has(dateKey);
  };

  const commonDatePickerSlotProps = {
    textField: {
      size: "small",
      sx: {
        width: isMobile ? "100%" : "170px",
        minWidth: isMobile ? "100%" : "170px",
        "& .MuiInputBase-root": {
          height: "40px",
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

  const handleSubmit = async () => {
    setErrorText("");
    setSuccessText("");

    if (!selectedDateKey) {
      setErrorText("請選擇日期。");
      return;
    }

    if (!allowedDateSet.has(selectedDateKey)) {
      setErrorText("僅可選擇有班表的日期。");
      return;
    }

    const startDateTime = buildDateTimeString(selectedDateKey, startHour, startMin);
    const endDateTime = buildDateTimeString(selectedDateKey, endHour, endMin);

    if (!startDateTime || !endDateTime) {
      setErrorText("請完整填寫加班時間。");
      return;
    }

    if (dayjs(endDateTime).valueOf() <= dayjs(startDateTime).valueOf()) {
      setErrorText("結束時間必須晚於開始時間。");
      return;
    }

    if (summary.overtimeMinutes < 30) {
      setErrorText("至少須申請 0 時 30 分。");
      return;
    }

    if (!safeText(reason, "")) {
      setErrorText("請填寫事由。");
      return;
    }

    try {
      setSubmitLoading(true);

      const response = await apiCreateOvertimeRequest({
        employee_id: employeeId,
        overtime_type: "after_work",
        pay_method: payType === "加班費" ? "pay" : "comp_leave",
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        reason: reason.trim(),
      });

      const payload = response?.data?.data || response?.data || response || {};
      const requestedText =
        payload?.requested_text ||
        "";

      setSuccessText(
        requestedText
          ? `加班申請已送出，申請時數為 ${requestedText}。`
          : "加班申請已送出。",
      );

      setReason("");
      const defaultStart = getShiftEndDefaultTime(selectedDay, meta);
      const defaultEnd = getOvertimeEndDefaultTime(selectedDay, meta);
      setStartHour(defaultStart.hour);
      setStartMin(defaultStart.minute);
      setEndHour(defaultEnd.hour);
      setEndMin(defaultEnd.minute);
    } catch (error) {
      console.error("Failed to create overtime request:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.data?.message ||
        "加班申請失敗，請稍後再試。";

      setErrorText(String(message));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: "100%" }}>
        <Breadcrumb rootLabel="個人專區" currentLabel="加班" mb="14px" />
        <Typography
          sx={{
            fontSize: isMobile ? "24px" : "22px",
            fontWeight: 700,
            mb: "16px",
            color: "#111827",
          }}
        >
          加班
        </Typography>

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
            width: "100%",
            border: "1px solid #d1d5db",
            bgcolor: "#ffffff",
            position: "relative",
            opacity: monthLoading ? 0.7 : 1,
          }}
        >
          {(monthLoading || metaLoading) ? (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255,255,255,0.45)",
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : null}

          <Box sx={sectionWrapperSx}>
            <SectionLabel mobile={isMobile}>*時間</SectionLabel>

            <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                  mb: "12px",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                {isMobile ? (
                  <>
                    <Box
                      sx={{
                        width: "100%",
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: "#6b7280",
                          mb: "6px",
                          fontWeight: 700,
                        }}
                      >
                        日期
                      </Typography>

                      <DatePicker
                        value={workDate}
                        onChange={(value) => setWorkDate(value)}
                        onMonthChange={(value) => {
                          if (value && dayjs(value).isValid()) {
                            setCalendarMonth(dayjs(value).startOf("month"));
                          }
                        }}
                        format="YYYY-MM-DD"
                        shouldDisableDate={shouldDisableDate}
                        slotProps={commonDatePickerSlotProps}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: "8px",
                        width: "100%",
                        alignItems: "start",
                        mt: "8px",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: "#6b7280",
                            mb: "6px",
                            fontWeight: 700,
                          }}
                        >
                          起
                        </Typography>

                        <MobileTimeSelect
                          hour={startHour}
                          minute={startMin}
                          onChangeHour={setStartHour}
                          onChangeMinute={setStartMin}
                          hours={HOURS}
                          minutes={MINUTES_30}
                        />
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: "#6b7280",
                            mb: "6px",
                            fontWeight: 700,
                          }}
                        >
                          迄
                        </Typography>

                        <MobileTimeSelect
                          hour={endHour}
                          minute={endMin}
                          onChangeHour={setEndHour}
                          onChangeMinute={setEndMin}
                          hours={HOURS}
                          minutes={MINUTES_30}
                        />
                      </Box>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "#1f3b67",
                        width: "100%",
                        mt: "8px",
                        fontWeight: 700,
                      }}
                    >
                      總計：{formatDuration(summary.overtimeMinutes)}
                    </Typography>
                  </>
                ) : (
                  <>
                    <DatePicker
                      value={workDate}
                      onChange={(value) => setWorkDate(value)}
                      onMonthChange={(value) => {
                        if (value && dayjs(value).isValid()) {
                          setCalendarMonth(dayjs(value).startOf("month"));
                        }
                      }}
                      format="YYYY-MM-DD"
                      shouldDisableDate={shouldDisableDate}
                      slotProps={commonDatePickerSlotProps}
                    />

                    <FormControl sx={{ width: "70px" }}>
                      <Select
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        MenuProps={selectMenuProps}
                        sx={{ height: "38px", fontSize: "15px" }}
                      >
                        {HOURS.map((h) => (
                          <MenuItem key={h} value={h}>
                            {h}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography sx={{ fontSize: "18px", color: "#374151" }}>
                      :
                    </Typography>

                    <FormControl sx={{ width: "70px" }}>
                      <Select
                        value={startMin}
                        onChange={(e) => setStartMin(e.target.value)}
                        MenuProps={selectMenuProps}
                        sx={{ height: "38px", fontSize: "15px" }}
                      >
                        {MINUTES_30.map((m) => (
                          <MenuItem key={m} value={m}>
                            {m}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography sx={{ fontSize: "18px", color: "#374151" }}>
                      ~
                    </Typography>

                    <FormControl sx={{ width: "70px" }}>
                      <Select
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        MenuProps={selectMenuProps}
                        sx={{ height: "38px", fontSize: "15px" }}
                      >
                        {HOURS.map((h) => (
                          <MenuItem key={h} value={h}>
                            {h}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography sx={{ fontSize: "18px", color: "#374151" }}>
                      :
                    </Typography>

                    <FormControl sx={{ width: "70px" }}>
                      <Select
                        value={endMin}
                        onChange={(e) => setEndMin(e.target.value)}
                        MenuProps={selectMenuProps}
                        sx={{ height: "38px", fontSize: "15px" }}
                      >
                        {MINUTES_30.map((m) => (
                          <MenuItem key={m} value={m}>
                            {m}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography
                      sx={{
                        ml: "12px",
                        fontSize: "14px",
                        color: "#1f3b67",
                        fontWeight: 700,
                      }}
                    >
                      總計：{formatDuration(summary.overtimeMinutes)}
                    </Typography>
                  </>
                )}
              </Box>

              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#111827",
                  lineHeight: 1.7,
                  mb: "2px",
                }}
              >
                {clockRecordText}
              </Typography>

              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#111827",
                  lineHeight: 1.7,
                  mb: "20px",
                }}
              >
                (至少須申請 0 時 30 分且申請時數須為 0 時 30 分的倍數)
              </Typography>

              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#111827",
                  fontWeight: 700,
                  lineHeight: 1.7,
                }}
              >
                扣除休息時間 {formatDuration(summary.breakMinutes)}，共申請 {formatDuration(summary.appliedMinutes)}
              </Typography>
            </Box>
          </Box>

          <Box sx={sectionWrapperSx}>
            <SectionLabel mobile={isMobile}>*給付方式</SectionLabel>

            <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
              <RadioGroup
                row
                value={payType}
                onChange={(e) => setPayType(e.target.value)}
                sx={{
                  gap: "16px",
                  flexWrap: "nowrap",
                }}
              >
                <FormControlLabel
                  value="加班費"
                  control={<Radio size="small" />}
                  label="加班費"
                  sx={{
                    mr: 0,
                    "& .MuiFormControlLabel-label": {
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
                <FormControlLabel
                  value="補休"
                  control={<Radio size="small" />}
                  label="補休"
                  sx={{
                    mr: 0,
                    "& .MuiFormControlLabel-label": {
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
              </RadioGroup>
            </Box>
          </Box>

          <Box sx={sectionWrapperSx}>
            <SectionLabel mobile={isMobile}>*事由</SectionLabel>

            <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
              <TextField
                fullWidth
                multiline
                minRows={isMobile ? 4 : 6}
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
                  mb: "14px",
                  fontSize: "13px",
                  color: "#9ca3af",
                }}
              >
                字數限制 250 字，已輸入 {reason.length} 字
              </Typography>

              <Box
                sx={{
                  width: "100%",
                  bgcolor: "#e5e9f0",
                  px: "14px",
                  py: "14px",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#374151",
                    lineHeight: 1.8,
                  }}
                >
                  1.加班需事前申請，並經主管核准。 2.平日加班上限為4小時，每月加班上限為46小時。
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: "16px",
            gap: "10px",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <Button
            variant="contained"
            fullWidth={isMobile}
            disabled={submitLoading || monthLoading || metaLoading}
            onClick={handleSubmit}
            sx={{
              bgcolor: "#101b4d",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#0c1438",
                boxShadow: "none",
              },
            }}
          >
            {submitLoading ? "送出中..." : "確定"}
          </Button>
          <Button
            variant="outlined"
            fullWidth={isMobile}
            disabled={submitLoading}
            onClick={() => {
              const defaultStart = getShiftEndDefaultTime(selectedDay, meta);
              const defaultEnd = getOvertimeEndDefaultTime(selectedDay, meta);
              setStartHour(defaultStart.hour);
              setStartMin(defaultStart.minute);
              setEndHour(defaultEnd.hour);
              setEndMin(defaultEnd.minute);
              setReason("");
              setPayType("補休");
              setErrorText("");
              setSuccessText("");
            }}
          >
            取消
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}