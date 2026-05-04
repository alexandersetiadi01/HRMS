import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { submitTaskReply } from "../../../API/task";

function DialogHeader({ title, onClose }) {
  return (
    <Box
      sx={{
        height: "40px",
        bgcolor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: "14px",
      }}
    >
      <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>
        {title}
      </Typography>

      <IconButton onClick={onClose} size="small" sx={{ color: "#ffffff", p: 0 }}>
        <CloseIcon sx={{ fontSize: "18px" }} />
      </IconButton>
    </Box>
  );
}

export default function TaskReplyDialog({
  open,
  row,
  employeeId,
  onClose,
  onSubmitted,
}) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!row) return null;

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("請輸入回覆內容。");
      return;
    }

    setSubmitting(true);

    try {
      await submitTaskReply({
        task_id: row.task_id,
        task_assignee_id: row.task_assignee_id,
        employee_id: employeeId,
        reply_content: content,
        file,
      });

      setContent("");
      setFile(null);

      onSubmitted?.();
      onClose();
    } catch (error) {
      console.error(error);
      alert("送出失敗");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "560px",
          maxWidth: "calc(100vw - 48px)",
          borderRadius: "4px",
          overflow: "hidden",
        },
      }}
    >
      <DialogHeader title="回覆任務" onClose={onClose} />

      <DialogContent sx={{ p: "16px" }}>
        <Box sx={{ mb: "12px" }}>
          <Typography sx={{ fontSize: "14px", color: "#777777", mb: "4px" }}>
            回覆內容
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Box>

        <Box sx={{ mb: "12px" }}>
          <Typography sx={{ fontSize: "14px", color: "#777777", mb: "4px" }}>
            上傳附件
          </Typography>

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </Box>

        <Box
          sx={{
            mt: "16px",
            borderTop: "1px solid #d7d7d7",
            pt: "12px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <Button onClick={onClose}>取消</Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            送出
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}