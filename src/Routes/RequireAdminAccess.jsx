import {
  Alert,
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { useNavigate } from "react-router-dom";

import { getStoredAuthUser } from "../API/auth";

export default function RequireAdminAccess({ children }) {
  const navigate = useNavigate();
  const authUser = getStoredAuthUser();

  if (authUser?.is_admin_access === true) {
    return children;
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "720px",
        mx: "auto",
        px: { xs: "16px", sm: "24px" },
        py: { xs: "24px", sm: "40px" },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: { xs: "20px", sm: "28px" },
          borderColor: "#e2e8f0",
          borderRadius: "8px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            mb: "16px",
          }}
        >
          <AdminPanelSettingsOutlinedIcon sx={{ color: "#dc2626" }} />

          <Typography
            component="h1"
            sx={{
              color: "#1e293b",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            需要管理員模式
          </Typography>
        </Box>

        <Alert severity="error" sx={{ mb: "20px" }}>
          此功能只能在管理員模式下使用。
        </Alert>

        <Button
          variant="contained"
          onClick={() => navigate("/attendance", { replace: true })}
        >
          返回出勤管理
        </Button>
      </Paper>
    </Box>
  );
}