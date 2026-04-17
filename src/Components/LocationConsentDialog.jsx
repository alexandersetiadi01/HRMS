import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import {
  denyLocationConsent,
  grantLocationConsent,
  shouldPromptLocationConsent,
} from "../Utils/LocationConsent";

export default function LocationConsentDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(shouldPromptLocationConsent());
  }, []);

  function handleAllow() {
    grantLocationConsent();
    setOpen(false);
  }

  function handleDeny() {
    denyLocationConsent();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="xs"
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: "8px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <PlaceOutlinedIcon sx={{ color: "#1698dc", fontSize: "28px" }} />
          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            定位使用同意
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: "4px !important" }}>
        <Typography
          sx={{
            fontSize: "15px",
            lineHeight: 1.8,
            color: "#374151",
          }}
        >
          本網站會在您使用打卡功能時存取裝置定位，用於確認是否位於允許打卡的辦公區域內。
          <br />
          <br />
          您的選擇會保存 1 個月，之後會再次詢問。
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: "24px",
          pb: "20px",
          gap: "8px",
          justifyContent: "flex-end",
        }}
      >
        <Button
          variant="outlined"
          onClick={handleDeny}
          sx={{
            minWidth: "96px",
            borderRadius: "10px",
            fontWeight: 700,
          }}
        >
          不同意
        </Button>

        <Button
          variant="contained"
          onClick={handleAllow}
          sx={{
            minWidth: "96px",
            borderRadius: "10px",
            fontWeight: 700,
          }}
        >
          同意
        </Button>
      </DialogActions>
    </Dialog>
  );
}