import { Box, FormControl, MenuItem, Select, Typography } from "@mui/material";

export const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);

export const MINUTES_60 = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
);

export const MINUTES_30 = ["00", "30"];

export const selectMenuProps = {
  PaperProps: {
    sx: {
      maxHeight: 220,
      overflowY: "auto",
    },
  },
  MenuListProps: {
    sx: {
      py: 0,
    },
  },
};

export function buildAttendanceSectionWrapperSx(isMobile) {
  return {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "165px minmax(0, 1fr)",
    borderBottom: "1px solid #d1d5db",
  };
}

export function SectionLabel({ children, mobile }) {
  if (mobile) {
    return (
      <Box
        sx={{
          px: "14px",
          pt: "14px",
          pb: "8px",
        }}
      >
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#2d3945",
          }}
        >
          {children}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#2f2f2f",
        color: "#fff",
        px: "16px",
        py: "14px",
        fontSize: "14px",
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        fontWeight: 700,
      }}
    >
      {children}
    </Box>
  );
}

export function MobileTimeSelect({
  hour,
  minute,
  onChangeHour,
  onChangeMinute,
  hours = HOURS,
  minutes = MINUTES_60,
  colonWidth = "10px",
  columnGap = "6px",
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `minmax(0, 1fr) ${colonWidth} minmax(0, 1fr)`,
        alignItems: "center",
        columnGap,
        width: "100%",
        minWidth: 0,
      }}
    >
      <FormControl sx={{ width: "100%", minWidth: 0 }}>
        <Select
          value={hour}
          onChange={(e) => onChangeHour(e.target.value)}
          MenuProps={selectMenuProps}
          sx={{ height: "38px", fontSize: "15px" }}
        >
          {hours.map((h) => (
            <MenuItem key={h} value={h}>
              {h}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography
        sx={{
          fontSize: "18px",
          color: "#374151",
          textAlign: "center",
          lineHeight: 1,
        }}
      >
        :
      </Typography>

      <FormControl sx={{ width: "100%", minWidth: 0 }}>
        <Select
          value={minute}
          onChange={(e) => onChangeMinute(e.target.value)}
          MenuProps={selectMenuProps}
          sx={{ height: "38px", fontSize: "15px" }}
        >
          {minutes.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export function toMinutes(hour, minute) {
  return Number(hour) * 60 + Number(minute);
}

export function formatDuration(totalMinutes) {
  const safe = Math.max(0, totalMinutes);
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h} 時 ${m} 分`;
}