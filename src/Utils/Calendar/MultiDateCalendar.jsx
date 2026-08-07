import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { formatDateKey } from "./DateHelpers";

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

export default function MultiDateCalendar({
  value = [],
  onChange,
  maxSelected = 93,
  disableFuture = true,
}) {
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth() + 1);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const dates = useMemo(
    () => buildCalendarGrid(visibleYear, visibleMonth),
    [visibleYear, visibleMonth],
  );

  const changeMonth = (offset) => {
    const next = new Date(visibleYear, visibleMonth - 1 + offset, 1);
    setVisibleYear(next.getFullYear());
    setVisibleMonth(next.getMonth() + 1);
  };

  const toggleDate = (date) => {
    const key = formatDateKey(date);

    if (selectedSet.has(key)) {
      onChange(value.filter((item) => item !== key));
      return;
    }

    if (value.length >= maxSelected) {
      return;
    }

    onChange([...value, key].sort());
  };

  return (
    <Box sx={{ border: "1px solid #d1d5db", borderRadius: "10px", overflow: "hidden" }}>
      <Box
        sx={{
          px: "16px",
          py: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <IconButton size="small" onClick={() => changeMonth(-1)}>
          <ChevronLeftIcon />
        </IconButton>

        <Typography sx={{ fontSize: "17px", fontWeight: 700 }}>
          {visibleYear} 年 {visibleMonth} 月
        </Typography>

        <IconButton size="small" onClick={() => changeMonth(1)}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
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
            }}
          >
            {label}
          </Box>
        ))}

        {dates.map((date) => {
          const key = formatDateKey(date);
          const outsideMonth = date.getMonth() + 1 !== visibleMonth;
          const future = disableFuture && date > today;
          const selected = selectedSet.has(key);
          const isToday = key === formatDateKey(today);

          return (
            <Button
              key={key}
              disabled={future}
              onClick={() => toggleDate(date)}
              sx={{
                minWidth: 0,
                height: { xs: "54px", sm: "64px" },
                p: 0,
                borderRadius: 0,
                borderRight: "1px solid #e5e7eb",
                borderBottom: "1px solid #e5e7eb",
                color: selected ? "#ffffff" : outsideMonth ? "#b8bdc5" : "#111827",
                bgcolor: selected ? "#1976d2" : future ? "#f3f4f6" : "#ffffff",
                fontWeight: selected || isToday ? 700 : 400,
                position: "relative",
                "&:hover": {
                  bgcolor: selected ? "#1565c0" : "#f3f4f6",
                },
                "&.Mui-disabled": {
                  color: "#c4c8ce",
                  bgcolor: "#f3f4f6",
                },
              }}
            >
              {date.getDate()}

              {isToday ? (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: "5px",
                    width: "22px",
                    height: "2px",
                    bgcolor: selected ? "#ffffff" : "#ef4444",
                  }}
                />
              ) : null}
            </Button>
          );
        })}
      </Box>

      <Box sx={{ p: "14px", bgcolor: "#fafafa" }}>
        <Box sx={{ mb: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: "14px", fontWeight: 700 }}>
            已選擇 {value.length} 個日期
          </Typography>

          <Button size="small" variant="outlined" disabled={!value.length} onClick={() => onChange([])}>
            清除全部
          </Button>
        </Box>

        {value.length ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {value.map((date) => (
              <Chip
                key={date}
                size="small"
                label={date.replace(/-/g, "/")}
                onDelete={() => onChange(value.filter((item) => item !== date))}
              />
            ))}
          </Box>
        ) : (
          <Typography sx={{ fontSize: "13px", color: "#9ca3af" }}>
            尚未選擇日期。
          </Typography>
        )}
      </Box>
    </Box>
  );
}