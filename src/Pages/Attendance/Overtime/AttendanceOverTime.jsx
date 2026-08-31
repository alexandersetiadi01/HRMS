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
  selectMenuProps,
  SectionLabel,
  MobileTimeSelect,
  buildAttendanceSectionWrapperSx,
} from "../../../Utils/Attendance/SharedForm";
import Breadcrumb from "../../../Utils/Breadcrumb";
import { buildSelectableAttendanceDateSet } from "../../../Utils/Attendance/DateSelectionPolicy";
import {
  apiAttendanceScheduleMonth,
  apiCreateOvertimeRequest,
  apiOvertimeRequestMeta,
  apiOvertimeRules,
} from "../../../API/attendance";
import { getCurrentEmployeeId } from "../../../API/account";
import ProxyRequestEmployeeField from "../AttendanceForm/ProxyRequestEmployeeField";
import SuccessDialog from "../../../Components/SuccessDialog";
import {
  buildDateTimeString,
  calculateOvertimeSummary,
  findScheduleDay,
  formatClockRecordText,
  formatDuration,
  getDateKey,
  getOvertimeEndDefaultTime,
  getShiftEndDefaultTime,
  getTaiwanTodayDayjs,
  normalizeScheduleMonthDays,
  safeText,
} from "./OvertimeUtils";

function unwrapOvertimeRules(response) {
  const payload = response?.data?.data ?? response?.data ?? response ?? [];
  return Array.isArray(payload) ? payload : [];
}

function getOvertimeRuleValue(rules, ruleCode, fallback) {
  const rule = rules.find((item) => String(item?.rule_code || "") === ruleCode);

  if (!rule) {
    return fallback;
  }

  return rule.rule_value ?? fallback;
}

function buildMinuteOptions(step) {
  const minuteStep = Number(step);

  if (
    !Number.isInteger(minuteStep) ||
    minuteStep < 1 ||
    minuteStep > 60 ||
    60 % minuteStep !== 0
  ) {
    return ["00", "30"];
  }

  const options = [];

  for (let minute = 0; minute < 60; minute += minuteStep) {
    options.push(String(minute).padStart(2, "0"));
  }

  return options;
}

