import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

export default function ReportLoadingState({
  message,
  minHeight = "280px",
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        minHeight,
      }}
    >
      <CircularProgress size={25} />

      <Typography
        sx={{
          color: "#64748b",
          fontSize: "13px",
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}