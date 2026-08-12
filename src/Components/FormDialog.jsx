import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Alert,
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

import {
  clearGlobalDialogApiError,
  getGlobalDialogApiError,
  getGlobalLoading,
  registerGlobalFormDialog,
  subscribeGlobalDialogApiError,
  subscribeGlobalLoading,
  unregisterGlobalFormDialog,
} from "../Utils/GlobalLoading";

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
  const [apiErrorText, setApiErrorText] = useState(
    getGlobalDialogApiError(),
  );

  const globalLoading = useSyncExternalStore(
    subscribeGlobalLoading,
    getGlobalLoading,
    getGlobalLoading,
  );

  useEffect(() => {
    return subscribeGlobalDialogApiError(() => {
      setApiErrorText(getGlobalDialogApiError());
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    clearGlobalDialogApiError();
    registerGlobalFormDialog();

    return () => {
      unregisterGlobalFormDialog();
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth={maxWidth}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: "rgba(17, 24, 39, 0.56)",
          },
        },
      }}
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
            ...(apiErrorText
              ? {
                  "& .MuiAlert-root": {
                    display: "none",
                  },
                }
              : {}),
            ...(globalLoading
              ? {
                  "& .MuiCircularProgress-root": {
                    visibility: "hidden",
                  },
                }
              : {}),
          }}
        >
          {apiErrorText ? (
            <Alert
              severity="error"
              sx={{
                display: "flex !important",
              }}
            >
              {apiErrorText}
            </Alert>
          ) : null}

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