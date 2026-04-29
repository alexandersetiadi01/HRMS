import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

/**
 * 成功送出 Dialog
 */
export function SuccessDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "18px",
        }}
      >
        申請已送出
      </DialogTitle>

      <DialogContent>
        <Typography
          sx={{
            fontSize: "15px",
            color: "#374151",
          }}
        >
          您的特殊假別申請已成功送出，請等待審核。
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: "16px",
          pb: "12px",
        }}
      >
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: "#101b4d",
            "&:hover": {
              bgcolor: "#0c1438",
            },
          }}
        >
          確認
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * 非工作日確認 Dialog
 */
export function NonWorkingConfirmDialog({
  open,
  onCancel,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "18px",
        }}
      >
        確認日期
      </DialogTitle>

      <DialogContent>
        <Typography
          sx={{
            fontSize: "15px",
            color: "#374151",
          }}
        >
          您選擇的日期為非工作日（假日或未排班），是否確認送出？
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: "16px",
          pb: "12px",
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
        }}
      >
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{
            color: "#374151",
            borderColor: "#9ca3af",
          }}
        >
          取消
        </Button>

        <Button
          variant="contained"
          onClick={onConfirm}
          sx={{
            bgcolor: "#101b4d",
            "&:hover": {
              bgcolor: "#0c1438",
            },
          }}
        >
          確認
        </Button>
      </DialogActions>
    </Dialog>
  );
}