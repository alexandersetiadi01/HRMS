import { Box, InputAdornment, TextField } from "@mui/material";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";

export function LabelCell({ required, children }) {
  return (
    <Box
      sx={{
        pt: "8px",
        fontSize: "15px",
        color: "#374151",
        whiteSpace: "nowrap",
      }}
    >
      {required ? (
        <Box component="span" sx={{ color: "#ef4444", mr: "2px" }}>
          *
        </Box>
      ) : null}
      {children}
    </Box>
  );
}

export function renderDateField(value, onChange) {
  return (
    <TextField
      fullWidth
      type="date"
      value={value}
      onChange={onChange}
      InputLabelProps={{ shrink: true }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <CalendarTodayOutlinedIcon
              sx={{
                fontSize: "18px",
                color: "#111827",
                pointerEvents: "none",
              }}
            />
          </InputAdornment>
        ),
      }}
      sx={{
        "& .MuiInputBase-root": {
          height: "38px",
          fontSize: "15px",
          pr: "8px",
        },
        "& .MuiOutlinedInput-input": {
          py: "8px",
        },

        "& input::-webkit-calendar-picker-indicator": {
          opacity: 0,
          position: "absolute",
          right: 0,
          width: "100%",
          height: "100%",
          cursor: "pointer",
        },

        "& input::-webkit-datetime-edit": {
          display: "inline-flex",
        },
      }}
    />
  );
}

 export function getTodayDate() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
