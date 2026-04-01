import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";

const headers = [
  "生效日期",
  "異動行為",
  "直屬單位",
  "職等",
  "職級",
  "職稱",
  "身分類別",
  "身分子類",
  "工作地點",
];

const rows = [
  [
    "YYYY/MM/DD",
    "-",
    "-",
    "-",
    "-",
    "-",
    "-",
    "-",
    "-",
  ],
];

export default function WorkExperienceTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
  return (
    <Box
      sx={{
        bgcolor: "#ffffff",
      }}
    >
      {rows.map((row, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            mx: "12px",
            // border: "1px solid #e5e7eb",
            // borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          {headers.map((header, index) => (
            <Box
              key={`${rowIndex}-${header}`}
              sx={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                borderBottom:
                  index !== headers.length - 1
                    ? "1px solid #e5e7eb"
                    : "none",
              }}
            >
              {/* LEFT LABEL CELL */}
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
                  {header}
                </Typography>
              </Box>

              {/* RIGHT VALUE CELL */}
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
                  {row[index] || "-"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

  return (
    <Box
      sx={{
        bgcolor: "#ffffff",
        minHeight: "220px",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            "1.15fr 0.85fr 1fr 0.55fr 0.55fr 1fr 1.1fr 1fr 0.9fr",
          columnGap: "8px",
          borderBottom: "1px solid #d6d6d6",
          pb: "8px",
          width: "100%",
        }}
      >
        {headers.map((header) => (
          <Typography
            key={header}
            sx={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1f2937",
              px: "4px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {header}
          </Typography>
        ))}
      </Box>

      {rows.map((row, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: "grid",
            gridTemplateColumns:
              "1.15fr 0.85fr 1fr 0.55fr 0.55fr 1fr 1.1fr 1fr 0.9fr",
            columnGap: "8px",
            pt: "10px",
            width: "100%",
          }}
        >
          {row.map((cell, index) => (
            <Typography
              key={`${rowIndex}-${index}`}
              sx={{
                fontSize: "16px",
                color: "#1f2937",
                px: "4px",
                wordBreak: "break-word",
                lineHeight: 1.45,
              }}
            >
              {cell || "-"}
            </Typography>
          ))}
        </Box>
      ))}
    </Box>
  );
}
