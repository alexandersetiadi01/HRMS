import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

export default function DismissibleAlertAction() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return <span className="hrms-alert-dismissed" />;
  }

  return (
    <IconButton
      aria-label="關閉訊息"
      size="small"
      color="inherit"
      onClick={() => setDismissed(true)}
      sx={{
        p: "4px",
        mt: "-2px",
      }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );
}