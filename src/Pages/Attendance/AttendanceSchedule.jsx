import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  ClickAwayListener,
  Paper,
  Typography,
} from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  fetchTaiwanCalendarYear,
  formatDateKey,
  getTaiwanHolidayNameFromMap,
  isTaiwanHolidayFromMap,
  isWeekend,
  pad2,
} from "../../Utils/TaiwanHolidays";

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

const SHIFT_FILTERS = [
  { key: "support", label: "支援", color: "#cfe8ff" },
  { key: "leave", label: "請假", color: "#f7b3c2" },
  { key: "rest", label: "休假", color: "#d1d5db" },
  { key: "trip", label: "公出/出差", color: "#f6b73c" },
  { key: "normal", label: "常日班", color: "#f5a04a" },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

function formatRange(year, month) {
  const start = `${year}/${pad2(month)}/01`;
  const endDate = new Date(year, month, 0).getDate();
  const end = `${year}/${pad2(month)}/${pad2(endDate)}`;
  return `${start}-${end}`;
}

function formatKey(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMonthGrid(year, month) {
  const firstDate = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0);
  const firstWeekday = firstDate.getDay();
  const totalDays = lastDate.getDate();

  const cells = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(year, month - 1, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

function getOfficialCalendarInfo(date, holidayMap) {
  if (!date || !holidayMap) return null;
  return holidayMap[formatDateKey(date)] || null;
}

function getDayType(date, holidayMap) {
  if (!date) return "empty";

  const officialInfo = getOfficialCalendarInfo(date, holidayMap);

  if (officialInfo) {
    return officialInfo.isHoliday ? "holiday" : "normal";
  }

  if (isWeekend(date)) return "holiday";

  return "normal";
}

function getShiftData(date, holidayMap) {
  if (!date) return null;

  if (getDayType(date, holidayMap) === "holiday") {
    return {
      title: "休息日",
      time: "",
      blockBg: "#9e9ea3",
      textColor: "#ffffff",
      peopleColor: "#a9a9a9",
    };
  }

  return {
    title: "常日班",
    time: "09:00~18:00",
    blockBg: "#f2ac6d",
    textColor: "#ffffff",
    peopleColor: "#f29a4a",
  };
}

function getDisplayHolidayName(date, holidayMap) {
  if (!date) return "";

  const officialInfo = getOfficialCalendarInfo(date, holidayMap);
  if (officialInfo?.isHoliday) {
    return officialInfo.description || "國定假日";
  }

  if (isTaiwanHolidayFromMap(date, holidayMap)) {
    return getTaiwanHolidayNameFromMap(date, holidayMap);
  }

  if (isWeekend(date)) {
    return "休息日";
  }

  return "";
}

function PeopleGroup({ color }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
      {[0, 1, 2].map((item) => (
        <Box
          key={item}
          sx={{
            width: "14px",
            height: "14px",
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
        <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
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
          minHeight: "160px",
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
        minHeight: "160px",
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
          height: "34px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          px: "8px",
          fontSize: "16px",
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
            px: "8px",
            py: "10px",
          }}
        >
          <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
            {holidayName || shift.title}
          </Typography>

          {shift.time ? (
            <Typography sx={{ fontSize: "15px", fontWeight: 700, mt: "6px" }}>
              {shift.time}
            </Typography>
          ) : null}
        </Box>

        <Box
          sx={{
            height: "42px",
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

function YearMonthPicker({ valueYear, valueMonth, onConfirm }) {
  const [open, setOpen] = useState(false);
  const [draftYear, setDraftYear] = useState(valueYear);
  const [draftMonth, setDraftMonth] = useState(valueMonth);
  const [yearPageStart, setYearPageStart] = useState(Math.floor(valueYear / 10) * 10);

  useEffect(() => {
    if (!open) {
      setDraftYear(valueYear);
      setDraftMonth(valueMonth);
      setYearPageStart(Math.floor(valueYear / 10) * 10);
    }
  }, [open, valueYear, valueMonth]);

  const yearOptions = useMemo(
    () => Array.from({ length: 10 }, (_, index) => yearPageStart + index),
    [yearPageStart]
  );

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: "relative", display: "inline-block" }}>
        <Box
          onClick={() => setOpen(true)}
          sx={{
            minWidth: "120px",
            height: "32px",
            px: "10px",
            border: "1px solid #c7c7c7",
            bgcolor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <Typography sx={{ fontSize: "16px", color: "#111827" }}>
            {valueYear}/{valueMonth}
          </Typography>
          <KeyboardArrowDownIcon sx={{ fontSize: "20px", color: "#8b8b8b" }} />
        </Box>

        {open ? (
          <Paper
            elevation={0}
            sx={{
              position: "absolute",
              top: "36px",
              left: 0,
              zIndex: 20,
              width: "220px",
              border: "1px solid #303030",
              borderRadius: 0,
              bgcolor: "#ffffff",
              p: "10px 10px 12px",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                gap: "12px",
                alignItems: "start",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "6px 8px",
                }}
              >
                {MONTH_OPTIONS.map((month) => {
                  const selected = draftMonth === month;

                  return (
                    <Box
                      key={month}
                      onClick={() => setDraftMonth(month)}
                      sx={{
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        color: "#111827",
                        border: selected ? "1px solid #4fa3ff" : "1px solid transparent",
                        bgcolor: selected ? "#eaf4ff" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      {month}月
                    </Box>
                  );
                })}
              </Box>

              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: "10px",
                  }}
                >
                  <Box
                    onClick={() => setYearPageStart((prev) => prev - 10)}
                    sx={{
                      cursor: "pointer",
                      color: "#17336b",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <KeyboardArrowLeftIcon sx={{ fontSize: "42px" }} />
                  </Box>

                  <Box
                    onClick={() => setYearPageStart((prev) => prev + 10)}
                    sx={{
                      cursor: "pointer",
                      color: "#17336b",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <KeyboardArrowRightIcon sx={{ fontSize: "42px" }} />
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "8px 10px",
                  }}
                >
                  {yearOptions.map((year) => {
                    const selected = draftYear === year;

                    return (
                      <Box
                        key={year}
                        onClick={() => setDraftYear(year)}
                        sx={{
                          height: "30px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          color: "#111827",
                          border: selected ? "1px solid #4fa3ff" : "1px solid transparent",
                          bgcolor: selected ? "#eaf4ff" : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        {year}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                mt: "14px",
              }}
            >
              <Button
                variant="contained"
                onClick={() => {
                  onConfirm(draftYear, draftMonth);
                  setOpen(false);
                }}
                sx={{
                  minWidth: "52px",
                  height: "34px",
                  borderRadius: 0,
                  bgcolor: "#152a63",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#152a63",
                    boxShadow: "none",
                  },
                }}
              >
                確定
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  setDraftYear(valueYear);
                  setDraftMonth(valueMonth);
                  setYearPageStart(Math.floor(valueYear / 10) * 10);
                  setOpen(false);
                }}
                sx={{
                  minWidth: "52px",
                  height: "34px",
                  borderRadius: 0,
                  bgcolor: "#152a63",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#152a63",
                    boxShadow: "none",
                  },
                }}
              >
                取消
              </Button>
            </Box>
          </Paper>
        ) : null}
      </Box>
    </ClickAwayListener>
  );
}

export default function AttendanceSchedule() {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(3);
  const [holidayMap, setHolidayMap] = useState({});
  const [holidayLoading, setHolidayLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadYearCalendar() {
      setHolidayLoading(true);

      try {
        const map = await fetchTaiwanCalendarYear(selectedYear);
        if (!cancelled) {
          setHolidayMap(map || {});
        }
      } catch (error) {
        console.error("Failed to load Taiwan calendar:", error);
        if (!cancelled) {
          setHolidayMap({});
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
    [selectedYear, selectedMonth]
  );

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

  return (
    <Box>
      <Typography sx={{ fontSize: "30px", fontWeight: 700, color: "#111827", mb: "20px" }}>
        個人班表
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          mb: "14px",
          flexWrap: "wrap",
        }}
      >
        <Typography sx={{ fontSize: "16px", fontWeight: 700, color: "#374151" }}>
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

      <Typography sx={{ fontSize: "16px", color: "#374151", mb: "8px" }}>
        簽核中：{formatRange(selectedYear, selectedMonth)}
      </Typography>

      {holidayLoading ? (
        <Typography sx={{ fontSize: "14px", color: "#6b7280", mb: "16px" }}>
          載入台灣行事曆中...
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
        <Box
          sx={{
            border: "1px solid #303030",
            bgcolor: "#ffffff",
            overflow: "hidden",
          }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {WEEK_LABELS.map((label) => (
              <Box
                key={label}
                sx={{
                  height: "48px",
                  bgcolor: "#333333",
                  color: "#ffffff",
                  fontSize: "18px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRight: "1px solid #111111",
                }}
              >
                {label}
              </Box>
            ))}
          </Box>

          {monthGrid.map((week, rowIndex) => (
            <Box
              key={`${selectedYear}-${selectedMonth}-week-${rowIndex}`}
              sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
            >
              {week.map((date, colIndex) => (
                <CalendarDayCell
                  key={
                    date
                      ? formatKey(date.getFullYear(), date.getMonth() + 1, date.getDate())
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
            <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#111827", mb: "10px" }}>
              統計
            </Typography>

            <Typography sx={{ fontSize: "16px", color: "#374151" }}>
              上班時數：{totalHours} 時 {totalMinutes} 分
            </Typography>
          </Paper>

          <SidebarCard title="班次篩選">
            <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox checked size="small" sx={{ p: "4px" }} />
                <Typography sx={{ fontSize: "15px" }}>全選</Typography>
              </Box>

              {SHIFT_FILTERS.map((item) => (
                <Box key={item.key} sx={{ display: "flex", alignItems: "center" }}>
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
    </Box>
  );
}