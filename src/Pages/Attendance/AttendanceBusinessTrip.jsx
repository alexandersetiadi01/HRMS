import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import {
  HOURS,
  MINUTES_60,
  selectMenuProps,
  SectionLabel,
  MobileTimeSelect,
  toMinutes,
  formatDuration,
  buildAttendanceSectionWrapperSx,
} from "../../Utils/Attendance/SharedForm";
import Breadcrumb from "../../Utils/Breadcrumb";
import {
  apiAttendanceBusinessTripRules,
  apiAttendanceOutingRules,
  apiCreateLeaveRequest,
  apiLeaveRequestFormMeta,
  apiLeaveTypes,
} from "../../API/attendance";
import { getCurrentEmployeeId } from "../../API/account";
import ProxyRequestEmployeeField from "./AttendanceForm/ProxyRequestEmployeeField";
import SuccessDialog from "../../Components/SuccessDialog";
import {
  buildDateTimeString,
  getTaiwanTodayDayjs,
  normalizeDateSet,
} from "./Leave/LeaveUtils";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import SpecialLeaveDatePicker from "./SpecialLeave/SpecialLeaveDatePicker";

const AGENT_OPTIONS = [{ value: "", label: "工號或姓名" }];

const MAX_FILE_COUNT = 3;
const MAX_FILE_SIZE = 3 * 1024 * 1024;

const ALLOWED_FILE_EXTENSIONS = [
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "pdf",
  "zip",
  "rar",
  "7z",
  "jpg",
  "jpeg",
  "gif",
  "png",
];

