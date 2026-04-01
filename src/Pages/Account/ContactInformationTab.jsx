import { Box, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

const rows = [
  ["電話(市話)", ""],
  ["電話(手機)", "0972948684"],
  ["戶籍地址", "新北市三重區仁義街225巷15號四樓"],
  ["聯絡地址", "新北市三重區仁義街225巷15號四樓"],
  ["分機", ""],
  ["公務手機", ""],
  ["公司信箱", "alex@mizunogi.com"],
  ["私人信箱", ""],
  ["緊急聯絡人", ""],
  ["緊急聯絡人關係", ""],
  ["電話(市話)", ""],
  ["電話(手機)", ""],
];

export default function ContactInformationTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // ✅ MOBILE (same table style)
  if (isMobile) {
    return (
      <Box sx={{ bgcolor: "#ffffff" }}>
        {/* edit button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", px: "12px", pt: "8px" }}>
          <IconButton size="small">
            <EditIcon sx={{ fontSize: "18px", color: "#111827" }} />
          </IconButton>
        </Box>

        <Box
          sx={{
            mx: "12px",
            overflow: "hidden",
          }}
        >
          {rows.map(([label, value], index) => (
            <Box
              key={`${label}-${index}`}
              sx={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                borderBottom:
                  index !== rows.length - 1 ? "1px solid #e5e7eb" : "none",
              }}
            >
              {/* LEFT LABEL */}
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

              {/* RIGHT VALUE */}
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

  // ✅ DESKTOP (keep your current layout)
  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: "#f5f5f5",
        p: { xs: "16px", md: "18px 24px" },
        minHeight: "400px",
      }}
    >
      <IconButton
        size="small"
        sx={{
          position: "absolute",
          right: "12px",
          top: "12px",
        }}
      >
        <EditIcon sx={{ fontSize: "18px", color: "#111827" }} />
      </IconButton>

      <Box
        sx={{
          width: "100%",
          maxWidth: "640px",
          mx: "auto",
          display: "grid",
          rowGap: "10px",
        }}
      >
        {rows.map(([label, value], index) => (
          <Box
            key={`${label}-${index}`}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "110px minmax(0, 1fr)",
                md: "170px minmax(0, 1fr)",
              },
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