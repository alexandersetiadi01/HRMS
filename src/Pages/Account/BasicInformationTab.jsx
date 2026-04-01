import { Box, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

const rows = [
  ["姓", "許"],
  ["名", "明城"],
  ["英文姓名", "Alex"],
  ["國籍", "印尼"],
  ["性別", "男"],
  ["兵役狀態", ""],
  ["役別", ""],
  ["兵役期間", "-"],
  ["證件類型", "護照"],
  ["證件號碼", "F800635254"],
  ["證件到期日", ""],
  ["證件類型2", ""],
  ["證件號碼2", ""],
  ["證件到期日2", ""],
  ["證件類型3", ""],
  ["證件號碼3", ""],
  ["證件到期日3", ""],
  ["入境時間", ""],
  ["生日", "1999/06/04"],
  ["婚姻狀態", "未婚"],
];

export default function BasicInformationTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // ✅ MOBILE (table-style like WorkExperience)
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
              key={label}
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
        minHeight: "560px",
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