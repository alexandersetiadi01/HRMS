import {
  Box,
  Chip,
  Paper,
  Typography,
} from "@mui/material";

import {
  APOLLO_REPORTS,
} from "../../../../Utils/reportConstants";

export default function ReportCatalog({
  selectedReportId,
  onSelect,
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(4, minmax(0, 1fr))",
        },
        gap: "10px",
        width: "100%",
        minWidth: 0,
      }}
    >
      {APOLLO_REPORTS.map((report) => {
        const selected =
          report.id === selectedReportId;

        return (
          <Paper
            key={report.id}
            component="button"
            type="button"
            variant="outlined"
            disabled={!report.implemented}
            onClick={() =>
              onSelect(report.id)
            }
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              minWidth: 0,
              height: "100%",
              p: "14px",
              borderColor: selected
                ? "#1f9bd1"
                : "#e2e8f0",
              borderRadius: "5px",
              bgcolor: selected
                ? "#f0f9ff"
                : "#ffffff",
              boxShadow: "none",
              color: "inherit",
              font: "inherit",
              textAlign: "left",
              cursor: report.implemented
                ? "pointer"
                : "default",
              opacity: report.implemented
                ? 1
                : 0.68,
              "&:hover": report.implemented
                ? {
                    borderColor: "#1f9bd1",
                    bgcolor: "#f8fcff",
                  }
                : {},
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <Typography
                sx={{
                  color: selected
                    ? "#168dc5"
                    : "#1f2937",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                {report.label}
              </Typography>

              {!report.implemented ? (
                <Chip
                  label="尚未開放"
                  size="small"
                  variant="outlined"
                />
              ) : null}
            </Box>

            <Typography
              sx={{
                mt: "5px",
                color: "#64748b",
                fontSize: "12px",
                lineHeight: 1.6,
              }}
            >
              {report.description}
            </Typography>
          </Paper>
        );
      })}
    </Box>
  );
}