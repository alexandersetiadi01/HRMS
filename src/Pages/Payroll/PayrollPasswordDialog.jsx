import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { verifyPayrollPassword } from "../../API/payroll"; 

export const PAYROLL_VERIFICATION_STORAGE_KEY =
  "hrms_payroll_verification_token";

export default function PayrollPasswordDialog({
  open,
  onClose,
  onVerified,
  title = "請再次輸入密碼",
}) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;

    setPassword("");
    setErrorMessage("");
    onClose?.();
  };

  const handleConfirm = async () => {
    if (!password.trim()) {
      setErrorMessage("請先輸入登入密碼。");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const result = await verifyPayrollPassword(password.trim());
      const token = result?.verification_token;

      if (!token) {
        setPassword("");
        setErrorMessage("驗證失敗，請重新輸入密碼。");
        return;
      }

      await onVerified?.(token);

      sessionStorage.setItem(PAYROLL_VERIFICATION_STORAGE_KEY, token);
      setPassword("");
      setErrorMessage("");
      onClose?.();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.data?.message ||
        error?.message ||
        "密碼驗證失敗，請重新確認。";

      setPassword("");
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "404px",
          maxWidth: "95vw",
          borderRadius: "6px",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          height: "36px",
          px: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#1f86cc",
          color: "#ffffff",
        }}
      >
        <Typography sx={{ fontSize: "14px", fontWeight: 700 }}>
          {title}
        </Typography>

        <IconButton
          onClick={handleClose}
          disabled={loading}
          size="small"
          sx={{ p: 0, color: "#ffffff" }}
        >
          <CloseIcon sx={{ fontSize: "18px" }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: "30px", pt: "26px", pb: "10px" }}>
        <Typography
          sx={{
            fontSize: "14px",
            color: "#4b5563",
            lineHeight: 1.7,
            mb: "18px",
          }}
        >
          為了保障資料隱私安全，輸入密碼時，請留意身旁是否有人或監視器。
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "72px minmax(0, 1fr)",
            columnGap: "10px",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontSize: "14px", color: "#374151" }}>
            輸入密碼
          </Typography>

          <TextField
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrorMessage("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !loading) {
                handleConfirm();
              }
            }}
            placeholder="請輸入您的密碼"
            fullWidth
            disabled={loading}
            sx={{
              "& .MuiInputBase-root": {
                height: "32px",
                fontSize: "14px",
                bgcolor: "#ffffff",
              },
              "& .MuiOutlinedInput-input": {
                px: "10px",
                py: "6px",
              },
            }}
          />
        </Box>

        {errorMessage && (
          <Alert
            severity="error"
            sx={{
              mt: "14px",
              fontSize: "14px",
              alignItems: "center",
            }}
          >
            {errorMessage}
          </Alert>
        )}

        <Box sx={{ mt: "18px", display: "flex", justifyContent: "flex-end" }}>
          <Link
            component="button"
            type="button"
            underline="none"
            sx={{ fontSize: "14px", color: "#1f86cc", cursor: "pointer" }}
          >
            忘記HR系統密碼
          </Link>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: "12px",
          py: "8px",
          bgcolor: "#ffffff",
          borderTop: "1px solid #d1d5db",
          justifyContent: "flex-end",
          gap: "2px",
        }}
      >
        <Button
          onClick={handleConfirm}
          variant="outlined"
          disabled={loading}
          sx={{
            minWidth: "52px",
            height: "34px",
            fontSize: "14px",
            color: "#fff",
            border: "none",
            bgcolor: "#1f86cc",
            "&:hover": { bgcolor: "#1976b8", border: "none" },
            "&.Mui-disabled": {
              color: "#ffffff",
              bgcolor: "#93c5fd",
            },
          }}
        >
          {loading ? "驗證中" : "確定"}
        </Button>

        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={loading}
          sx={{
            minWidth: "52px",
            height: "34px",
            fontSize: "14px",
            color: "#ffffff",
            border: "none",
            bgcolor: "#ff0000",
            "&:hover": { bgcolor: "#dc2626", border: "none" },
            "&.Mui-disabled": {
              color: "#ffffff",
              bgcolor: "#fca5a5",
            },
          }}
        >
          取消
        </Button>
      </DialogActions>
    </Dialog>
  );
}