function getFileExtension(fileName = "") {
  const parts = String(fileName).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function normalizeApiRows(response) {
  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
}

function findTripLeaveType(types, tripType) {
  return types.find((item) => {
    const name = String(item?.leave_name || item?.leave_type_name || "").trim();
    return name === tripType;
  });
}

export default function AttendanceBusinessTrip() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const employeeId = Number(getCurrentEmployeeId() || 0);
  const [proxyEmployeeId, setProxyEmployeeId] = useState("");
  const requestEmployeeId = Number(proxyEmployeeId || employeeId);
  const todayDate = useMemo(() => getTaiwanTodayDayjs(), []);

  const [tripType, setTripType] = useState("公出");
  const [startDate, setStartDate] = useState(todayDate);
  const [endDate, setEndDate] = useState(todayDate);
  const [startHour, setStartHour] = useState("09");
  const [startMin, setStartMin] = useState("00");
  const [endHour, setEndHour] = useState("18");
  const [endMin, setEndMin] = useState("00");

  const [reason, setReason] = useState("");
  const [agent, setAgent] = useState("");
  const [attachments, setAttachments] = useState([]);

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [formMeta, setFormMeta] = useState({});
  const [outingRules, setOutingRules] = useState([]);
  const [businessTripRules, setBusinessTripRules] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const holidayDateSet = useMemo(() => {
    return normalizeDateSet(formMeta?.holiday_disabled_dates);
  }, [formMeta]);

  const approvedLeaveDateSet = useMemo(() => {
    const approvedLeaveRaw = formMeta?.approved_leave_dates_map || {};
    const approvedLeaveSource =
      approvedLeaveRaw?.[String(requestEmployeeId)] || approvedLeaveRaw || {};

    return normalizeDateSet(approvedLeaveSource);
  }, [requestEmployeeId, formMeta]);

  const totalMinutes = useMemo(() => {
    if (
      !startDate ||
      !endDate ||
      !dayjs(startDate).isValid() ||
      !dayjs(endDate).isValid() ||
      dayjs(startDate).format("YYYY-MM-DD") !==
        dayjs(endDate).format("YYYY-MM-DD")
    ) {
      return 0;
    }
    const diff = toMinutes(endHour, endMin) - toMinutes(startHour, startMin);
    return diff > 0 ? diff : 0;
  }, [startDate, endDate, startHour, startMin, endHour, endMin]);

  const selectedLeaveType = useMemo(
    () => findTripLeaveType(leaveTypes, tripType),
    [leaveTypes, tripType],
  );

  const outingEnabled = useMemo(() => {
    const rule = outingRules.find(
      (item) => String(item?.rule_code || "") === "outing_enabled",
    );

    return String(rule?.rule_value ?? "1") === "1";
  }, [outingRules]);

  const businessTripEnabled = useMemo(() => {
    const rule = businessTripRules.find(
      (item) => String(item?.rule_code || "") === "business_trip_enabled",
    );

    return String(rule?.rule_value ?? "1") === "1";
  }, [businessTripRules]);

  const businessTripFormDescription = useMemo(() => {
    const rule = businessTripRules.find(
      (item) =>
        String(item?.rule_code || "") === "business_trip_form_description",
    );

    return String(rule?.rule_value || "").trim();
  }, [businessTripRules]);

  const sectionWrapperSx = buildAttendanceSectionWrapperSx(isMobile);

  useEffect(() => {
    let mounted = true;

    async function loadLeaveTypes() {
      try {
        setLoadingTypes(true);
        const [
          response,
          formMetaResponse,
          outingRulesResponse,
          businessTripRulesResponse,
        ] = await Promise.all([
          apiLeaveTypes(),
          apiLeaveRequestFormMeta({
            employee_id: requestEmployeeId,
          }),
          apiAttendanceOutingRules(),
          apiAttendanceBusinessTripRules(),
        ]);

        const rows = normalizeApiRows(response).filter(
          (item) => String(item?.status || "啟用") === "啟用",
        );

        const metaPayload =
          formMetaResponse?.data?.data ||
          formMetaResponse?.data ||
          formMetaResponse ||
          {};

        const outingRulesPayload =
          outingRulesResponse?.data?.data ||
          outingRulesResponse?.data ||
          outingRulesResponse ||
          [];

        const businessTripRulesPayload =
          businessTripRulesResponse?.data?.data ||
          businessTripRulesResponse?.data ||
          businessTripRulesResponse ||
          [];

        if (mounted) {
          setLeaveTypes(rows);
          setFormMeta(metaPayload);
          setOutingRules(
            Array.isArray(outingRulesPayload) ? outingRulesPayload : [],
          );
          setBusinessTripRules(
            Array.isArray(businessTripRulesPayload)
              ? businessTripRulesPayload
              : [],
          );
        }
      } catch (error) {
        if (mounted) {
          setMessage({
            type: "error",
            text: "無法載入公出/出差假別資料，請稍後再試。",
          });
        }
      } finally {
        if (mounted) {
          setLoadingTypes(false);
        }
      }
    }

    loadLeaveTypes();

    return () => {
      mounted = false;
    };
  }, [requestEmployeeId]);

  useEffect(() => {
    if (loadingTypes) return;

    if (tripType === "公出" && !outingEnabled && businessTripEnabled) {
      setTripType("出差");
      return;
    }

    if (tripType === "出差" && !businessTripEnabled && outingEnabled) {
      setTripType("公出");
    }
  }, [loadingTypes, outingEnabled, businessTripEnabled, tripType]);

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    const nextFiles = [...attachments, ...selectedFiles];

    if (nextFiles.length > MAX_FILE_COUNT) {
      setMessage({
        type: "error",
        text: "最多只能上傳 3 個檔案。",
      });
      event.target.value = "";
      return;
    }

    const invalidFile = selectedFiles.find((file) => {
      const extension = getFileExtension(file.name);
      return !ALLOWED_FILE_EXTENSIONS.includes(extension);
    });

    if (invalidFile) {
      setMessage({
        type: "error",
        text: "檔案格式不符合限制，請重新選擇。",
      });
      event.target.value = "";
      return;
    }

    const oversizedFile = selectedFiles.find(
      (file) => file.size > MAX_FILE_SIZE,
    );

    if (oversizedFile) {
      setMessage({
        type: "error",
        text: "單一檔案大小不可超過 3 MB。",
      });
      event.target.value = "";
      return;
    }

    setAttachments(nextFiles);
    event.target.value = "";
  };

  const handleRemoveFile = (index) => {
    setAttachments((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleCancel = () => {
    setTripType(outingEnabled ? "公出" : businessTripEnabled ? "出差" : "公出");
    setStartDate(todayDate);
    setEndDate(todayDate);
    setStartHour("09");
    setStartMin("00");
    setEndHour("18");
    setEndMin("00");
    setReason("");
    setAgent("");
    setAttachments([]);
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async () => {
    setMessage({ type: "", text: "" });

    if (tripType === "公出" && !outingEnabled) {
      setMessage({
        type: "error",
        text: "目前未開放公出申請。",
      });
      return;
    }

    if (tripType === "出差" && !businessTripEnabled) {
      setMessage({
        type: "error",
        text: "目前未開放出差申請。",
      });
      return;
    }

    const startDateTime = buildDateTimeString(startDate, startHour, startMin);
    const endDateTime = buildDateTimeString(endDate, endHour, endMin);

    if (!selectedLeaveType?.leave_type_id) {
      setMessage({
        type: "error",
        text: `找不到「${tripType}」假別，請先確認後台假別設定。`,
      });
      return;
    }

    if (!startDateTime || !endDateTime) {
      setMessage({
        type: "error",
        text: "請完整填寫日期與時間。",
      });
      return;
    }

    if (
      new Date(startDateTime.replace(" ", "T")).getTime() >=
      new Date(endDateTime.replace(" ", "T")).getTime()
    ) {
      setMessage({
        type: "error",
        text: "結束時間必須晚於開始時間。",
      });
      return;
    }

    if (!reason.trim()) {
      setMessage({
        type: "error",
        text: "請填寫事由。",
      });
      return;
    }

    try {
      setSubmitting(true);

      await apiCreateLeaveRequest({
        employee_id: requestEmployeeId,
        leave_type_id: Number(selectedLeaveType.leave_type_id),
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        reason: reason.trim(),
        attachments,
      });

      setSuccessMessage(
        tripType === "出差" ? "出差申請已送出。" : "公出申請已送出。",
      );
      setSuccessOpen(true);

      setReason("");
      setAgent("");
      setAttachments([]);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.response?.data?.data?.message ||
          "送出失敗，請稍後再試。",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ width: "100%" }}>
          <Breadcrumb
            rootLabel="個人專區"
            rootTo="/attendance"
            currentLabel="公出|出差"
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
            公出|出差
          </Typography>

          {message.text ? (
            <Alert severity={message.type || "info"} sx={{ mb: "12px" }}>
              {message.text}
            </Alert>
          ) : null}

          <Box sx={{ mb: "16px" }}>
            <ProxyRequestEmployeeField
              formType={tripType === "出差" ? "business_trip" : "outing"}
              value={proxyEmployeeId}
              onChange={setProxyEmployeeId}
              disabled={loadingTypes || submitting}
            />
          </Box>

          <Box
            sx={{
              width: "100%",
              border: "1px solid #d1d5db",
              bgcolor: "#ffffff",
            }}
          >
            <Box sx={sectionWrapperSx}>
              <SectionLabel mobile={isMobile}>*類型</SectionLabel>

              <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
                <RadioGroup
                  row
                  value={tripType}
                  onChange={(e) => {
                    setTripType(e.target.value);
                    setProxyEmployeeId("");
                  }}
                  sx={{ columnGap: "16px" }}
                >
                  <FormControlLabel
                    value="公出"
                    disabled={!outingEnabled || loadingTypes}
                    control={<Radio size="small" />}
                    label="公出"
                    sx={{
                      mr: 0,
                      "& .MuiFormControlLabel-label": {
                        fontSize: "14px",
                        whiteSpace: "nowrap",
                      },
                    }}
                  />
                  <FormControlLabel
                    value="出差"
                    disabled={!businessTripEnabled || loadingTypes}
                    control={<Radio size="small" />}
                    label="出差"
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
              <SectionLabel mobile={isMobile}>*日期/時間</SectionLabel>

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

                          <SpecialLeaveDatePicker
                            value={startDate}
                            onChange={setStartDate}
                            approvedDateSet={approvedLeaveDateSet}
                            holidayDateSet={holidayDateSet}
                            isMobile={isMobile}
                          />

                          <MobileTimeSelect
                            hour={startHour}
                            minute={startMin}
                            onChangeHour={setStartHour}
                            onChangeMinute={setStartMin}
                            hours={HOURS}
                            minutes={MINUTES_60}
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

                          <SpecialLeaveDatePicker
                            value={endDate}
                            onChange={setEndDate}
                            approvedDateSet={approvedLeaveDateSet}
                            holidayDateSet={holidayDateSet}
                            isMobile={isMobile}
                          />

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

                      <Typography
                        sx={{
                          fontSize: "14px",
                          color: "#1f3b67",
                          width: "100%",
                          mt: "8px",
                        }}
                      >
                        總計：{formatDuration(totalMinutes)}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <SpecialLeaveDatePicker
                        value={startDate}
                        onChange={setStartDate}
                        approvedDateSet={approvedLeaveDateSet}
                        holidayDateSet={holidayDateSet}
                        isMobile={isMobile}
                      />

                      <FormControl sx={{ width: "76px" }}>
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

                      <FormControl sx={{ width: "76px" }}>
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

                      <SpecialLeaveDatePicker
                        value={endDate}
                        onChange={setEndDate}
                        approvedDateSet={approvedLeaveDateSet}
                        holidayDateSet={holidayDateSet}
                        isMobile={isMobile}
                      />

                      <FormControl sx={{ width: "76px" }}>
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

                      <FormControl sx={{ width: "76px" }}>
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
                        sx={{
                          ml: "18px",
                          fontSize: "14px",
                          color: "#1f3b67",
                        }}
                      >
                        總計：{formatDuration(totalMinutes)}
                      </Typography>
                    </>
                  )}
                </Box>

                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#111827",
                    lineHeight: 1.7,
                  }}
                >
                  (填寫時間須包含路程時間)
                </Typography>
              </Box>
            </Box>

            <Box sx={sectionWrapperSx}>
              <SectionLabel mobile={isMobile}>*事由</SectionLabel>

              <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={isMobile ? 4 : 5}
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
                    fontSize: "13px",
                    color: "#9ca3af",
                  }}
                >
                  字數限制 250 字，已輸入 {reason.length} 字
                </Typography>
              </Box>
            </Box>

            <Box sx={sectionWrapperSx}>
              <SectionLabel mobile={isMobile}>代理人</SectionLabel>

              <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
                <FormControl
                  sx={{ width: isMobile ? "100%" : "220px" }}
                  disabled
                >
                  <Select
                    displayEmpty
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
              </Box>
            </Box>

            <Box sx={sectionWrapperSx}>
              <SectionLabel mobile={isMobile}>附件</SectionLabel>

              <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
                <Button variant="outlined" component="label" sx={{ mb: "8px" }}>
                  選擇檔案
                  <input
                    hidden
                    type="file"
                    multiple
                    onChange={handleFileChange}
                  />
                </Button>

                <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                  *檔案格式限制為 Microsoft Office 文件, TXT文字檔, PDF, 壓縮檔,
                  JPG, JPEG, GIF, PNG
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                  *檔案大小限制為 3 MB
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                  *最多上傳 3 個檔案
                </Typography>

                <Box
                  sx={{
                    mt: "14px",
                    minHeight: "30px",
                    bgcolor: "#e5e9f0",
                    width: "100%",
                    px: "10px",
                    py: attachments.length ? "6px" : 0,
                    boxSizing: "border-box",
                  }}
                >
                  {attachments.map((file, index) => (
                    <Box
                      key={`${file.name}-${index}`}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        fontSize: "13px",
                        color: "#374151",
                        lineHeight: 1.8,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: "#374151",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {file.name}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => handleRemoveFile(index)}
                        sx={{ minWidth: "auto", fontSize: "13px" }}
                      >
                        移除
                      </Button>
                    </Box>
                  ))}
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
              disabled={submitting || loadingTypes}
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
              {submitting ? "送出中..." : "確定"}
            </Button>
            <Button
              variant="outlined"
              fullWidth={isMobile}
              onClick={handleCancel}
            >
              取消
            </Button>
          </Box>

          <SuccessDialog
            open={successOpen}
            title="申請成功"
            message={successMessage}
            onClose={() => setSuccessOpen(false)}
          />
        </Box>
      </LocalizationProvider>
    </>
  );
}