export default function AttendanceOvertime() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const employeeId = Number(getCurrentEmployeeId() || 0);
  const [proxyEmployeeId, setProxyEmployeeId] = useState("");
  const requestEmployeeId = Number(proxyEmployeeId || employeeId);
  const today = getTaiwanTodayDayjs();

  const [workDate, setWorkDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(today.startOf("month"));
  const [startHour, setStartHour] = useState("18");
  const [startMin, setStartMin] = useState("00");
  const [endHour, setEndHour] = useState("18");
  const [endMin, setEndMin] = useState("30");
  const [payType, setPayType] = useState("補休");
  const [reason, setReason] = useState("");

  const [monthDays, setMonthDays] = useState([]);
  const [meta, setMeta] = useState(null);
  const [minimumOvertimeMinutes, setMinimumOvertimeMinutes] = useState(30);
  const [overtimeMinuteStep, setOvertimeMinuteStep] = useState(30);
  const [allowLeaveDayOvertime, setAllowLeaveDayOvertime] = useState(false);
  const [allowCrossDayOvertime, setAllowCrossDayOvertime] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRules() {
      try {
        setRulesLoading(true);

        const response = await apiOvertimeRules();

        if (!active) {
          return;
        }

        const rules = unwrapOvertimeRules(response);
        const minimumMinutes = Number(
          getOvertimeRuleValue(rules, "minimum_overtime_minutes", 30),
        );
        const minuteStep = Number(
          getOvertimeRuleValue(rules, "overtime_minute_step", 30),
        );
        const allowLeaveDay =
          String(
            getOvertimeRuleValue(rules, "allow_leave_day_overtime", "0"),
          ) === "1";
        const allowCrossDay =
          String(
            getOvertimeRuleValue(rules, "allow_cross_day_overtime", "0"),
          ) === "1";

        setMinimumOvertimeMinutes(
          Number.isInteger(minimumMinutes) && minimumMinutes > 0
            ? minimumMinutes
            : 30,
        );
        setOvertimeMinuteStep(
          Number.isInteger(minuteStep) &&
            minuteStep > 0 &&
            minuteStep <= 60 &&
            60 % minuteStep === 0
            ? minuteStep
            : 30,
        );
        setAllowLeaveDayOvertime(allowLeaveDay);
        setAllowCrossDayOvertime(allowCrossDay);
      } catch (error) {
        console.error("Failed to load overtime rules:", error);

        if (active) {
          setMinimumOvertimeMinutes(30);
          setOvertimeMinuteStep(30);
          setAllowLeaveDayOvertime(false);
          setAllowCrossDayOvertime(false);
        }
      } finally {
        if (active) {
          setRulesLoading(false);
        }
      }
    }

    loadRules();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMonthSchedule() {
      try {
        setMonthLoading(true);

        const response = await apiAttendanceScheduleMonth({
          year: calendarMonth.year(),
          month: calendarMonth.month() + 1,
          employee_id: requestEmployeeId,
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
  }, [calendarMonth, requestEmployeeId]);

  const allowedDateSet = useMemo(() => {
    return buildSelectableAttendanceDateSet(monthDays, {
      allowHoliday: true,
      allowRestDay: true,
      allowLeave: allowLeaveDayOvertime,
      allowUnscheduled: true,
      requireSchedule: false,
    });
  }, [allowLeaveDayOvertime, monthDays]);

  const minuteOptions = useMemo(() => {
    return buildMinuteOptions(overtimeMinuteStep);
  }, [overtimeMinuteStep]);

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
  const endDateKey = useMemo(
    () => (allowCrossDayOvertime ? getDateKey(endDate) : selectedDateKey),
    [allowCrossDayOvertime, endDate, selectedDateKey],
  );

  useEffect(() => {
    if (!allowCrossDayOvertime) {
      setEndDate(workDate);
      return;
    }

    if (
      workDate &&
      endDate &&
      dayjs(endDate).isValid() &&
      dayjs(endDate).startOf("day").isBefore(dayjs(workDate).startOf("day"))
    ) {
      setEndDate(workDate);
    }
  }, [allowCrossDayOvertime, endDate, workDate]);

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
          employee_id: requestEmployeeId,
          work_date: selectedDateKey,
          year: dayjs(selectedDateKey).year(),
        });

        if (!active) {
          return;
        }

        const payload =
          response?.data?.data || response?.data || response || {};
        setMeta(payload);

        const defaultStart = getShiftEndDefaultTime(selectedDay, payload);
        const defaultEnd = getOvertimeEndDefaultTime(
          selectedDay,
          payload,
          minimumOvertimeMinutes,
        );

        setStartHour(defaultStart.hour);
        setStartMin(defaultStart.minute);
        setEndHour(defaultEnd.hour);
        setEndMin(defaultEnd.minute);

        if (allowCrossDayOvertime) {
          const startMinutes =
            Number(defaultStart.hour) * 60 + Number(defaultStart.minute);
          const endMinutes =
            Number(defaultEnd.hour) * 60 + Number(defaultEnd.minute);

          setEndDate(
            endMinutes <= startMinutes
              ? dayjs(selectedDateKey).add(1, "day")
              : dayjs(selectedDateKey),
          );
        } else {
          setEndDate(dayjs(selectedDateKey));
        }
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
  }, [
    allowCrossDayOvertime,
    requestEmployeeId,
    minimumOvertimeMinutes,
    selectedDateKey,
    selectedDay,
  ]);

  const summary = useMemo(() => {
    if (!allowCrossDayOvertime || endDateKey === selectedDateKey) {
      return calculateOvertimeSummary({
        workDate: selectedDateKey,
        startHour,
        startMin,
        endHour,
        endMin,
        selectedDay,
        selectedMeta: meta,
      });
    }

    const startDateTime = dayjs(
      buildDateTimeString(selectedDateKey, startHour, startMin),
    );
    const endDateTime = dayjs(buildDateTimeString(endDateKey, endHour, endMin));

    if (
      !startDateTime.isValid() ||
      !endDateTime.isValid() ||
      endDateTime.valueOf() <= startDateTime.valueOf()
    ) {
      return {
        totalMinutes: 0,
        breakMinutes: 0,
        appliedMinutes: 0,
        overtimeMinutes: 0,
      };
    }

    const overtimeMinutes = endDateTime.diff(startDateTime, "minute");

    return {
      totalMinutes: overtimeMinutes,
      breakMinutes: 0,
      appliedMinutes: overtimeMinutes,
      overtimeMinutes,
    };
  }, [
    allowCrossDayOvertime,
    endDateKey,
    endHour,
    endMin,
    meta,
    selectedDateKey,
    selectedDay,
    startHour,
    startMin,
  ]);

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

  const shouldDisableEndDate = (dateValue) => {
    if (
      !dateValue ||
      !dayjs(dateValue).isValid() ||
      !workDate ||
      !dayjs(workDate).isValid()
    ) {
      return false;
    }

    return dayjs(dateValue)
      .startOf("day")
      .isBefore(dayjs(workDate).startOf("day"));
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

    if (!selectedDateKey) {
      setErrorText("請選擇日期。");
      return;
    }

    if (!allowedDateSet.has(selectedDateKey)) {
      setErrorText("僅可選擇有班表的日期。");
      return;
    }

    if (allowCrossDayOvertime && !endDateKey) {
      setErrorText("請選擇結束日期。");
      return;
    }

    if (
      allowCrossDayOvertime &&
      dayjs(endDateKey)
        .startOf("day")
        .isBefore(dayjs(selectedDateKey).startOf("day"))
    ) {
      setErrorText("結束日期不可早於開始日期。");
      return;
    }

    const startDateTime = buildDateTimeString(
      selectedDateKey,
      startHour,
      startMin,
    );
    const endDateTime = buildDateTimeString(
      allowCrossDayOvertime ? endDateKey : selectedDateKey,
      endHour,
      endMin,
    );

    if (!startDateTime || !endDateTime) {
      setErrorText("請完整填寫加班時間。");
      return;
    }

    if (dayjs(endDateTime).valueOf() <= dayjs(startDateTime).valueOf()) {
      setErrorText("結束時間必須晚於開始時間。");
      return;
    }

    if (summary.overtimeMinutes < minimumOvertimeMinutes) {
      setErrorText(`至少須申請 ${formatDuration(minimumOvertimeMinutes)}。`);
      return;
    }

    if (!safeText(reason, "")) {
      setErrorText("請填寫事由。");
      return;
    }

    try {
      setSubmitLoading(true);

      const response = await apiCreateOvertimeRequest({
        employee_id: requestEmployeeId,
        overtime_type: "下班後",
        pay_method: payType === "加班費" ? "加班費" : "補休",
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        reason: reason.trim(),
      });

      const payload = response?.data?.data || response?.data || response || {};
      const requestedText = payload?.requested_text || "";

      setSuccessMessage(
        requestedText
          ? `加班申請已送出，申請時數為 ${requestedText}。`
          : "加班申請已送出。",
      );
      setSuccessOpen(true);

      setReason("");
      const defaultStart = getShiftEndDefaultTime(selectedDay, meta);
      const defaultEnd = getOvertimeEndDefaultTime(
        selectedDay,
        meta,
        minimumOvertimeMinutes,
      );
      setStartHour(defaultStart.hour);
      setStartMin(defaultStart.minute);
      setEndHour(defaultEnd.hour);
      setEndMin(defaultEnd.minute);
      setEndDate(workDate);
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
        <Breadcrumb
          rootLabel="個人專區"
          rootTo="/attendance"
          currentLabel="加班"
          mb="14px"
        />
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

        <Box sx={{ mb: "16px" }}>
          <ProxyRequestEmployeeField
            formType="overtime"
            value={proxyEmployeeId}
            onChange={setProxyEmployeeId}
            disabled={
              rulesLoading || monthLoading || metaLoading || submitLoading
            }
          />
        </Box>

        {errorText ? (
          <Alert severity="error" sx={{ mb: "16px" }}>
            {errorText}
          </Alert>
        ) : null}

        <Box
          sx={{
            width: "100%",
            border: "1px solid #d1d5db",
            bgcolor: "#ffffff",
            position: "relative",
            opacity: monthLoading || rulesLoading ? 0.7 : 1,
          }}
        >
          {rulesLoading || monthLoading || metaLoading ? (
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
                        display: "grid",
                        gridTemplateColumns: allowCrossDayOvertime
                          ? "minmax(0, 1fr) minmax(0, 1fr)"
                          : "minmax(0, 1fr)",
                        gap: "8px",
                        width: "100%",
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
                          {allowCrossDayOvertime ? "開始日期" : "日期"}
                        </Typography>

                        <DatePicker
                          value={workDate}
                          onChange={(value) => {
                            setWorkDate(value);

                            if (
                              allowCrossDayOvertime &&
                              value &&
                              dayjs(value).isValid() &&
                              (!endDate ||
                                !dayjs(endDate).isValid() ||
                                dayjs(endDate)
                                  .startOf("day")
                                  .isBefore(dayjs(value).startOf("day")))
                            ) {
                              setEndDate(value);
                            }
                          }}
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

                      {allowCrossDayOvertime ? (
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: "13px",
                              color: "#6b7280",
                              mb: "6px",
                              fontWeight: 700,
                            }}
                          >
                            結束日期
                          </Typography>

                          <DatePicker
                            value={endDate}
                            onChange={(value) => setEndDate(value)}
                            format="YYYY-MM-DD"
                            shouldDisableDate={shouldDisableEndDate}
                            slotProps={commonDatePickerSlotProps}
                          />
                        </Box>
                      ) : null}
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
                          minutes={minuteOptions}
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
                          minutes={minuteOptions}
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
                    {allowCrossDayOvertime ? (
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: "#6b7280",
                          fontWeight: 700,
                        }}
                      >
                        開始
                      </Typography>
                    ) : null}

                    <DatePicker
                      value={workDate}
                      onChange={(value) => {
                        setWorkDate(value);

                        if (
                          allowCrossDayOvertime &&
                          value &&
                          dayjs(value).isValid() &&
                          (!endDate ||
                            !dayjs(endDate).isValid() ||
                            dayjs(endDate)
                              .startOf("day")
                              .isBefore(dayjs(value).startOf("day")))
                        ) {
                          setEndDate(value);
                        }
                      }}
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
                        {minuteOptions.map((m) => (
                          <MenuItem key={m} value={m}>
                            {m}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography sx={{ fontSize: "18px", color: "#374151" }}>
                      ~
                    </Typography>

                    {allowCrossDayOvertime ? (
                      <>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: "#6b7280",
                            fontWeight: 700,
                          }}
                        >
                          結束
                        </Typography>

                        <DatePicker
                          value={endDate}
                          onChange={(value) => setEndDate(value)}
                          format="YYYY-MM-DD"
                          shouldDisableDate={shouldDisableEndDate}
                          slotProps={commonDatePickerSlotProps}
                        />
                      </>
                    ) : null}

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
                        {minuteOptions.map((m) => (
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
                (至少須申請 {formatDuration(minimumOvertimeMinutes)}{" "}
                且申請時間須以 {formatDuration(overtimeMinuteStep)} 為單位)
              </Typography>

              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#111827",
                  fontWeight: 700,
                  lineHeight: 1.7,
                }}
              >
                扣除休息時間 {formatDuration(summary.breakMinutes)}，共申請{" "}
                {formatDuration(summary.appliedMinutes)}
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
                  1.加班需事前申請，並經主管核准。
                  2.平日加班上限為4小時，每月加班上限為46小時。
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
            disabled={
              submitLoading || rulesLoading || monthLoading || metaLoading
            }
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
              const defaultEnd = getOvertimeEndDefaultTime(
                selectedDay,
                meta,
                minimumOvertimeMinutes,
              );
              setStartHour(defaultStart.hour);
              setStartMin(defaultStart.minute);
              setEndHour(defaultEnd.hour);
              setEndMin(defaultEnd.minute);
              setEndDate(workDate);
              setReason("");
              setPayType("補休");
              setErrorText("");
            }}
          >
            取消
          </Button>
        </Box>

        <SuccessDialog
          open={successOpen}
          title="申請成功"
          message={successMessage || "加班申請已送出。"}
          onClose={() => setSuccessOpen(false)}
        />
      </Box>
    </LocalizationProvider>
  );
}
