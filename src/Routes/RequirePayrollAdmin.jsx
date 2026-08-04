import { Alert, Box, Button, Paper, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { getStoredAuthUser } from "../API/auth";
import { canAccessPayrollModule } from "../Utils/PayrollPermissions";

export default function RequirePayrollAdmin({ children }) {
  const navigate = useNavigate();
  const authUser = getStoredAuthUser();

  if (canAccessPayrollModule(authUser)) {
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
          <LockOutlinedIcon sx={{ color: "#dc2626" }} />

          <Typography
            component="h1"
            sx={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#1e293b",
            }}
          >
            無薪資管理權限
          </Typography>
        </Box>

        <Alert severity="error" sx={{ mb: "20px" }}>
          此頁面僅供薪資管理員使用。如需存取，請聯絡系統管理員。
        </Alert>

        <Button
          variant="contained"
          onClick={() => navigate("/", { replace: true })}
        >
          返回首頁
        </Button>
      </Paper>
    </Box>
  );
}