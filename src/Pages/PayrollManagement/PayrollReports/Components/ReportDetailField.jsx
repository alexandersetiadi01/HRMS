import {
  Box,
  Typography,
} from "@mui/material";

export default function ReportDetailField({
  label,
  value,
  fullWidth = false,
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        gridColumn: fullWidth
          ? "1 / -1"
          : "auto",
      }}
    >
      <Typography
        sx={{
          color: "#7b8794",
          fontSize: "11px",
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: "3px",
          color: "#1f2937",
          fontSize: "14px",
          fontWeight: 600,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {value ?? "--"}
      </Typography>
    </Box>
  );
}