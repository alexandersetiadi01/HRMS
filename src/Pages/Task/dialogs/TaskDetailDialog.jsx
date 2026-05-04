import { Box, Button, Dialog, DialogContent, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { formatDateTime } from "../TaskUtils";

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

function DetailField({ label, value }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "90px minmax(0, 1fr)",
        columnGap: "10px",
        alignItems: "start",
        mb: "10px",
      }}
    >
      <Typography sx={{ fontSize: "14px", color: "#777777" }}>{label}</Typography>
      <Typography
        sx={{
          fontSize: "15px",
          color: "#333333",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {value || "-"}
      </Typography>
    </Box>
  );
}

function AttachmentLinks({ attachments }) {
  if (!attachments?.length) {
    return <Typography sx={{ fontSize: "14px", color: "#777777" }}>-</Typography>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {attachments.map((file) => (
        <a
          key={file.task_attachment_id}
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "14px",
            color: "#2563eb",
            textDecoration: "underline",
            wordBreak: "break-all",
          }}
        >
          {file.file_name || "查看附件"}
        </a>
      ))}
    </Box>
  );
}

export default function TaskDetailDialog({
  open,
  row,
  attachments,
  replies,
  replyAttachmentsMap,
  onClose,
}) {
  if (!row) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "720px",
          maxWidth: "calc(100vw - 48px)",
          borderRadius: "4px",
          overflow: "hidden",
        },
      }}
    >
      <DialogHeader title="任務詳細內容" onClose={onClose} />

      <DialogContent sx={{ p: "16px" }}>
        <Box
          sx={{
            border: "1px solid #d8d8d8",
            borderRadius: "4px",
            bgcolor: "#f7f7f7",
            p: "14px",
            mb: "14px",
          }}
        >
          <DetailField label="標題" value={row.title} />
          <DetailField label="內容" value={row.description} />
          <DetailField label="開始時間" value={formatDateTime(row.start_date)} />
          <DetailField label="截止時間" value={formatDateTime(row.due_date)} />
          <DetailField label="任務狀態" value={row.task_status} />
          <DetailField label="指派狀態" value={row.assigned_status} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "90px minmax(0, 1fr)",
              columnGap: "10px",
              alignItems: "start",
              mt: "10px",
            }}
          >
            <Typography sx={{ fontSize: "14px", color: "#777777" }}>
              任務附件
            </Typography>
            <AttachmentLinks attachments={attachments} />
          </Box>
        </Box>

        <Typography sx={{ fontSize: "16px", fontWeight: 700, mb: "10px" }}>
          回覆紀錄
        </Typography>

        {replies.length === 0 ? (
          <Box
            sx={{
              border: "1px solid #dddddd",
              borderRadius: "4px",
              p: "12px",
              bgcolor: "#ffffff",
            }}
          >
            <Typography sx={{ fontSize: "14px", color: "#777777" }}>
              目前沒有回覆紀錄。
            </Typography>
          </Box>
        ) : (
          replies.map((reply) => (
            <Box
              key={reply.task_reply_id}
              sx={{
                border: "1px solid #dddddd",
                borderRadius: "4px",
                p: "12px",
                bgcolor: "#ffffff",
                mb: "10px",
              }}
            >
              <DetailField label="回覆時間" value={formatDateTime(reply.reply_date)} />
              <DetailField label="回覆狀態" value={reply.reply_status} />
              <DetailField label="回覆內容" value={reply.reply_content} />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "90px minmax(0, 1fr)",
                  columnGap: "10px",
                  alignItems: "start",
                }}
              >
                <Typography sx={{ fontSize: "14px", color: "#777777" }}>
                  回覆附件
                </Typography>
                <AttachmentLinks
                  attachments={replyAttachmentsMap[String(reply.task_reply_id)] || []}
                />
              </Box>
            </Box>
          ))
        )}

        <Box
          sx={{
            mt: "18px",
            borderTop: "1px solid #d7d7d7",
            pt: "12px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button variant="outlined" onClick={onClose}>
            關閉
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}