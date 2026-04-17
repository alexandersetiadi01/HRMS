import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
  MINUTES_60,
  selectMenuProps,
  SectionLabel,
  MobileTimeSelect,
  buildAttendanceSectionWrapperSx,
} from "../../../Utils/Attendance/SharedForm";
import Breadcrumb from "../../../Utils/Breadcrumb";
import {
  apiCreateLeaveRequest,
  apiLeaveRequestFormMeta,
  apiLeaveTypes,
} from "../../../API/attendance";
import { getCurrentEmployeeId } from "../../../API/account";
import {
  AGENT_OPTIONS,
  FORM_TYPES,
  SPECIAL_LEAVE_TYPES,
} from "./LeaveConstants";
import {
  buildDateTimeString,
  calculateLeaveHoursFromSchedule,
  formatHoursSummaryText,
  formatHoursText,
  getTaiwanTodayDayjs,
  normalizeDateSet,
  normalizeLeaveTypes,
  safeText,
} from "./LeaveUtils";
import LeaveTypeRow from "./LeaveTypeRow";
import LeaveSpecialDialog from "./LeaveSpecialDialog";

export default function AttendanceLeave() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const today = getTaiwanTodayDayjs();
  const employeeId = Number(getCurrentEmployeeId() || 0);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startHour, setStartHour] = useState("09");
  const [startMin, setStartMin] = useState("00");
  const [endHour, setEndHour] = useState("18");
  const [endMin, setEndMin] = useState("00");
  const [reason, setReason] = useState("");
  const [agent, setAgent] = useState("17001");
  const [isProxyApproval, setIsProxyApproval] = useState("no");
  const [selectedFormTypes, setSelectedFormTypes] = useState([
    "missed-punch",
    "leave",
    "overtime",
    "business-trip",
  ]);

  const [leaveRows, setLeaveRows] = useState([{ id: 1, leaveType: "" }]);

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [formMeta, setFormMeta] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [specialOpen, setSpecialOpen] = useState(false);
  const [specialReason, setSpecialReason] = useState("");
  const [specialLeaveType, setSpecialLeaveType] = useState("");
  const [specialFiles, setSpecialFiles] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setPageLoading(true);
        setPageError("");

        const [leaveTypesRes, formMetaRes] = await Promise.all([
          apiLeaveTypes(),
          apiLeaveRequestFormMeta(),
        ]);

        if (!active) {
          return;
        }

        const normalizedLeaveTypes = normalizeLeaveTypes(leaveTypesRes);
        const metaPayload =
          formMetaRes?.data?.data || formMetaRes?.data || formMetaRes || {};

        setLeaveTypes(normalizedLeaveTypes);
        setFormMeta(metaPayload);

        setLeaveRows((prev) => {
          const firstSelected = prev?.[0]?.leaveType || "";
          const hasSelected = normalizedLeaveTypes.some(
            (item) => String(item.value) === String(firstSelected),
          );

          if (hasSelected) {
            return prev;
          }

          return [
            {
              id: 1,
              leaveType: normalizedLeaveTypes[0]?.value || "",
            },
          ];
        });
      } catch (error) {
        console.error("Failed to load leave page data:", error);
        if (!active) {
          return;
        }

        setPageError("載入請假資料失敗，請稍後再試。");
      } finally {
        if (active) {
          setPageLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const disabledDateSet = useMemo(() => {
    const holidaySet = normalizeDateSet(formMeta?.holiday_disabled_dates);

    const approvedLeaveRaw = formMeta?.approved_leave_dates_map || {};
    const approvedLeaveSource =
      approvedLeaveRaw?.[String(employeeId)] || approvedLeaveRaw || {};
    const approvedLeaveSet = normalizeDateSet(approvedLeaveSource);

    return new Set([...holidaySet, ...approvedLeaveSet]);
  }, [employeeId, formMeta]);

  const shouldDisableLeaveDate = (dateValue) => {
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

  const totalLeaveHours = useMemo(() => {
    return calculateLeaveHoursFromSchedule({
      startDate,
      startHour,
      startMin,
      endDate,
      endHour,
      endMin,
      formMeta,
      employeeId,
    });
  }, [
    employeeId,
    endDate,
    endHour,
    endMin,
    formMeta,
    startDate,
    startHour,
    startMin,
  ]);

  const totalDisplayText = useMemo(() => {
    return formatHoursSummaryText(totalLeaveHours);
  }, [totalLeaveHours]);

  const sectionWrapperSx = buildAttendanceSectionWrapperSx(isMobile);

  const handleRemoveLeaveRow = (id) => {
    setLeaveRows((prev) => {
      if (prev.length <= 1) {
        return prev;
      }

      return prev.filter((row) => row.id !== id);
    });
  };

  const updateLeaveRow = (id, key, value) => {
    setLeaveRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  };

  const handleToggleFormType = (key) => {
    setSelectedFormTypes((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitSuccess("");

    const selectedRow = leaveRows[0] || {};
    const leaveTypeId = safeText(selectedRow.leaveType, "");
    const startDateTime = buildDateTimeString(startDate, startHour, startMin);
    const endDateTime = buildDateTimeString(endDate, endHour, endMin);

    if (!leaveTypeId) {
      setSubmitError("請選擇假別。");
      return;
    }

    if (
      !startDate ||
      !endDate ||
      !dayjs(startDate).isValid() ||
      !dayjs(endDate).isValid()
    ) {
      setSubmitError("請完整填寫請假日期。");
      return;
    }

    if (shouldDisableLeaveDate(startDate) || shouldDisableLeaveDate(endDate)) {
      setSubmitError("所選日期不可申請請假，請重新選擇。");
      return;
    }

    if (!startDateTime || !endDateTime) {
      setSubmitError("請完整填寫請假時間。");
      return;
    }

    if (dayjs(startDateTime).valueOf() >= dayjs(endDateTime).valueOf()) {
      setSubmitError("結束時間必須晚於開始時間。");
      return;
    }

    if (!safeText(reason, "")) {
      setSubmitError("請填寫事由。");
      return;
    }

    try {
      setSubmitLoading(true);

      const response = await apiCreateLeaveRequest({
        leave_type_id: Number(leaveTypeId),
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        reason: reason.trim(),
      });

      const payload = response?.data?.data || response?.data || response || {};
      const requestedHours =
        payload?.requested_hours ??
        payload?.request?.requested_hours ??
        "";

      setSubmitSuccess(
        requestedHours !== ""
          ? `請假申請已送出，申請時數為 ${formatHoursText(requestedHours)}。`
          : "請假申請已送出。",
      );

      setReason("");
      setStartDate(today);
      setEndDate(today);
      setStartHour("09");
      setStartMin("00");
      setEndHour("18");
      setEndMin("00");
      setLeaveRows((prev) => [
        {
          id: 1,
          leaveType: prev?.[0]?.leaveType || leaveTypes[0]?.value || "",
        },
      ]);
    } catch (error) {
      console.error("Failed to create leave request:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.data?.message ||
        "請假申請失敗，請稍後再試。";

      setSubmitError(String(message));
    } finally {
      setSubmitLoading(false);
    }
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: "100%" }}>
        <Breadcrumb rootLabel="個人專區" currentLabel="請假" mb="14px" />

        <Typography
          sx={{
            fontSize: isMobile ? "24px" : "22px",
            fontWeight: 700,
            mb: "16px",
            color: "#111827",
          }}
        >
          請假
        </Typography>

        {pageError ? (
          <Alert severity="error" sx={{ mb: "16px" }}>
            {pageError}
          </Alert>
        ) : null}

        {submitError ? (
          <Alert severity="error" sx={{ mb: "16px" }}>
            {submitError}
          </Alert>
        ) : null}

        {submitSuccess ? (
          <Alert severity="success" sx={{ mb: "16px" }}>
            {submitSuccess}
          </Alert>
        ) : null}

        <Box
          sx={{
            width: "100%",
            border: "1px solid #d1d5db",
            bgcolor: "#ffffff",
            opacity: pageLoading ? 0.7 : 1,
            pointerEvents: pageLoading ? "none" : "auto",
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

          <Box sx={sectionWrapperSx}>
            <SectionLabel mobile={isMobile}>* 日期/時間</SectionLabel>

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
                        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: "8px",
                        width: "100%",
                        alignItems: "start",
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

                        <DatePicker
                          value={startDate}
                          onChange={(value) => setStartDate(value)}
                          format="YYYY-MM-DD"
                          shouldDisableDate={shouldDisableLeaveDate}
                          slotProps={commonDatePickerSlotProps}
                        />

                        <Box sx={{ mt: "8px" }}>
                          <MobileTimeSelect
                            hour={startHour}
                            minute={startMin}
                            onChangeHour={setStartHour}
                            onChangeMinute={setStartMin}
                            hours={HOURS}
                            minutes={MINUTES_60}
                          />
                        </Box>
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

                        <DatePicker
                          value={endDate}
                          onChange={(value) => setEndDate(value)}
                          format="YYYY-MM-DD"
                          shouldDisableDate={shouldDisableLeaveDate}
                          slotProps={commonDatePickerSlotProps}
                        />

                        <Box sx={{ mt: "8px" }}>
                          <MobileTimeSelect
                            hour={endHour}
                            minute={endMin}
                            onChangeHour={setEndHour}
                            onChangeMinute={setEndMin}
                            hours={HOURS}
                            minutes={MINUTES_60}
                          />
                        </Box>
                      </Box>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "#1f3b67",
                        width: "100%",
                        mt: "8px",
                      }}
                    >
                      總計：{totalDisplayText}
                    </Typography>
                  </>
                ) : (
                  <>
                    <DatePicker
                      value={startDate}
                      onChange={(value) => setStartDate(value)}
                      format="YYYY-MM-DD"
                      shouldDisableDate={shouldDisableLeaveDate}
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
                        {MINUTES_60.map((m) => (
                          <MenuItem key={m} value={m}>
                            {m}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography sx={{ fontSize: "18px", color: "#374151" }}>
                      ~
                    </Typography>

                    <DatePicker
                      value={endDate}
                      onChange={(value) => setEndDate(value)}
                      format="YYYY-MM-DD"
                      shouldDisableDate={shouldDisableLeaveDate}
                      slotProps={commonDatePickerSlotProps}
                    />

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
                        {MINUTES_60.map((m) => (
                          <MenuItem key={m} value={m}>
                            {m}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography
                      sx={{ ml: "8px", fontSize: "14px", color: "#1f3b67" }}
                    >
                      總計：{totalDisplayText}
                    </Typography>
                  </>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  mb: "8px",
                }}
              >
                {leaveRows.map((row) => (
                  <LeaveTypeRow
                    key={row.id}
                    row={row}
                    leaveTypes={leaveTypes}
                    onRemove={() => handleRemoveLeaveRow(row.id)}
                    onChangeType={(value) =>
                      updateLeaveRow(row.id, "leaveType", value)
                    }
                    mobile={isMobile}
                    balanceMap={formMeta?.leave_balance_map || {}}
                    employeeId={employeeId}
                  />
                ))}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: isMobile ? "stretch" : "center",
                  justifyContent: "space-between",
                  mb: "10px",
                  gap: "12px",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <Typography sx={{ fontSize: "14px", color: "#1f3b67" }}>
                  總計：{totalDisplayText}，系統依開始時間與結束時間對應班表工時自動計算，並以 30 分鐘為單位。
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: isMobile ? "stretch" : "center",
                    gap: "8px",
                    flexShrink: 0,
                    flexDirection: isMobile ? "column" : "row",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  <Typography sx={{ fontSize: "13px", color: "#9ca3af" }}>
                    找不到可用假別?
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth={isMobile}
                    disabled
                    sx={{
                      minWidth: "88px",
                      height: "32px",
                      fontSize: "12px",
                      bgcolor: "#101b4d",
                      boxShadow: "none",
                      opacity: 0.5,
                      "&.Mui-disabled": {
                        bgcolor: "#101b4d",
                        color: "#ffffff",
                        opacity: 0.5,
                      },
                    }}
                  >
                    特殊假別申請
                  </Button>
                </Box>
              </Box>

              <Box
                sx={{
                  height: "22px",
                  bgcolor: "#e5e9f0",
                  width: "100%",
                }}
              />
            </Box>
          </Box>

          <Box sx={sectionWrapperSx}>
            <SectionLabel mobile={isMobile}>事由</SectionLabel>

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
              <Typography sx={{ mt: "8px", fontSize: "13px", color: "#9ca3af" }}>
                字數限制 250 字，已輸入 {reason.length} 字
              </Typography>
            </Box>
          </Box>

          <Box sx={sectionWrapperSx}>
            <SectionLabel mobile={isMobile}>代理人</SectionLabel>

            <Box
              sx={{
                p: isMobile ? "0 14px 14px" : "16px",
                opacity: 0.5,
                pointerEvents: "none",
              }}
            >
              <FormControl
                disabled
                sx={{ width: isMobile ? "100%" : "170px", mb: "10px" }}
              >
                <Select
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  MenuProps={selectMenuProps}
                  sx={{ height: "38px", fontSize: "14px" }}
                >
                  {AGENT_OPTIONS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box
                sx={{
                  display: "flex",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: "18px",
                  mb: "10px",
                  flexWrap: "wrap",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <Typography sx={{ fontSize: "14px", color: "#374151" }}>
                  *是否代理簽核
                </Typography>

                <RadioGroup
                  row={!isMobile}
                  value={isProxyApproval}
                  onChange={(e) => setIsProxyApproval(e.target.value)}
                  sx={{ gap: "8px" }}
                >
                  <FormControlLabel
                    disabled
                    value="yes"
                    control={<Radio size="small" />}
                    label="是"
                  />
                  <FormControlLabel
                    disabled
                    value="no"
                    control={<Radio size="small" />}
                    label="否"
                  />
                </RadioGroup>
              </Box>

              {isProxyApproval === "yes" ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: "18px",
                    flexWrap: "wrap",
                    flexDirection: isMobile ? "column" : "row",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      color: "#374151",
                      minWidth: isMobile ? "auto" : "80px",
                    }}
                  >
                    *表單類型
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
                      gap: isMobile ? "10px 12px" : "20px",
                      width: isMobile ? "100%" : "auto",
                      alignItems: "center",
                    }}
                  >
                    {FORM_TYPES.map((item) => (
                      <FormControlLabel
                        key={item.key}
                        control={
                          <Checkbox
                            disabled
                            size="small"
                            checked={selectedFormTypes.includes(item.key)}
                            onChange={() => handleToggleFormType(item.key)}
                          />
                        }
                        label={item.label}
                        sx={{
                          m: 0,
                          alignItems: "center",
                          "& .MuiFormControlLabel-label": {
                            fontSize: "14px",
                            whiteSpace: "nowrap",
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ) : null}
            </Box>
          </Box>

          <Box sx={sectionWrapperSx}>
            <SectionLabel mobile={isMobile}>附件</SectionLabel>

            <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
              <Button variant="outlined" component="label" sx={{ mb: "8px" }}>
                選擇檔案
                <input hidden type="file" multiple />
              </Button>

              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                檔案格式限制為 Microsoft Office 文件、TXT文字檔、PDF、JPG、JPEG、GIF、PNG
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                檔案大小限制為 3 MB
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                最多上傳 3 個檔案
              </Typography>
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
            disabled={pageLoading || submitLoading}
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
            {submitLoading ? "送出中..." : "申請"}
          </Button>

          <Button
            variant="outlined"
            fullWidth={isMobile}
            disabled={submitLoading}
            onClick={() => {
              setStartDate(today);
              setEndDate(today);
              setStartHour("09");
              setStartMin("00");
              setEndHour("18");
              setEndMin("00");
              setReason("");
              setSubmitError("");
              setSubmitSuccess("");
            }}
          >
            取消
          </Button>
        </Box>

        <LeaveSpecialDialog
          open={specialOpen}
          onClose={() => setSpecialOpen(false)}
          specialReason={specialReason}
          setSpecialReason={setSpecialReason}
          specialLeaveType={specialLeaveType}
          setSpecialLeaveType={setSpecialLeaveType}
          specialFiles={specialFiles}
          setSpecialFiles={setSpecialFiles}
          specialLeaveTypes={SPECIAL_LEAVE_TYPES}
        />
      </Box>
    </LocalizationProvider>
  );
}