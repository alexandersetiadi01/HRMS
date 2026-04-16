import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { fetchTaiwanCalendarYear } from "../../Utils/TaiwanHolidays";
import { apiAttendanceScheduleMonth } from "../../API/attendance";
import {
  formatCellKey,
  formatRange,
  getNextMonthYear,
  getPrevMonthYear,
  getTodayYearMonth,
  isSameDate,
  pad2,
} from "../../Utils/Calendar/DateHelpers";
import { getMonthGrid } from "../../Utils/Calendar/MonthGrid";
import { getDisplayHolidayName } from "../../Utils/Calendar/DayStatus";
import YearMonthPicker from "../../Utils/Calendar/YearMonthPicker";
import MobileCalendar from "../../Utils/Calendar/MobileCalendar";
import Breadcrumb from "../../Utils/Breadcrumb";

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

const SHIFT_FILTERS = [
  { key: "all", label: "全部", color: "#000000", dotColor: "#000000" },
  { key: "support", label: "支援", color: "#cfe8ff", dotColor: "#7ab8ff" },
  { key: "leave", label: "請假", color: "#f7b3c2", dotColor: "#f49aa6" },
  { key: "rest", label: "休假", color: "#d1d5db", dotColor: "#9ca3af" },
  { key: "trip", label: "公出/出差", color: "#f6b73c", dotColor: "#f5a623" },
  { key: "normal", label: "常日班", color: "#f5a04a", dotColor: "#f59a42" },
];

const DEFAULT_DAY_DATA = {
  schedule_id: 0,
  employee_id: 0,
  shift_id: 0,
  work_date: "",
  date: "",
  status: "",
  day_type: "unscheduled",
  filter_key: "rest",
  title: "未排班",
  time: "",
  expected_start: null,
  expected_end: null,
  break_minutes: 0,
  block_bg: "#d9dde3",
  text_color: "#111827",
  people_color: "#22c55e",
  shift_name: "",
  employee_no: "",
  display_name: "",
  attendance_status: "",
  actual_in: null,
  actual_out: null,
  late_minutes: 0,
  early_leave_minutes: 0,
  worked_hours: 0,
  leave_hours: 0,
  overtime_hours: 0,
  indicator: {
    show: true,
    icon: "person",
    color: "#9ca3af",
    count: 1,
    status: "none",
  },
};

function AttendanceIndicator({ indicator, fallbackColor = "#22c55e" }) {
  const safeIndicator = indicator || {};
  const show = safeIndicator.show !== false;
  const color = safeIndicator.color || fallbackColor;

  if (!show) {
    return null;
  }

  return (
    <PersonRoundedIcon
      sx={{
        fontSize: { xs: "14px", sm: "18px" },
        color,
      }}
    />
  );
}

function SidebarCard({ title, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #b9b9b9",
        borderRadius: 0,
        overflow: "hidden",
        bgcolor: "#ffffff",
      }}
    >
      <Box
        sx={{
          px: "14px",
          py: "10px",
          borderBottom: "1px solid #b9b9b9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}
        >
          {title}
        </Typography>
        <Typography
          sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}
        >
          ▼
        </Typography>
      </Box>

      <Box sx={{ p: "14px" }}>{children}</Box>
    </Paper>
  );
}

function getScheduleDayMap(days) {
  const map = {};

  if (!Array.isArray(days)) {
    return map;
  }

  days.forEach((item) => {
    const key = item?.work_date;
    if (typeof key === "string" && key !== "") {
      map[key] = item;
    }
  });

  return map;
}

function getScheduleDayData(date, scheduleDayMap) {
  if (!date) {
    return null;
  }

  const key = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
  return scheduleDayMap[key] || null;
}

function shouldDisplayDay(selectedFilter, dayData) {
  if (selectedFilter === "all") {
    return true;
  }

  const filterKey = dayData?.filter_key || "";
  return filterKey === selectedFilter;
}

