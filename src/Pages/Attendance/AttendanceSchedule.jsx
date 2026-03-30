import { useEffect, useMemo, useState } from "react";
import { Box, Button, Checkbox, Paper, Typography } from "@mui/material";
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

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

const SHIFT_FILTERS = [
  { key: "support", label: "支援", color: "#cfe8ff" },
  { key: "leave", label: "請假", color: "#f7b3c2" },
  { key: "rest", label: "休假", color: "#d1d5db" },
  { key: "trip", label: "公出/出差", color: "#f6b73c" },
  { key: "normal", label: "常日班", color: "#f5a04a" },
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
  const today = new Date();
  const todayYearMonth = getTodayYearMonth();

  const [selectedYear, setSelectedYear] = useState(todayYearMonth.year);
  const [selectedMonth, setSelectedMonth] = useState(todayYearMonth.month);
  const [holidayMap, setHolidayMap] = useState({});
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidaySourceNote, setHolidaySourceNote] = useState("");

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
      <Typography
        sx={{ fontSize: "30px", fontWeight: 700, color: "#111827", mb: "20px" }}
      >
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
          alignItems: { xs: "stretch", sm: "center" },
          gap: "12px",
          flexWrap: "wrap",
          mb: "8px",
        }}
      >
        <Typography sx={{ fontSize: "16px", color: "#374151", width: "100%" }}>
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
            minWidth: { xs: "calc((100% - 24px) / 3)", sm: "78px" },
            height: "36px",
            borderRadius: 0,
            fontSize: "14px",
            color: "#111827",
            borderColor: "#b9b9b9",
            flex: { xs: "1 1 0", sm: "0 0 auto" },
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
            minWidth: { xs: "calc((100% - 24px) / 3)", sm: "78px" },
            height: "36px",
            borderRadius: 0,
            fontSize: "14px",
            color: "#111827",
            borderColor: "#b9b9b9",
            flex: { xs: "1 1 0", sm: "0 0 auto" },
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
            minWidth: { xs: "calc((100% - 24px) / 3)", sm: "78px" },
            height: "36px",
            borderRadius: 0,
            fontSize: "14px",
            color: "#111827",
            borderColor: "#b9b9b9",
            flex: { xs: "1 1 0", sm: "0 0 auto" },
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
        <Box
          sx={{
            width: "100%",
          }}
        >
          <Box
            sx={{
              border: "1px solid #303030",
              bgcolor: "#ffffff",
              overflow: "hidden",
              width: "100%",
            }}
          >
            <Box
              sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
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
                sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox checked size="small" sx={{ p: "4px" }} />
                <Typography sx={{ fontSize: "15px" }}>全選</Typography>
              </Box>

              {SHIFT_FILTERS.map((item) => (
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
    </Box>
  );
}
