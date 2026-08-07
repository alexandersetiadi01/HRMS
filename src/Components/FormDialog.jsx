import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function FormDialog({
  open,
  title,
  children,
  submitting = false,
  submitLabel = "儲存",
  cancelLabel = "取消",
  maxWidth = "sm",
  onClose,
  onSubmit,
}) {
  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth={maxWidth}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: "8px",
        }}
      >
        <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
          {title}
        </Typography>

        <IconButton
          size="small"
          onClick={onClose}
          disabled={submitting}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {children}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: "16px",
          py: "12px",
          gap: "8px",
        }}
      >
        {cancelLabel ? (
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
        ) : null}

        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? "處理中..." : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}