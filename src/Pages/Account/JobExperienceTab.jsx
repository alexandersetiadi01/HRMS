import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";

const rows = [
  ["內部年資", "0.0"],
  ["職等年資", "N/A"],
  ["職級年資", "N/A"],
  ["職務年資", "N/A"],
  ["單位年資", "0.0"],
];

export default function JobExperienceTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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