import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Button,
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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useNavigate } from "react-router-dom";
import { getTodayDate, LabelCell } from "../../../Components/GlobalComponent";
import {
  HOURS,
  MINUTES_30,
  selectMenuProps,
} from "../../../Utils/Attendance/SharedForm";
import {
  apiAttendanceScheduleMonth,
  apiCreateLeaveEntitlementRequest,
  apiLeaveRequestFormMeta,
  apiSpecialLeaveOptions,
} from "../../../API/attendance";
import { getCurrentEmployeeId } from "../../../API/account";
import SpecialLeaveDatePicker from "./SpecialLeaveDatePicker";
import { SuccessDialog } from "./SpecialLeaveDialogs";
import {
  YEAR_OPTIONS,
  calculateEntitlementHours,
  currentYear,
  formatHoursText,
  getBackendErrorMessage,
  getFuneralExpiryDate,
  getLeaveNameType,
  getMarriageExpiryRange,
  getMaternityCheckupExpiryRange,
  getPublicLeaveTotal,
  isWeekendDate,
  normalizeDateSet,
  normalizeScheduleMap,
  normalizeSpecialLeaveOptions,
  unwrapPayload,
} from "./SpecialLeaveUtils";

export default function AttendanceSpecialLeave() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const employeeId = Number(getCurrentEmployeeId() || 0);

  const [open, setOpen] = useState(true);
  const [reason, setReason] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [marriageDate, setMarriageDate] = useState(getTodayDate());
  const [funeralRelation, setFuneralRelation] = useState("");
  const [funeralDate, setFuneralDate] = useState(getTodayDate());
  const [familyCareYear, setFamilyCareYear] = useState(String(currentYear));
  const [spouseDeliveryDate, setSpouseDeliveryDate] = useState(getTodayDate());
  const [publicStartDate, setPublicStartDate] = useState(getTodayDate());
  const [publicStartHour, setPublicStartHour] = useState("00");
  const [publicStartMinute, setPublicStartMinute] = useState("00");
  const [publicEndDate, setPublicEndDate] = useState(getTodayDate());
  const [publicEndHour, setPublicEndHour] = useState("00");
  const [publicEndMinute, setPublicEndMinute] = useState("00");
  const [files, setFiles] = useState([]);

  const [leaveOptions, setLeaveOptions] = useState([]);
  const [formMeta, setFormMeta] = useState({});
  const [scheduleMap, setScheduleMap] = useState({});

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  const [approvedAlertOpen, setApprovedAlertOpen] = useState(false);

  const selectedLeave = useMemo(
    () => leaveOptions.find((item) => item.value === leaveType),
    [leaveOptions, leaveType],
  );

  const leaveNameType = getLeaveNameType(selectedLeave?.label);

  const relationOptions = selectedLeave?.conditions || [];

  const selectedRelationCondition = relationOptions.find(
    (item) => item.relationType === funeralRelation,
  );

  const availableHours = calculateEntitlementHours(
    selectedLeave?.requireRelationType
      ? selectedRelationCondition
      : selectedLeave,
  );

  const availableText = formatHoursText(availableHours) || "-";

  const fileNames = files.map((file) => file.name);

  const approvedLeaveDateSet = useMemo(() => {
    const approvedLeaveRaw = formMeta?.approved_leave_dates_map || {};
    const approvedLeaveSource =
      approvedLeaveRaw?.[String(employeeId)] || approvedLeaveRaw || {};

    return normalizeDateSet(approvedLeaveSource);
  }, [employeeId, formMeta]);

  const holidayDateSet = useMemo(() => {
    return normalizeDateSet(formMeta?.holiday_disabled_dates);
  }, [formMeta]);

  const isApprovedLeaveDate = useCallback(
    (dateString) => {
      return approvedLeaveDateSet.has(String(dateString || "").slice(0, 10));
    },
    [approvedLeaveDateSet],
  );

  const isHolidayDate = useCallback(
    (dateString) => {
      return holidayDateSet.has(String(dateString || "").slice(0, 10));
    },
    [holidayDateSet],
  );

  const hasAssignedSchedule = useCallback(
    (dateString) => {
      return Boolean(scheduleMap[String(dateString || "").slice(0, 10)]);
    },
    [scheduleMap],
  );

  const isNonWorkingDate = useCallback(
    (dateString) => {
      const dateKey = String(dateString || "").slice(0, 10);

      if (!dateKey) {
        return false;
      }

      return (
        isWeekendDate(dateKey) ||
        isHolidayDate(dateKey) ||
        !hasAssignedSchedule(dateKey)
      );
    },
    [hasAssignedSchedule, isHolidayDate],
  );

  const loadScheduleMonth = useCallback(
    async (dateValue) => {
      const target = dayjs(dateValue);

      if (!target.isValid()) {
        return;
      }

      try {
        const response = await apiAttendanceScheduleMonth({
          employee_id: employeeId || undefined,
          year: target.year(),
          month: target.month() + 1,
        });

        const nextMap = normalizeScheduleMap(response);

        setScheduleMap((prev) => ({
          ...prev,
          ...nextMap,
        }));
      } catch (error) {
        console.error("Failed to load special leave schedule month:", error);
      }
    },
    [employeeId],
  );

  useEffect(() => {
    let active = true;

    async function loadSpecialLeaveOptions() {
      setLoadingOptions(true);
      setErrorMessage("");

      try {
        const [specialOptionsResponse, formMetaResponse] = await Promise.all([
          apiSpecialLeaveOptions(),
          apiLeaveRequestFormMeta({
            employee_id: employeeId || undefined,
          }),
        ]);

        if (!active) {
          return;
        }

        const options = normalizeSpecialLeaveOptions(specialOptionsResponse);
        const metaPayload = unwrapPayload(formMetaResponse, {});

        setLeaveOptions(options);
        setFormMeta(metaPayload);

        if (!leaveType && options.length > 0) {
          setLeaveType(options[0].value);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            "無法載入特殊假別資料。",
        );
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    loadSpecialLeaveOptions();

    return () => {
      active = false;
    };
  }, [employeeId, leaveType]);

  useEffect(() => {
    loadScheduleMonth(dayjs());
  }, [loadScheduleMonth]);

  useEffect(() => {
    if (!selectedLeave?.requireRelationType) {
      setFuneralRelation("");
      return;
    }

    const firstRelation = selectedLeave.conditions?.[0]?.relationType || "";

    setFuneralRelation((current) => {
      if (
        selectedLeave.conditions.some((item) => item.relationType === current)
      ) {
        return current;
      }

      return firstRelation;
    });
  }, [selectedLeave]);

  function getEventDateValue() {
    if (leaveNameType === "marriage") {
      return marriageDate;
    }

    if (leaveNameType === "funeral") {
      return funeralDate;
    }

    if (leaveNameType === "maternity-checkup") {
      return spouseDeliveryDate;
    }

    if (
      leaveNameType === "public" ||
      leaveNameType === "injury-leave" ||
      leaveNameType === "unpaid-sick"
    ) {
      return publicStartDate;
    }

    return "";
  }

  function getRequestYearValue() {
    if (leaveNameType === "family-care") {
      return familyCareYear;
    }

    const eventDate = getEventDateValue();

    if (eventDate) {
      return String(new Date(eventDate).getFullYear());
    }

    return String(currentYear);
  }

  function validateBeforeSubmit() {
    if (!reason.trim()) {
      return "請填寫事由。";
    }

    if (!leaveType) {
      return "請選擇假別。";
    }

    if (
      [
        "marriage",
        "funeral",
        "maternity-checkup",
        "public",
        "injury-leave",
        "unpaid-sick",
      ].includes(leaveNameType) &&
      !getEventDateValue()
    ) {
      return "請選擇日期。";
    }

    if (leaveNameType === "funeral" && !funeralRelation) {
      return "請選擇親屬稱謂。";
    }

    if (leaveNameType === "family-care" && !familyCareYear) {
      return "請選擇年度。";
    }

    if (files.length > 3) {
      return "最多只能上傳 3 個檔案。";
    }

    const oversizedFile = files.find((file) => file.size > 3 * 1024 * 1024);

    if (oversizedFile) {
      return "單一檔案大小不可超過 3 MB。";
    }

    return "";
  }

  const handleClose = () => {
    setOpen(false);
    navigate("/attendance");
  };

  const handleSpecialDateChange = (field, setter) => (newValue) => {
    if (!newValue || !dayjs(newValue).isValid()) {
      return;
    }

    const selectedDate = dayjs(newValue).format("YYYY-MM-DD");

    // ❌ 已核准請假 → 阻擋
    if (isApprovedLeaveDate(selectedDate)) {
      setApprovedAlertOpen(true);
      return;
    }

    setErrorMessage("");

    // ⚠️ 非工作日 → 確認
    if (isNonWorkingDate(selectedDate)) {
      return;
    }

    // 正常工作日
    setter(selectedDate);
  };

  const handleConfirm = async () => {
    const validationMessage = validateBeforeSubmit();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await apiCreateLeaveEntitlementRequest({
        leave_type_id: leaveType,
        reason: reason.trim(),
        event_date: getEventDateValue(),
        request_year: getRequestYearValue(),
        relation_type: leaveNameType === "funeral" ? funeralRelation : "",
        attachments: files,
      });

      setSuccessOpen(true);
    } catch (error) {
      setErrorMessage(getBackendErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Dialog
          open={open}
          onClose={handleClose}
          fullWidth
          fullScreen={isMobile}
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 2 },
              overflow: "hidden",
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "100%", sm: undefined },
              height: { xs: "100%", sm: "auto" },
              m: { xs: 0, sm: 2 },
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
              特殊假別申請
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
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "110px 1fr" },
                rowGap: "18px",
                columnGap: "28px",
                alignItems: "start",
                maxWidth: "900px",
              }}
            >
              {errorMessage ? (
                <>
                  <Box />
                  <Typography
                    sx={{
                      maxWidth: "550px",
                      color: "#b91c1c",
                      bgcolor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "4px",
                      px: "12px",
                      py: "10px",
                      fontSize: "14px",
                    }}
                  >
                    {errorMessage}
                  </Typography>
                </>
              ) : null}
              <LabelCell required>事由</LabelCell>
              <Box>
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
                    maxWidth: "550px",
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
              <LabelCell required>假別</LabelCell>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Box sx={{ width: "100%", maxWidth: "270px" }}>
                  <FormControl fullWidth>
                    <Select
                      displayEmpty
                      value={leaveType}
                      disabled={loadingOptions}
                      onChange={(e) => {
                        setLeaveType(e.target.value);
                        setErrorMessage("");
                      }}
                      MenuProps={selectMenuProps}
                      sx={{
                        height: "38px",
                        fontSize: "15px",
                      }}
                    >
                      <MenuItem value="" disabled>
                        {loadingOptions ? "載入中..." : "請選擇"}
                      </MenuItem>
                      {leaveOptions.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {leaveType &&
                leaveNameType !== "funeral" &&
                leaveNameType !== "public" &&
                leaveNameType !== "injury-leave" &&
                leaveNameType !== "unpaid-sick" ? (
                  <Typography
                    sx={{
                      fontSize: "14px",
                      color: "#4b5563",
                      whiteSpace: "nowrap",
                    }}
                  >
                    可用：{availableText}
                  </Typography>
                ) : null}
              </Box>
              {leaveNameType === "marriage" && (
                <>
                  <LabelCell required>結婚登記日</LabelCell>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Box sx={{ width: "100%", maxWidth: "270px" }}>
                      <SpecialLeaveDatePicker
                        value={marriageDate}
                        onChange={handleSpecialDateChange(
                          "marriageDate",
                          setMarriageDate,
                        )}
                        onMonthChange={loadScheduleMonth}
                        approvedDateSet={approvedLeaveDateSet}
                        holidayDateSet={holidayDateSet}
                        scheduleMap={scheduleMap}
                        isMobile={isMobile}
                      />
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "#4b5563",
                        whiteSpace: "nowrap",
                      }}
                    >
                      有效期限：
                      {getMarriageExpiryRange(marriageDate)}
                    </Typography>
                  </Box>
                </>
              )}
              {leaveNameType === "funeral" && (
                <>
                  <LabelCell required>親屬稱謂</LabelCell>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Box sx={{ width: "100%", maxWidth: "270px" }}>
                      <FormControl fullWidth>
                        <Select
                          value={funeralRelation}
                          onChange={(e) => setFuneralRelation(e.target.value)}
                          MenuProps={selectMenuProps}
                          sx={{
                            height: "38px",
                            fontSize: "15px",
                          }}
                        >
                          {relationOptions.map((item) => (
                            <MenuItem
                              key={item.conditionId || item.relationType}
                              value={item.relationType}
                            >
                              {item.relationType}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "#4b5563",
                        whiteSpace: "nowrap",
                      }}
                    >
                      可用：{availableText}
                    </Typography>
                  </Box>

                  <LabelCell required>親屬死亡日</LabelCell>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Box sx={{ width: "100%", maxWidth: "270px" }}>
                      <SpecialLeaveDatePicker
                        value={funeralDate}
                        onChange={handleSpecialDateChange(
                          "funeralDate",
                          setFuneralDate,
                        )}
                        onMonthChange={loadScheduleMonth}
                        approvedDateSet={approvedLeaveDateSet}
                        holidayDateSet={holidayDateSet}
                        scheduleMap={scheduleMap}
                        isMobile={isMobile}
                      />
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "#4b5563",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ~ {getFuneralExpiryDate(funeralDate)}
                    </Typography>
                  </Box>
                </>
              )}
              {leaveNameType === "family-care" && (
                <>
                  <LabelCell required>年度</LabelCell>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Box sx={{ width: "100%", maxWidth: "270px" }}>
                      <FormControl fullWidth>
                        <Select
                          value={familyCareYear}
                          onChange={(e) => setFamilyCareYear(e.target.value)}
                          MenuProps={selectMenuProps}
                          sx={{
                            height: "38px",
                            fontSize: "15px",
                          }}
                        >
                          {YEAR_OPTIONS.map((year) => (
                            <MenuItem key={year} value={String(year)}>
                              {year}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "#4b5563",
                        whiteSpace: "nowrap",
                      }}
                    >
                      可用：{availableText}
                    </Typography>
                  </Box>
                </>
              )}
              {leaveNameType === "maternity-checkup" && (
                <>
                  <LabelCell required>配偶分娩日</LabelCell>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Box sx={{ width: "100%", maxWidth: "270px" }}>
                      <SpecialLeaveDatePicker
                        value={spouseDeliveryDate}
                        onChange={handleSpecialDateChange(
                          "spouseDeliveryDate",
                          setSpouseDeliveryDate,
                        )}
                        onMonthChange={loadScheduleMonth}
                        approvedDateSet={approvedLeaveDateSet}
                        holidayDateSet={holidayDateSet}
                        scheduleMap={scheduleMap}
                        isMobile={isMobile}
                      />
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "#4b5563",
                        whiteSpace: "nowrap",
                      }}
                    >
                      有效期限：
                      {getMaternityCheckupExpiryRange(spouseDeliveryDate)}
                    </Typography>
                  </Box>
                </>
              )}{" "}
              {(leaveNameType === "public" ||
                leaveNameType === "injury-leave" ||
                leaveNameType === "unpaid-sick") && (
                <>
                  <LabelCell required>日期/時間</LabelCell>
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        maxWidth: "420px",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: { xs: "stretch", sm: "center" },
                            gap: { xs: "8px", sm: "8px" },
                          }}
                        >
                          <Box sx={{ width: { xs: "100%", sm: "150px" } }}>
                            <SpecialLeaveDatePicker
                              value={publicStartDate}
                              onChange={handleSpecialDateChange(
                                "publicStartDate",
                                setPublicStartDate,
                              )}
                              onMonthChange={loadScheduleMonth}
                              approvedDateSet={approvedLeaveDateSet}
                              holidayDateSet={holidayDateSet}
                              scheduleMap={scheduleMap}
                              isMobile={isMobile}
                              width="150px"
                            />
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              width: { xs: "100%", sm: "auto" },
                              gap: { xs: "0", sm: "8px" },
                            }}
                          >
                            <Typography
                              sx={{
                                display: { xs: "none", sm: "block" },
                                fontSize: "18px",
                                color: "#4b5563",
                                lineHeight: 1,
                              }}
                            >
                              ：
                            </Typography>

                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "1fr auto 1fr",
                                  sm: "70px auto 70px",
                                },
                                alignItems: "center",
                                columnGap: "8px",
                                width: { xs: "100%", sm: "auto" },
                              }}
                            >
                              <FormControl fullWidth>
                                <Select
                                  value={publicStartHour}
                                  onChange={(e) =>
                                    setPublicStartHour(e.target.value)
                                  }
                                  MenuProps={selectMenuProps}
                                  sx={{ height: "38px", fontSize: "15px" }}
                                >
                                  {HOURS.map((hour) => (
                                    <MenuItem key={hour} value={hour}>
                                      {hour}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                              <Typography
                                sx={{
                                  fontSize: "18px",
                                  color: "#4b5563",
                                  lineHeight: 1,
                                  textAlign: "center",
                                }}
                              >
                                ：
                              </Typography>

                              <FormControl fullWidth>
                                <Select
                                  value={publicStartMinute}
                                  onChange={(e) =>
                                    setPublicStartMinute(e.target.value)
                                  }
                                  MenuProps={selectMenuProps}
                                  sx={{ height: "38px", fontSize: "15px" }}
                                >
                                  {MINUTES_30.map((minute) => (
                                    <MenuItem key={minute} value={minute}>
                                      {minute}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          </Box>

                          <Typography
                            sx={{
                              display: { xs: "none", sm: "block" },
                              fontSize: "18px",
                              color: "#4b5563",
                              lineHeight: 1,
                            }}
                          >
                            ~
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: { xs: "center", sm: "flex-start" },
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "18px",
                              color: "#4b5563",
                              lineHeight: 1,
                              display: { xs: "block", sm: "none" },
                              px: "4px",
                            }}
                          >
                            ~
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: { xs: "stretch", sm: "center" },
                            gap: { xs: "8px", sm: "8px" },
                          }}
                        >
                          <Box sx={{ width: { xs: "100%", sm: "150px" } }}>
                            <SpecialLeaveDatePicker
                              value={publicEndDate}
                              onChange={handleSpecialDateChange(
                                "publicEndDate",
                                setPublicEndDate,
                              )}
                              onMonthChange={loadScheduleMonth}
                              approvedDateSet={approvedLeaveDateSet}
                              holidayDateSet={holidayDateSet}
                              scheduleMap={scheduleMap}
                              isMobile={isMobile}
                              width="150px"
                            />
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              width: { xs: "100%", sm: "auto" },
                              gap: { xs: "0", sm: "8px" },
                            }}
                          >
                            <Typography
                              sx={{
                                display: { xs: "none", sm: "block" },
                                fontSize: "18px",
                                color: "#4b5563",
                                lineHeight: 1,
                              }}
                            >
                              ：
                            </Typography>

                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "1fr auto 1fr",
                                  sm: "70px auto 70px",
                                },
                                alignItems: "center",
                                columnGap: "8px",
                                width: { xs: "100%", sm: "auto" },
                              }}
                            >
                              <FormControl fullWidth>
                                <Select
                                  value={publicEndHour}
                                  onChange={(e) =>
                                    setPublicEndHour(e.target.value)
                                  }
                                  MenuProps={selectMenuProps}
                                  sx={{ height: "38px", fontSize: "15px" }}
                                >
                                  {HOURS.map((hour) => (
                                    <MenuItem key={hour} value={hour}>
                                      {hour}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                              <Typography
                                sx={{
                                  fontSize: "18px",
                                  color: "#4b5563",
                                  lineHeight: 1,
                                  textAlign: "center",
                                }}
                              >
                                ：
                              </Typography>

                              <FormControl fullWidth>
                                <Select
                                  value={publicEndMinute}
                                  onChange={(e) =>
                                    setPublicEndMinute(e.target.value)
                                  }
                                  MenuProps={selectMenuProps}
                                  sx={{ height: "38px", fontSize: "15px" }}
                                >
                                  {MINUTES_30.map((minute) => (
                                    <MenuItem key={minute} value={minute}>
                                      {minute}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          </Box>
                        </Box>

                        <Typography
                          sx={{
                            mt: "4px",
                            fontSize: "14px",
                            color: "#4b5563",
                            whiteSpace: "nowrap",
                          }}
                        >
                          總計：
                          {getPublicLeaveTotal(
                            publicStartDate,
                            publicStartHour,
                            publicStartMinute,
                            publicEndDate,
                            publicEndHour,
                            publicEndMinute,
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </>
              )}
              <LabelCell>附件</LabelCell>
              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  sx={{
                    height: "38px",
                    textTransform: "none",
                    color: "#111827",
                    borderColor: "#cfcfcf",
                    mr: "10px",
                  }}
                >
                  選擇檔案
                  <input
                    hidden
                    type="file"
                    multiple
                    onChange={(e) => {
                      const selectedFiles = Array.from(
                        e.target.files || [],
                      ).slice(0, 3);
                      setFiles(selectedFiles);
                    }}
                  />
                </Button>

                {fileNames.length > 0 ? (
                  <Box sx={{ mt: "8px" }}>
                    {fileNames.map((name) => (
                      <Typography
                        key={name}
                        sx={{
                          fontSize: "14px",
                          color: "#6b7280",
                          lineHeight: 1.5,
                        }}
                      >
                        {name}
                      </Typography>
                    ))}
                  </Box>
                ) : null}

                <Box sx={{ mt: "8px" }}>
                  <Typography sx={{ fontSize: "14px", color: "#9ca3af" }}>
                    *檔案格式限制為 Microsoft Office 文件, TXT文字檔, PDF,
                    壓縮檔, JPG, JPEG, GIF, PNG
                  </Typography>
                  <Typography sx={{ fontSize: "14px", color: "#9ca3af" }}>
                    *檔案大小限制為 3 MB
                  </Typography>
                  <Typography sx={{ fontSize: "14px", color: "#9ca3af" }}>
                    *最多上傳 3 個檔案
                  </Typography>
                </Box>
              </Box>
              {selectedLeave?.rules?.length > 0 && (
                <>
                  <Box />
                  <Box
                    sx={{
                      maxWidth: "700px",
                      bgcolor: "#f5f5f5",
                      px: "18px",
                      py: "16px",
                      mt: "6px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {selectedLeave.rules.map((text, index) => (
                      <Typography
                        key={index}
                        sx={{
                          fontSize: "15px",
                          color: "#111827",
                          lineHeight: 1.9,
                          mt: index === 0 ? 0 : "4px",
                        }}
                      >
                        {text}
                      </Typography>
                    ))}
                  </Box>
                </>
              )}
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
              disabled={submitting || loadingOptions}
              sx={{
                minWidth: "64px",
                height: "36px",
                bgcolor: "#101b4d",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#0c1438",
                  boxShadow: "none",
                },
              }}
            >
              {submitting ? "送出中" : "確定"}
            </Button>

            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={submitting}
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

        <SuccessDialog
          open={successOpen}
          onClose={() => {
            setSuccessOpen(false);
            navigate("/attendance");
          }}
        />
      </LocalizationProvider>
      <Dialog
        open={approvedAlertOpen}
        onClose={() => setApprovedAlertOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "18px",
          }}
        >
          無法選擇日期
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              fontSize: "15px",
              color: "#374151",
            }}
          >
            該日期已有核准假單，無法選擇。
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: "16px",
            pb: "12px",
          }}
        >
          <Button
            variant="contained"
            onClick={() => setApprovedAlertOpen(false)}
            sx={{
              bgcolor: "#101b4d",
              "&:hover": {
                bgcolor: "#0c1438",
              },
            }}
          >
            確認
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
