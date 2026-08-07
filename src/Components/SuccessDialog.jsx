import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

export default function SuccessDialog({
  open,
  title = "操作成功",
  message = "資料已成功儲存。",
  confirmLabel = "確認",
  onClose,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
          overflow: "hidden",
        },
      }}
    >
      <DialogContent
        sx={{
          px: { xs: "22px", sm: "30px" },
          pt: "30px",
          pb: "20px",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: "85px",
            height: "85px",
            mx: "auto",
            mb: "18px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#ecfdf3",
          }}
        >
          <CheckCircleRoundedIcon sx={{ fontSize: "80px", color: "#16a34a" }} />
        </Box>

        <Typography sx={{ fontSize: "21px", fontWeight: 700, color: "#111827" }}>
          {title}
        </Typography>

        <Typography
          sx={{
            mt: "10px",
            fontSize: "15px",
            lineHeight: 1.7,
            color: "#6b7280",
          }}
        >
          {message}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: "22px", sm: "30px" },
          pb: "24px",
          pt: 0,
          justifyContent: "center",
        }}
      >
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            minWidth: "120px",
            minHeight: "40px",
            borderRadius: "8px",
            fontWeight: 700,
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}