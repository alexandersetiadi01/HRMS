import {
  Paper,
  Typography,
} from "@mui/material";

import {
  formatReportAmount,
} from "../../../../Utils/ReportFormatters";

export default function ReportSummaryCard({
  label,
  value,
  description,
  amount = true,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: "13px",
          sm: "15px",
        },
        minWidth: 0,
        height: "100%",
        borderColor: "#e2e8f0",
        borderRadius: "5px",
        bgcolor: "#f8fafc",
        boxShadow: "none",
      }}
    >
      <Typography
        sx={{
          color: "#64748b",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: "4px",
          color: "#111827",
          fontSize: {
            xs: "21px",
            sm: "24px",
          },
          fontWeight: 700,
          lineHeight: 1.25,
          overflowWrap: "anywhere",
        }}
      >
        {amount ? "NT$ " : ""}

        {formatReportAmount(value)}
      </Typography>

      <Typography
        sx={{
          mt: "5px",
          color: "#94a3b8",
          fontSize: "11px",
          lineHeight: 1.55,
        }}
      >
        {description}
      </Typography>
    </Paper>
  );
}