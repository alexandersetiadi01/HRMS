import AppSnackbar from "./AppSnackbar";

export default function SuccessDialog({
  open,
  message = "資料已成功儲存。",
  onClose,
}) {
  return (
    <AppSnackbar
      open={open}
      severity="success"
      message={message}
      onClose={onClose}
    />
  );
}