function CalendarDayCell({
  date,
  today,
  holidayMap,
  scheduleDayMap,
  selectedFilter,
}) {
  if (!date) {
    return (
      <Box
        sx={{
          minHeight: { xs: "82px", sm: "160px" },
          borderRight: "1px solid #303030",
          borderBottom: "1px solid #303030",
          bgcolor: "#f5f5f5",
        }}
      />
    );
  }

  const scheduleDay = getScheduleDayData(date, scheduleDayMap);
  const dayData = scheduleDay || DEFAULT_DAY_DATA;
  const fallbackHolidayName = getDisplayHolidayName(date, holidayMap);
  const displayTitle = dayData?.title || fallbackHolidayName || "-";
  const isToday = isSameDate(date, today);
  const isVisible = shouldDisplayDay(selectedFilter, dayData);

  return (
    <Box
      sx={{
        minHeight: { xs: "82px", sm: "160px" },
        borderRight: "1px solid #303030",
        borderBottom: "1px solid #303030",
        bgcolor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        outline: isToday ? "2px solid #0c93d4" : "none",
        outlineOffset: "-2px",
        opacity: isVisible ? 1 : 0.22,
      }}
    >
      <Box
        sx={{
          height: { xs: "22px", sm: "34px" },
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          px: { xs: "4px", sm: "8px" },
          fontSize: { xs: "11px", sm: "16px" },
          fontWeight: isToday ? 700 : 500,
          color: isToday ? "#ffffff" : "#1e3a8a",
          bgcolor: isToday ? "#0c93d4" : "#ffffff",
        }}
      >
        {pad2(date.getDate())}
      </Box>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            flex: 1,
            bgcolor: dayData.block_bg || "#d9dde3",
            color: dayData.text_color || "#111827",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: { xs: "2px", sm: "8px" },
            py: { xs: "4px", sm: "10px" },
            wordBreak: "break-word",
            overflow: "hidden",
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: "9px", sm: "15px" },
              fontWeight: 700,
              lineHeight: { xs: 1.15, sm: 1.35 },
              wordBreak: "break-word",
            }}
          >
            {displayTitle}
          </Typography>

          {dayData.time ? (
            <Typography
              sx={{
                fontSize: { xs: "9px", sm: "15px" },
                fontWeight: 700,
                mt: { xs: "2px", sm: "6px" },
                lineHeight: { xs: 1.15, sm: 1.35 },
                wordBreak: "break-word",
              }}
            >
              {dayData.time}
            </Typography>
          ) : null}
        </Box>

        <Box
          sx={{
            height: { xs: "22px", sm: "42px" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#ffffff",
          }}
        >
          <AttendanceIndicator
            indicator={dayData.indicator}
            fallbackColor={dayData.people_color || "#22c55e"}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default function AttendanceSchedule() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const today = new Date();
  const todayYearMonth = getTodayYearMonth();

  const [selectedYear, setSelectedYear] = useState(todayYearMonth.year);
  const [selectedMonth, setSelectedMonth] = useState(todayYearMonth.month);
  const [holidayMap, setHolidayMap] = useState({});
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidaySourceNote, setHolidaySourceNote] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [scheduleDays, setScheduleDays] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSummary, setScheduleSummary] = useState({
    work_minutes: 0,
    leave_minutes: 0,
    rest_minutes: 0,
    work_hours: 0,
    work_remaining_minutes: 0,
    leave_hours: 0,
    leave_remaining_minutes: 0,
    rest_hours: 0,
    rest_remaining_minutes: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadYearCalendar() {
      setHolidayLoading(true);
      setHolidaySourceNote("");

      try {
        const map = await fetchTaiwanCalendarYear(selectedYear);

        if (!cancelled) {
          setHolidayMap(map || {});

          if (!map || Object.keys(map).length === 0) {
            setHolidaySourceNote(
              "該年度尚無已發布的官方行事曆資料，先以週末休假顯示。",
            );
          }
        }
      } catch (error) {
        console.error("Failed to load Taiwan calendar:", error);

        if (!cancelled) {
          setHolidayMap({});
          setHolidaySourceNote("台灣行事曆資料載入失敗，先以週末休假顯示。");
        }
      } finally {
        if (!cancelled) {
          setHolidayLoading(false);
        }
      }
    }

    loadYearCalendar();

    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  useEffect(() => {
    let cancelled = false;

    async function loadScheduleMonth() {
      setScheduleLoading(true);
      setScheduleError("");

      try {
        const res = await apiAttendanceScheduleMonth({
          year: selectedYear,
          month: selectedMonth,
        });

        const payload = res?.data || {};
        const days = Array.isArray(payload?.days) ? payload.days : [];
        const summary = payload?.summary || {
          work_minutes: 0,
          leave_minutes: 0,
          rest_minutes: 0,
          work_hours: 0,
          work_remaining_minutes: 0,
          leave_hours: 0,
          leave_remaining_minutes: 0,
          rest_hours: 0,
          rest_remaining_minutes: 0,
        };

        if (!cancelled) {
          setScheduleDays(days);
          setScheduleSummary(summary);
        }
      } catch (error) {
        console.error("Failed to load attendance schedule month:", error);

        if (!cancelled) {
          setScheduleDays([]);
          setScheduleSummary({
            work_minutes: 0,
            leave_minutes: 0,
            rest_minutes: 0,
            work_hours: 0,
            work_remaining_minutes: 0,
            leave_hours: 0,
            leave_remaining_minutes: 0,
            rest_hours: 0,
            rest_remaining_minutes: 0,
          });
          setScheduleError("班表資料載入失敗。");
        }
      } finally {
        if (!cancelled) {
          setScheduleLoading(false);
        }
      }
    }

    loadScheduleMonth();

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedMonth]);

  const monthGrid = useMemo(
    () => getMonthGrid(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
  );

  const scheduleDayMap = useMemo(
    () => getScheduleDayMap(scheduleDays),
    [scheduleDays],
  );

  useEffect(() => {
    const currentMonthDates = monthGrid.flat().filter(Boolean);
    if (currentMonthDates.length === 0) return;

    const todayInView = currentMonthDates.find((date) =>
      isSameDate(date, today),
    );

    setSelectedDate(
      todayInView || currentMonthDates[currentMonthDates.length - 1],
    );
  }, [selectedYear, selectedMonth]);

  const selectedDayData = useMemo(() => {
    if (!selectedDate) {
      return null;
    }

    return getScheduleDayData(selectedDate, scheduleDayMap) || DEFAULT_DAY_DATA;
  }, [selectedDate, scheduleDayMap]);

  const selectedHolidayName = selectedDate
    ? getDisplayHolidayName(selectedDate, holidayMap)
    : "";

  const selectedDateDisplay = selectedDate
    ? `${selectedDate.getFullYear()}/${pad2(
        selectedDate.getMonth() + 1,
      )}/${pad2(selectedDate.getDate())}`
    : "";

  const monthTitle = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth - 1, 1);
    return date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [selectedYear, selectedMonth]);

  return (
    <Box>
      <Breadcrumb rootLabel="個人專區" currentLabel="個人班表" mb="14px" />

      <Typography
        sx={{
          fontSize: { xs: "28px", md: "32px" },
          fontWeight: 700,
          color: "#111827",
          mb: "20px",
        }}
      >
        個人班表
      </Typography>

      {isMobile ? (
        <>
          <MobileCalendar
            filters={SHIFT_FILTERS}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            monthTitle={monthTitle}
            monthGrid={monthGrid}
            holidayMap={holidayMap}
            scheduleDayMap={scheduleDayMap}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            workHours={scheduleSummary.work_hours}
            workMinutes={scheduleSummary.work_remaining_minutes}
            leaveHours={scheduleSummary.leave_hours}
            leaveMinutes={scheduleSummary.leave_remaining_minutes}
            restHours={scheduleSummary.rest_hours}
            restMinutes={scheduleSummary.rest_remaining_minutes}
            onPrevMonth={() => {
              const prev = getPrevMonthYear(selectedYear, selectedMonth);
              setSelectedYear(prev.year);
              setSelectedMonth(prev.month);
            }}
            onNextMonth={() => {
              const next = getNextMonthYear(selectedYear, selectedMonth);
              setSelectedYear(next.year);
              setSelectedMonth(next.month);
            }}
          />

          {selectedDate ? (
            <Paper
              elevation={0}
              sx={{
                borderRadius: "10px",
                bgcolor: "#ffffff",
                p: "12px 14px",
                mb: "12px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#a4a9b2",
                      lineHeight: 1.2,
                      mb: "2px",
                    }}
                  >
                    {selectedDateDisplay}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#2d3945",
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedDayData?.title || selectedHolidayName || "-"}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#2d3945",
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedDayData?.time?.replace("~", " ~ ") || ""}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    color: "#8fd0ef",
                    fontSize: "28px",
                    lineHeight: 1,
                    fontWeight: 700,
                  }}
                >
                  +
                </Box>
              </Box>
            </Paper>
          ) : null}

          {selectedDate ? (
            <Paper
              elevation={0}
              sx={{
                borderRadius: "10px",
                bgcolor: "#ffffff",
                p: "14px",
              }}
            >
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#b0b5bf",
                  mb: "8px",
                }}
              >
                部門資訊
              </Typography>

              <Box sx={{ borderTop: "1px solid #e6e8ed", pt: "12px" }}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: selectedDayData?.block_bg || "#e6a252",
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  • {selectedDayData?.title || selectedHolidayName || "未排班"}
                </Typography>

                <Typography
                  sx={{
                    fontSize: "14px",
                    color: selectedDayData?.block_bg || "#e6a252",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    mb: "6px",
                  }}
                >
                  {selectedDayData?.time?.replace("~", " ~ ") || ""}
                </Typography>

                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#2d3945",
                    lineHeight: 1.5,
                  }}
                >
                  {selectedDayData?.display_name || "－"}
                </Typography>
              </Box>
            </Paper>
          ) : null}

          {scheduleLoading ? (
            <Typography sx={{ fontSize: "14px", color: "#6b7280", mt: "12px" }}>
              載入班表資料中...
            </Typography>
          ) : scheduleError ? (
            <Typography sx={{ fontSize: "14px", color: "#b91c1c", mt: "12px" }}>
              {scheduleError}
            </Typography>
          ) : holidayLoading ? (
            <Typography sx={{ fontSize: "14px", color: "#6b7280", mt: "12px" }}>
              載入台灣行事曆中...
            </Typography>
          ) : holidaySourceNote ? (
            <Typography sx={{ fontSize: "14px", color: "#b45309", mt: "12px" }}>
              {holidaySourceNote}
            </Typography>
          ) : null}
        </>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              mb: "14px",
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{ fontSize: "16px", fontWeight: 700, color: "#374151" }}
            >
              年度/月份
            </Typography>

            <YearMonthPicker
              valueYear={selectedYear}
              valueMonth={selectedMonth}
              onConfirm={(year, month) => {
                setSelectedYear(year);
                setSelectedMonth(month);
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              mb: "8px",
            }}
          >
            <Typography
              sx={{ fontSize: "16px", color: "#374151", width: "100%" }}
            >
              簽核中：{formatRange(selectedYear, selectedMonth)}
            </Typography>

            <Button
              variant="outlined"
              onClick={() => {
                const prev = getPrevMonthYear(selectedYear, selectedMonth);
                setSelectedYear(prev.year);
                setSelectedMonth(prev.month);
              }}
              sx={{
                minWidth: "78px",
                height: "36px",
                borderRadius: 0,
                fontSize: "14px",
                color: "#111827",
                borderColor: "#b9b9b9",
              }}
            >
              上一月
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                const next = getNextMonthYear(selectedYear, selectedMonth);
                setSelectedYear(next.year);
                setSelectedMonth(next.month);
              }}
              sx={{
                minWidth: "78px",
                height: "36px",
                borderRadius: 0,
                fontSize: "14px",
                color: "#111827",
                borderColor: "#b9b9b9",
              }}
            >
              下一月
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                const current = getTodayYearMonth();
                setSelectedYear(current.year);
                setSelectedMonth(current.month);
              }}
              sx={{
                minWidth: "78px",
                height: "36px",
                borderRadius: 0,
                fontSize: "14px",
                color: "#111827",
                borderColor: "#b9b9b9",
              }}
            >
              今天
            </Button>
          </Box>

          {scheduleLoading ? (
            <Typography sx={{ fontSize: "14px", color: "#6b7280", mb: "16px" }}>
              載入班表資料中...
            </Typography>
          ) : scheduleError ? (
            <Typography sx={{ fontSize: "14px", color: "#b91c1c", mb: "16px" }}>
              {scheduleError}
            </Typography>
          ) : holidayLoading ? (
            <Typography sx={{ fontSize: "14px", color: "#6b7280", mb: "16px" }}>
              載入台灣行事曆中...
            </Typography>
          ) : holidaySourceNote ? (
            <Typography sx={{ fontSize: "14px", color: "#b45309", mb: "16px" }}>
              {holidaySourceNote}
            </Typography>
          ) : (
            <Box sx={{ mb: "24px" }} />
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 180px" },
              gap: "18px",
              alignItems: "start",
            }}
          >
            <Box sx={{ width: "100%" }}>
              <Box
                sx={{
                  border: "1px solid #303030",
                  bgcolor: "#ffffff",
                  overflow: "hidden",
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                  }}
                >
                  {WEEK_LABELS.map((label) => (
                    <Box
                      key={label}
                      sx={{
                        height: { xs: "32px", sm: "48px" },
                        bgcolor: "#333333",
                        color: "#ffffff",
                        fontSize: { xs: "12px", sm: "18px" },
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRight: "1px solid #111111",
                        px: { xs: "1px", sm: 0 },
                      }}
                    >
                      {label}
                    </Box>
                  ))}
                </Box>

                {monthGrid.map((week, rowIndex) => (
                  <Box
                    key={`${selectedYear}-${selectedMonth}-week-${rowIndex}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                    }}
                  >
                    {week.map((date, colIndex) => (
                      <CalendarDayCell
                        key={
                          date
                            ? formatCellKey(
                                date.getFullYear(),
                                date.getMonth() + 1,
                                date.getDate(),
                              )
                            : `empty-${rowIndex}-${colIndex}`
                        }
                        date={date}
                        today={today}
                        holidayMap={holidayMap}
                        scheduleDayMap={scheduleDayMap}
                        selectedFilter={selectedFilter}
                      />
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Paper
                elevation={0}
                sx={{
                  border: "1px solid #b9b9b9",
                  borderRadius: 0,
                  p: "14px",
                  bgcolor: "#ffffff",
                  minHeight: "160px",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#111827",
                    mb: "10px",
                  }}
                >
                  統計
                </Typography>

                <Typography sx={{ fontSize: "16px", color: "#374151" }}>
                  上班時數：{scheduleSummary.work_hours} 時{" "}
                  {scheduleSummary.work_remaining_minutes} 分
                </Typography>
              </Paper>

              <SidebarCard title="班次篩選">
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                    onClick={() => setSelectedFilter("all")}
                  >
                    <Checkbox
                      checked={selectedFilter === "all"}
                      size="small"
                      sx={{ p: "4px" }}
                    />
                    <Typography sx={{ fontSize: "15px" }}>全選</Typography>
                  </Box>

                  {[
                    { key: "support", label: "支援", color: "#cfe8ff" },
                    { key: "leave", label: "請假", color: "#f7b3c2" },
                    { key: "rest", label: "休假", color: "#d1d5db" },
                    { key: "trip", label: "公出/出差", color: "#f6b73c" },
                    { key: "normal", label: "常日班", color: "#f5a04a" },
                  ].map((item) => (
                    <Box
                      key={item.key}
                      sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                      onClick={() => setSelectedFilter(item.key)}
                    >
                      <Checkbox
                        checked={selectedFilter === item.key}
                        size="small"
                        sx={{ p: "4px" }}
                      />
                      <Box
                        sx={{
                          px: "8px",
                          py: "2px",
                          bgcolor: item.color,
                          fontSize: "14px",
                          color: "#111827",
                          minWidth: "74px",
                          textAlign: "center",
                        }}
                      >
                        {item.label}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </SidebarCard>

              <SidebarCard title="人員篩選">
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 34px",
                    gap: "8px",
                  }}
                >
                  <Box
                    sx={{
                      height: "34px",
                      border: "1px solid #d1d5db",
                      display: "flex",
                      alignItems: "center",
                      px: "10px",
                      color: "#9ca3af",
                      fontSize: "14px",
                    }}
                  >
                    請選擇
                  </Box>

                  <Box
                    sx={{
                      height: "34px",
                      border: "1px solid #9ca3af",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "#374151",
                    }}
                  >
                    +
                  </Box>
                </Box>
              </SidebarCard>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}