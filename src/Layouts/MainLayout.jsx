import { Box, InputBase, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { Outlet } from "react-router-dom";
import Navbar from "../Components/Navbar";

function MainLayout() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f4f6" }}>
      <Box
        sx={{
          height: "60px",
          bgcolor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "1180px",
            mx: "auto",
            px: { xs: "16px", md: "24px" },
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              fontSize: { xs: "24px", md: "30px" },
              fontWeight: 700,
              color: "#1b9ad7",
              lineHeight: 1,
              display: "flex",
              alignItems: "flex-start",
              gap: "4px",
              flexShrink: 0,
            }}
          >
            <Box component="span">SEHO</Box>
            <Box
              component="span"
              sx={{
                fontSize: "12px",
                border: "1px solid #67b7e5",
                borderRadius: "4px",
                px: "4px",
                py: "1px",
                mt: "2px",
                color: "#67b7e5",
              }}
            >
              HR
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: "12px", md: "20px" },
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: { xs: "180px", md: "260px" },
                height: "34px",
                border: "1px solid #d1d5db",
                borderRadius: "18px",
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                px: "12px",
                bgcolor: "#ffffff",
              }}
            >
              <SearchIcon sx={{ fontSize: "18px", color: "#9ca3af", mr: "6px" }} />
              <InputBase
                placeholder="People Search"
                sx={{
                  flex: 1,
                  fontSize: "14px",
                  color: "#374151",
                }}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <AccountCircleIcon sx={{ color: "#8b8b8b", fontSize: "28px" }} />
              <Typography
                sx={{
                  fontSize: { xs: "13px", md: "15px" },
                  color: "#6b7280",
                  whiteSpace: "nowrap",
                }}
              >
                帳戶
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Navbar />

      <Box
        sx={{
          width: "100%",
          maxWidth: "1180px",
          mx: "auto",
          px: { xs: "16px", md: "24px" },
          py: "20px",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default MainLayout;