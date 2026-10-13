import {
  Alert,
  Snackbar,
} from "@mui/material";

export default function AppSnackbar({
  open = false,
  message = "",
  severity = "success",
  autoHideDuration = 4000,
  onClose,
}) {
  const handleClose = (
    event,
    reason,
  ) => {
    if (reason === "clickaway") {
      return;
    }

    onClose?.();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      sx={{
        "&.MuiSnackbar-root": {
          left: {
            xs: "16px",
            sm: "auto",
          },
          right: {
            xs: "16px",
            sm: "24px",
          },
          bottom: {
            xs: "16px",
            sm: "24px",
          },
        },
      }}
    >
      <Alert
        severity={severity}
        variant="filled"
        onClose={handleClose}
        sx={{
          width: "100%",
          minWidth: {
            xs: 0,
            sm: "320px",
          },
          maxWidth: "480px",
          boxShadow:
            "0 6px 20px rgba(0,0,0,0.18)",
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}