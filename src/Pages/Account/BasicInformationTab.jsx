import { Box, IconButton, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

const rows = [
  ["姓：", "許"],
  ["名：", "明城"],
  ["英文姓名：", "Alex"],
  ["國籍：", "印尼"],
  ["性別：", "男"],
  ["兵役狀態：", ""],
  ["役別：", ""],
  ["兵役期間：", "-"],
  ["證件類型：", "護照"],
  ["證件號碼：", "F800635254"],
  ["證件到期日：", ""],
  ["證件類型2：", ""],
  ["證件號碼2：", ""],
  ["證件到期日2：", ""],
  ["證件類型3：", ""],
  ["證件號碼3：", ""],
  ["證件到期日3：", ""],
  ["入境時間：", ""],
  ["生日：", "1999/06/04"],
  ["婚姻狀態：", "未婚"],
];

export default function BasicInformationTab() {
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