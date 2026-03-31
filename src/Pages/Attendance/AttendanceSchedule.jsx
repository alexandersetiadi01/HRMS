import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Link,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Link as RouterLink } from "react-router-dom";
import { fetchTaiwanCalendarYear } from "../../Utils/TaiwanHolidays";
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
import {
  getDayType,
  getDisplayHolidayName,
  getShiftData,
} from "../../Utils/Calendar/DayStatus";
import YearMonthPicker from "../../Utils/Calendar/YearMonthPicker";
import MobileCalendar from "../../Utils/Calendar/MobileCalendar";

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

const SHIFT_FILTERS = [
  { key: "all", label: "全部", color: "#000000", dotColor: "#000000" },
  { key: "support", label: "支援", color: "#cfe8ff", dotColor: "#7ab8ff" },
  { key: "leave", label: "請假", color: "#f7b3c2", dotColor: "#f49aa6" },
  { key: "rest", label: "休假", color: "#d1d5db", dotColor: "#9ca3af" },
  { key: "trip", label: "公出/出差", color: "#f6b73c", dotColor: "#f5a623" },
  { key: "normal", label: "常日班", color: "#f5a04a", dotColor: "#f59a42" },
];

function PeopleGroup({ color }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: "2px", sm: "4px" },
      }}
    >
      {[0, 1, 2].map((item) => (
        <Box
          key={item}
          sx={{
            width: { xs: "8px", sm: "14px" },
            height: { xs: "8px", sm: "14px" },
            borderRadius: "50%",
            bgcolor: color,
          }}
        />
      ))}
    </Box>
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

function CalendarDayCell({ date, today, holidayMap }) {
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

  const shift = getShiftData(date, holidayMap);
  const holidayName = getDisplayHolidayName(date, holidayMap);
  const isToday = isSameDate(date, today);

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
            bgcolor: shift.blockBg,
            color: shift.textColor,
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
            {holidayName || shift.title}
          </Typography>

          {shift.time ? (
            <Typography
              sx={{
                fontSize: { xs: "9px", sm: "15px" },
                fontWeight: 700,
                mt: { xs: "2px", sm: "6px" },
                lineHeight: { xs: 1.15, sm: 1.35 },
                wordBreak: "break-word",
              }}
            >
              {shift.time}
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
          <PeopleGroup color={shift.peopleColor} />
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
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [selectedDate, setSelectedDate] = useState(null);

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

  const monthGrid = useMemo(
    () => getMonthGrid(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
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

  const totalWorkMinutes = useMemo(() => {
    let count = 0;

    monthGrid.flat().forEach((date) => {
      if (!date) return;
      if (getDayType(date, holidayMap) === "normal") {
        count += 9 * 60;
      }
    });

    return count;
  }, [monthGrid, holidayMap]);

  const totalHours = Math.floor(totalWorkMinutes / 60);
  const totalMinutes = totalWorkMinutes % 60;

  const leaveHours = 0;
  const leaveMinutes = 0;
  const restHours = 216;
  const restMinutes = 0;

  const selectedShift = selectedDate
    ? getShiftData(selectedDate, holidayMap)
    : null;
  const selectedHolidayName = selectedDate
    ? getDisplayHolidayName(selectedDate, holidayMap)
    : "";

  const selectedDateDisplay = selectedDate
    ? `${selectedDate.getFullYear()}/${pad2(selectedDate.getMonth() + 1)}/${pad2(
        selectedDate.getDate(),
      )}`
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
      <Breadcrumbs
        separator={
          <NavigateNextIcon sx={{ fontSize: "18px", color: "#9ca3af" }} />
        }
        sx={{ mb: "14px" }}
      >
        <Link
          component={RouterLink}
          to="/attendance"
          underline="hover"
          sx={{
            fontSize: "14px",
            color: "#6b7280",
            textDecoration: "none",
            "&:hover": {
              color: "#0c93d4",
            },
          }}
        >
          個人專區
        </Link>

        <Typography
          sx={{
            fontSize: "14px",
            color: "#111827",
            fontWeight: 700,
          }}
        >
          個人班表
        </Typography>
      </Breadcrumbs>

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
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            workHours={totalHours}
            workMinutes={totalMinutes}
            leaveHours={leaveHours}
            leaveMinutes={leaveMinutes}
            restHours={restHours}
            restMinutes={restMinutes}
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
                    {selectedHolidayName || selectedShift?.title || "-"}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#2d3945",
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedShift?.time?.replace("~", " ~ ") || ""}
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
                    color: "#f5a04a",
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  • {selectedHolidayName || selectedShift?.title || "常日班"}
                </Typography>

                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#f5a04a",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    mb: "6px",
                  }}
                >
                  {selectedShift?.time?.replace("~", " ~ ") || "09:00 ~ 18:00"}
                </Typography>

                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#2d3945",
                    lineHeight: 1.5,
                  }}
                >
                  王穎傑、錢敏雯、張亨灝
                </Typography>
              </Box>
            </Paper>
          ) : null}

          {holidayLoading ? (
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

          {holidayLoading ? (
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
                  上班時數：{totalHours} 時 {totalMinutes} 分
                </Typography>
              </Paper>

              <SidebarCard title="班次篩選">
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Checkbox checked size="small" sx={{ p: "4px" }} />
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
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <Checkbox checked size="small" sx={{ p: "4px" }} />
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
