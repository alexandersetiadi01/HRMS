import { Box, Button, Paper, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PersonIcon from "@mui/icons-material/Person";
import AccountTabs from "../Pages/Account/AccountTabs";

export default function AccountLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: "0px", md: "40px" },
        py: { xs: "20px", md: "28px" },
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "220px minmax(0, 1fr)" },
          gap: { xs: "20px", md: "28px" },
          alignItems: "start",
        }}
      >
        <Box>
          <Paper
            elevation={0}
            sx={{
              width: "160px",
              height: "190px",
              mx: "auto",
              border: "1px solid #cfcfcf",
              bgcolor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: "10px",
            }}
          >
            <Box
              sx={{
                width: "140px",
                height: "170px",
                border: "1px solid #d6d6d6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#fafafa",
              }}
            >
              <PersonIcon sx={{ fontSize: "150px", color: "#a8a8a8" }} />
            </Box>
          </Paper>

          <Button
            startIcon={<CameraAltIcon />}
            sx={{
              color: "#1f2937",
              fontSize: "14px",
              textTransform: "none",
              p: 0,
              minWidth: "unset",
              display: "flex",
              mx: "auto",
              mb: "14px",
            }}
          >
            更改個人大頭照
          </Button>

          <TextField
            fullWidth
            placeholder="請輸入您的動態訊息"
            size="small"
            sx={{
              maxWidth: { xs: "260px", md: "100%" },
              width: "100%",
              mx: "auto",
              display: "block",
              "& .MuiInputBase-root": {
                height: "36px",
                fontSize: "14px",
                bgcolor: "#ffffff",
              },
            }}
          />

          {isMobile ? (
            <Typography
              sx={{
                maxWidth: "260px",
                mx: "auto",
                mt: "8px",
                fontSize: "13px",
                color: "#b91c1c",
                lineHeight: 1.5,
              }}
            >
              *如需修改個人資料，請用電腦版更新
            </Typography>
          ) : null}
        </Box>

        <Paper
          elevation={0}
          sx={{
            border: "1px solid #cfcfcf",
            bgcolor: "#ffffff",
            p: { xs: 0, md: "16px" },
            overflow: "hidden",
          }}
        >
          <AccountTabs />
        </Paper>
      </Box>
    </Box>
  );
}