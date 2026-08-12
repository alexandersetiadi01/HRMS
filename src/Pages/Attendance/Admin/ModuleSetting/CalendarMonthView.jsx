import { useMemo } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { formatDateKey } from "../../../../Utils/Calendar/DateHelpers";
import { getCalendarDateTypeOption } from "./moduleSettingOptions";

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const start = new Date(year, month - 1, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    date.setHours(0, 0, 0, 0);

    return date;
  });
}

export default function CalendarMonthView({
  year,
  month,
  dates = [],
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}) {
  const dateMap = useMemo(() => {
    return new Map(dates.map((item) => [item.date, item]));
  }, [dates]);

  const gridDates = useMemo(
    () => buildCalendarGrid(year, month),
    [year, month],
  );

  return (
    <Box
      sx={{
        overflow: "hidden",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        bgcolor: "#ffffff",
      }}
    >
      <Box
        sx={{
          minHeight: "48px",
          px: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e5e7eb",
          bgcolor: "#f9fafb",
        }}
      >
        <IconButton size="small" disabled={month <= 1} onClick={onPrevMonth}>
          <ChevronLeftIcon />
        </IconButton>

        <Typography
          sx={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {year} 年 {month} 月
        </Typography>

        <IconButton size="small" disabled={month >= 12} onClick={onNextMonth}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
        }}
      >
        {WEEK_LABELS.map((label) => (
          <Box
            key={label}
            sx={{
              py: "8px",
              textAlign: "center",
              fontSize: "13px",
              fontWeight: 700,
              color: "#6b7280",
              borderBottom: "1px solid #e5e7eb",
              bgcolor: "#fafafa",
            }}
          >
            {label}
          </Box>
        ))}

        {gridDates.map((date) => {
          const dateKey = formatDateKey(date);
          const outsideMonth = date.getMonth() + 1 !== month;
          const dayData = dateMap.get(dateKey) || null;
          const typeOption = getCalendarDateTypeOption(dayData?.effective_type);

          return (
            <Box
              key={dateKey}
              component="button"
              type="button"
              disabled={outsideMonth}
              onClick={() => {
                if (!outsideMonth && dayData && onSelectDate) {
                  onSelectDate(dayData);
                }
              }}
              sx={{
                minWidth: 0,
                minHeight: {
                  md: "92px",
                  lg: "106px",
                },
                p: "8px",
                border: 0,
                borderRight: "1px solid #e5e7eb",
                borderBottom: "1px solid #e5e7eb",
                bgcolor: outsideMonth
                  ? "#f9fafb"
                  : typeOption?.color || "#ffffff",
                color: outsideMonth
                  ? "#c4c7cc"
                  : typeOption?.textColor || "#111827",
                textAlign: "left",
                cursor: outsideMonth || !dayData ? "default" : "pointer",
                opacity: outsideMonth ? 0.65 : 1,
                "&:hover": {
                  bgcolor: outsideMonth
                    ? "#f9fafb"
                    : typeOption?.color || "#f3f4f6",
                },
                "&:disabled": {
                  color: "#c4c7cc",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "inherit",
                }}
              >
                {date.getDate()}
              </Typography>

              {!outsideMonth && dayData ? (
                <Box
                  sx={{
                    mt: "6px",
                    minWidth: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 700,
                      lineHeight: 1.35,
                      color: "inherit",
                    }}
                  >
                    {dayData.effective_type_label || "-"}
                  </Typography>

                  {dayData.event_name ? (
                    <Typography
                      sx={{
                        mt: "3px",
                        fontSize: "11px",
                        lineHeight: 1.35,
                        color: "inherit",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {dayData.event_name}
                    </Typography>
                  ) : null}
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
