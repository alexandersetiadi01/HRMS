import { Box, Button, Paper, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { formatCellKey, isSameDate } from "./DateHelpers";
import { getDayType } from "./DayStatus";

const MOBILE_WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function MobileFilterChip({ item, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: "0 0 auto",
        minWidth: "fit-content",
        height: "38px",
        px: "14px",
        borderRadius: "20px",
        border: active ? "1px solid #2d3945" : "1px solid #d9d9de",
        bgcolor: active ? "#2d3945" : "#ffffff",
        color: active ? "#ffffff" : "#2d3945",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
      }}
    >
      <Box
        sx={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          bgcolor: active ? "#ffffff" : item.dotColor,
          border: active && item.key === "all" ? "1px solid #ffffff" : "none",
        }}
      />

      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {item.label}
      </Typography>
    </Box>
  );
}

function getMobileDayVisual(date, holidayMap) {
  if (!date) {
    return {
      bg: "transparent",
      text: "#b8bec8",
      border: "none",
    };
  }

  const dayType = getDayType(date, holidayMap);

  if (dayType === "normal") {
    return {
      bg: "#f5a04a",
      text: "#ffffff",
      border: "2px solid transparent",
    };
  }

  return {
    bg: "#a9a9ad",
    text: "#ffffff",
    border: "2px solid transparent",
  };
}

function CounterItem({ hours, minutes, label }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        textAlign: "center",
      }}
    >
      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#1c97d4",
          lineHeight: 1.15,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: "2px",
          flexWrap: "wrap",
        }}
      >
        <Box component="span" sx={{ fontSize: "15px", fontWeight: 700 }}>
          {hours}
        </Box>
        <Box component="span">時</Box>
        <Box component="span" sx={{ fontSize: "15px", fontWeight: 700 }}>
          {minutes}
        </Box>
        <Box component="span">分</Box>
      </Typography>

      <Typography
        sx={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#b0b5bf",
          mt: "2px",
          lineHeight: 1.1,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default function MobileCalendar({
  filters,
  selectedFilter,
  onSelectFilter,
  monthTitle,
  monthGrid,
  holidayMap,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  workHours = 0,
  workMinutes = 0,
  leaveHours = 0,
  leaveMinutes = 0,
  restHours = 0,
  restMinutes = 0,
}) {
  return (
    <>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "14px",
          bgcolor: "#ffffff",
          px: "12px",
          py: "10px",
          mb: "16px",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 24px",
            alignItems: "center",
            columnGap: "4px",
          }}
        >
          <CounterItem hours={workHours} minutes={workMinutes} label="上班" />
          <CounterItem hours={leaveHours} minutes={leaveMinutes} label="請假" />
          <CounterItem hours={restHours} minutes={restMinutes} label="休假" />

          <InfoOutlinedIcon
            sx={{
              color: "#b6bcc8",
              fontSize: "22px",
              justifySelf: "end",
            }}
          />
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: "14px",
          bgcolor: "#ffffff",
          p: "14px",
          mb: "16px",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            pb: "6px",
            mb: "14px",
          }}
        >
          {filters.map((item) => (
            <MobileFilterChip
              key={item.key}
              item={item}
              active={selectedFilter === item.key}
              onClick={() => onSelectFilter(item.key)}
            />
          ))}
        </Box>

        <Box
          sx={{
            height: "54px",
            borderRadius: "16px",
            bgcolor: "#e7ebf0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            mb: "16px",
          }}
        >
          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#2d3945",
            }}
          >
            簽核中
          </Typography>

          <InfoOutlinedIcon
            sx={{
              position: "absolute",
              right: "14px",
              color: "#b6bcc8",
              fontSize: "26px",
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: "10px",
          }}
        >
          <Button
            onClick={onPrevMonth}
            sx={{
              minWidth: "unset",
              color: "#d0d3da",
              p: 0,
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: "34px" }} />
          </Button>

          <Typography
            sx={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#2d3945",
              lineHeight: 1.15,
              textAlign: "center",
            }}
          >
            {monthTitle}
          </Typography>

          <Button
            onClick={onNextMonth}
            sx={{
              minWidth: "unset",
              color: "#d0d3da",
              p: 0,
            }}
          >
            <ChevronRightIcon sx={{ fontSize: "34px" }} />
          </Button>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            mb: "6px",
          }}
        >
          {MOBILE_WEEK_LABELS.map((label) => (
            <Typography
              key={label}
              sx={{
                textAlign: "center",
                fontSize: "11px",
                color: "#b3b7c1",
                py: "6px",
              }}
            >
              {label}
            </Typography>
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            rowGap: "10px",
            columnGap: "2px",
          }}
        >
          {monthGrid.flat().map((date, index) => {
            const visual = getMobileDayVisual(date, holidayMap);
            const isSelected =
              date && selectedDate && isSameDate(date, selectedDate);

            return (
              <Box
                key={
                  date
                    ? formatCellKey(
                        date.getFullYear(),
                        date.getMonth() + 1,
                        date.getDate(),
                      )
                    : `m-empty-${index}`
                }
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  minHeight: "48px",
                }}
              >
                <Box
                  onClick={() => {
                    if (date) onSelectDate(date);
                  }}
                  sx={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    bgcolor: visual.bg,
                    color: visual.text,
                    border: isSelected ? "2px solid #2d3945" : visual.border,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: date ? "pointer" : "default",
                  }}
                >
                  {date ? date.getDate() : ""}
                </Box>

                <Box sx={{ height: "8px", mt: "4px" }}>
                  {isSelected && date ? (
                    <Box
                      sx={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        bgcolor: "#2d3945",
                      }}
                    />
                  ) : null}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </>
  );
}
