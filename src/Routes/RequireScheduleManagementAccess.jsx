import {
  Alert,
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { getStoredAuthUser } from "../API/auth";
import { canManageAttendanceSchedule } from "../Utils/AttendancePermissions";

export default function RequireScheduleManagementAccess({
  children,
}) {
  const navigate = useNavigate();
  const authUser = getStoredAuthUser();

  if (canManageAttendanceSchedule(authUser)) {
    return children;
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "720px",
        mx: "auto",
        px: {
          xs: "16px",
          sm: "24px",
        },
        py: {
          xs: "24px",
          sm: "40px",
        },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: {
            xs: "20px",
            sm: "28px",
          },
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
          <LockOutlinedIcon
            sx={{
              color: "#dc2626",
            }}
          />

          <Typography
            component="h1"
            sx={{
              color: "#1e293b",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            無班表審核權限
          </Typography>
        </Box>

        <Alert
          severity="error"
          sx={{
            mb: "20px",
          }}
        >
          此帳號未設定班表審核權限。
        </Alert>

        <Button
          variant="contained"
          onClick={() =>
            navigate("/attendance", {
              replace: true,
            })
          }
        >
          返回出勤管理
        </Button>
      </Paper>
    </Box>
  );
}