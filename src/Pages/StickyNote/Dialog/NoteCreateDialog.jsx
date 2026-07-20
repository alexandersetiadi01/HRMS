import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function getTaiwanNow() {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

export default function NoteCreateDialog({
  open,
  selectedRecipients = [],
  submitting = false,
  onClose,
  onOpenRecipient,
  onSubmit,
  getEmployeeLabel,
}) {
  const [content, setContent] = useState("");
  const [nowText, setNowText] = useState(getTaiwanNow());

  useEffect(() => {
    if (open) {
      setNowText(getTaiwanNow());
      setContent("");
    }
  }, [open]);

  const recipientText =
    selectedRecipients.length > 0
      ? selectedRecipients.map(getEmployeeLabel).join("、")
      : "選擇人員";

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit({ content });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: "calc(100vw - 16px)", sm: "420px" },
          maxWidth: "420px",
          m: { xs: "8px", sm: "32px" },
          borderRadius: "4px",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          height: "40px",
          bgcolor: "#000000",
          color: "#ffffff",
          px: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
          新增便利貼
        </Typography>

        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            width: "18px",
            height: "18px",
            bgcolor: "#8a8a8a",
            color: "#000000",
            p: 0,
            "&:hover": { bgcolor: "#a3a3a3" },
          }}
        >
          <CloseIcon sx={{ fontSize: "15px" }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: { xs: "12px", sm: "16px" },
          py: { xs: "12px", sm: "14px" },
        }}
      >
        <Box sx={{ display: "grid", rowGap: "14px" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              gap: { xs: "8px", sm: "12px" },
            }}
          >
            <Typography
              sx={{
                width: { xs: "auto", sm: "58px" },
                flexShrink: 0,
                fontSize: "15px",
                color: "#555555",
              }}
            >
              收件人：
            </Typography>

            <Button
              variant="outlined"
              onClick={onOpenRecipient}
              sx={{
                width: { xs: "100%", sm: "auto" },
                maxWidth: "100%",
                minWidth: "82px",
                minHeight: "34px",
                borderColor: "#c5c5c5",
                color: "#333333",
                bgcolor: "#ffffff",
                fontSize: "14px",
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                textAlign: "left",
              }}
            >
              {recipientText}
            </Button>
          </Box>

          <Typography sx={{ fontSize: "15px", color: "#555555" }}>
            日期：{nowText}
          </Typography>

          <Typography sx={{ fontSize: "15px", color: "#555555" }}>
            內容：
          </Typography>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            style={{
              width: "100%",
              height: "110px",
              resize: "none",
              boxSizing: "border-box",
              border: "1px solid #8f8f8f",
              padding: "8px",
              fontSize: "15px",
              outline: "none",
            }}
          />
        </Box>

        <Box
          sx={{
            mt: "10px",
            pt: "16px",
            borderTop: "1px solid #d7d7d7",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "flex-end",
            gap: "6px",
          }}
        >
          <Button
            variant="contained"
            disabled={submitting}
            onClick={handleSubmit}
            sx={{
              width: { xs: "100%", sm: "auto" },
              minWidth: "76px",
              height: "34px",
              bgcolor: "#2f7fbd",
              color: "#ffffff",
              fontSize: "15px",
              boxShadow: "none",
              "&:hover": { bgcolor: "#276fa8", boxShadow: "none" },
            }}
          >
            送出
          </Button>

          <Button
            variant="outlined"
            disabled={submitting}
            onClick={onClose}
            sx={{
              width: { xs: "100%", sm: "auto" },
              minWidth: "76px",
              height: "34px",
              borderColor: "#c5c5c5",
              color: "#555555",
              bgcolor: "#ffffff",
              fontSize: "15px",
            }}
          >
            取消
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
