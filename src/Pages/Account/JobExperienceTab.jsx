import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";

function toYearValue(startDate) {
  if (!startDate) {
    return "N/A";
  }

  const start = new Date(startDate);
  const now = new Date();

  if (Number.isNaN(start.getTime())) {
    return "N/A";
  }

  const diffMs = now.getTime() - start.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);

  return Math.max(0, diffYears).toFixed(1);
}

function buildRows(profile) {
  const employee = profile?.employee || {};
  const jobRecords = Array.isArray(profile?.jobRecords)
    ? profile.jobRecords
    : [];

  const latestJobRecord = jobRecords[0] || {};

  return [
    ["內部年資", toYearValue(employee.hire_date)],
    [
      "職等年資",
      latestJobRecord.job_grade_id
        ? toYearValue(latestJobRecord.effective_date)
        : "N/A",
    ],
    [
      "職級年資",
      latestJobRecord.job_level_id
        ? toYearValue(latestJobRecord.effective_date)
        : "N/A",
    ],
    [
      "職務年資",
      latestJobRecord.position_id
        ? toYearValue(latestJobRecord.effective_date)
        : "N/A",
    ],
    [
      "單位年資",
      latestJobRecord.unit_id
        ? toYearValue(latestJobRecord.effective_date)
        : "0.0",
    ],
  ];
}

export default function JobExperienceTab({ profile }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const rows = buildRows(profile);

  if (isMobile) {
    return (
      <Box
        sx={{
          bgcolor: "#ffffff",
        }}
      >
        <Box
          sx={{
            mx: "12px",
            overflow: "hidden",
          }}
        >
          {rows.map(([label, value], index) => (
            <Box
              key={label}
              sx={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                borderBottom:
                  index !== rows.length - 1 ? "1px solid #e5e7eb" : "none",
              }}
            >
              <Box
                sx={{
                  bgcolor: "#f3f4f6",
                  px: "10px",
                  py: "10px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  {label}
                </Typography>
              </Box>

              <Box
                sx={{
                  px: "12px",
                  py: "10px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "15px",
                    color: "#111827",
                    wordBreak: "break-word",
                  }}
                >
                  {value || "-"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: "#f5f5f5",
        p: { xs: "16px", md: "18px 24px" },
        minHeight: "220px",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "460px",
          mx: "auto",
          display: "grid",
          rowGap: "10px",
        }}
      >
        {rows.map(([label, value]) => (
          <Box
            key={label}
            sx={{
              display: "grid",
              gridTemplateColumns: "140px minmax(0, 1fr)",
              columnGap: "16px",
              alignItems: "start",
            }}
          >
            <Typography
              sx={{
                fontSize: "16px",
                color: "#1f2937",
                textAlign: "right",
              }}
            >
              {label}：
            </Typography>

            <Typography
              sx={{
                fontSize: "16px",
                color: "#1f2937",
                wordBreak: "break-word",
              }}
            >
              {value || ""}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}