import { Box, IconButton, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

const rows = [
  ["電話(市話)：", ""],
  ["電話(手機)：", "0972948684"],
  ["戶籍地址：", "新北市三重區仁義街225巷15號四樓"],
  ["聯絡地址：", "新北市三重區仁義街225巷15號四樓"],
  ["分機：", ""],
  ["公務手機：", ""],
  ["公司信箱：", "alex@mizunogi.com"],
  ["私人信箱：", ""],
  ["緊急聯絡人：", ""],
  ["緊急聯絡人關係：", ""],
  ["電話(市話)：", ""],
  ["電話(手機)：", ""],
];

export default function ContactInformationTab() {
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
              gridTemplateColumns: { xs: "110px minmax(0, 1fr)", md: "170px minmax(0, 1fr)" },
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
              {label}
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