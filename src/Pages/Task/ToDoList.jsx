import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  TextField,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Breadcrumb from "../../Utils/Breadcrumb";
import http from "../../API/http";
import { getCurrentEmployeeId } from "../../API/account";

const accentColor = "#677986";

const tabs = [
  { key: "pending", label: "待辦事項" },
  { key: "assigned", label: "指派事項" },
];

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

function unwrap(response, fallback = []) {
  return response?.data?.data ?? fallback;
}

function StatusPill({ value }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "52px",
        height: "18px",
        px: "8px",
        borderRadius: "2px",
        bgcolor: "#c7c7c7",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      {value || "-"}
    </Box>
  );
}

function AttachmentLinks({ attachments }) {
  if (!attachments?.length) {
    return (
      <Typography sx={{ fontSize: "14px", color: "#777777" }}>-</Typography>
    );
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
      <Typography sx={{ fontSize: "14px", color: "#777777" }}>
        {label}
      </Typography>
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

function TaskDialog({
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
        <Typography
          sx={{ fontSize: "15px", fontWeight: 700, color: "#ffffff" }}
        >
          任務詳細內容
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "#ffffff", p: 0 }}
        >
          <CloseIcon sx={{ fontSize: "18px" }} />
        </IconButton>
      </Box>

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
          <DetailField
            label="開始時間"
            value={formatDateTime(row.start_date)}
          />
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
              <DetailField
                label="時間："
                value={formatDateTime(reply.reply_date)}
              />
              <DetailField label="狀態：" value={reply.reply_status} />
              <DetailField label="內容：" value={reply.reply_content} />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "90px minmax(0, 1fr)",
                  columnGap: "10px",
                  alignItems: "start",
                }}
              >
                <Typography sx={{ fontSize: "14px", color: "#777777" }}>
                  附件：
                </Typography>
                <AttachmentLinks
                  attachments={
                    replyAttachmentsMap[String(reply.task_reply_id)] || []
                  }
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

function ReplyDialog({ open, row, submitting, onClose, onSubmit }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (open) {
      setContent("");
      setFile(null);
    }
  }, [open]);

  if (!row) return null;

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "640px",
          maxWidth: "calc(100vw - 48px)",
          borderRadius: "4px",
          overflow: "hidden",
        },
      }}
    >
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
        <Typography
          sx={{ fontSize: "15px", fontWeight: 700, color: "#ffffff" }}
        >
          送出任務回覆
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          disabled={submitting}
          sx={{ color: "#ffffff", p: 0 }}
        >
          <CloseIcon sx={{ fontSize: "18px" }} />
        </IconButton>
      </Box>

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
          <DetailField label="截止時間" value={formatDateTime(row.due_date)} />
          <DetailField label="指派狀態" value={row.assigned_status} />
        </Box>

        <TextField
          label="回覆內容"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          fullWidth
          multiline
          minRows={5}
          sx={{ mb: "14px" }}
        />

        <Box sx={{ mb: "14px" }}>
          <Typography sx={{ fontSize: "14px", color: "#555555", mb: "6px" }}>
            附件
          </Typography>
          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </Box>

        <Box
          sx={{
            mt: "18px",
            borderTop: "1px solid #d7d7d7",
            pt: "12px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <Button variant="outlined" onClick={onClose} disabled={submitting}>
            取消
          </Button>

          <Button
            variant="contained"
            disabled={submitting || content.trim() === ""}
            onClick={() => onSubmit({ content, file })}
            sx={{
              bgcolor: accentColor,
              boxShadow: "none",
              "&:hover": {
                bgcolor: accentColor,
                boxShadow: "none",
              },
            }}
          >
            {submitting ? "送出中..." : "送出"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function DataTable({ columns, rows, emptyText, onRowClick }) {
  return (
    <Box sx={{ border: "1px solid #d3d3d3", bgcolor: "#ffffff" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: columns
            .map((item) => item.width || "1fr")
            .join(" "),
          minHeight: "38px",
          alignItems: "center",
          background: "linear-gradient(to bottom, #f7f7f7, #dddddd)",
          borderBottom: "1px solid #d3d3d3",
        }}
      >
        {columns.map((column) => (
          <Box
            key={column.key}
            sx={{
              px: "12px",
              minHeight: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRight: column.withDivider ? "1px solid #d3d3d3" : "none",
            }}
          >
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#333333",
                textAlign: "center",
              }}
            >
              {column.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {rows.length === 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: columns
              .map((item) => item.width || "1fr")
              .join(" "),
            minHeight: "42px",
            alignItems: "center",
          }}
        >
          <Box sx={{ px: "12px", py: "10px" }}>
            <Typography sx={{ fontSize: "15px", color: "#333333" }}>
              {emptyText}
            </Typography>
          </Box>
        </Box>
      ) : (
        rows.map((row, rowIndex) => (
          <Box
            key={row.id || rowIndex}
            onClick={() => onRowClick(row)}
            sx={{
              display: "grid",
              gridTemplateColumns: columns
                .map((item) => item.width || "1fr")
                .join(" "),
              minHeight: "50px",
              alignItems: "center",
              borderBottom:
                rowIndex === rows.length - 1 ? "none" : "1px solid #d3d3d3",
              cursor: "pointer",
              "&:hover": {
                bgcolor: "#fafafa",
              },
            }}
          >
            {columns.map((column) => (
              <Box
                key={column.key}
                sx={{
                  px: "12px",
                  py: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    column.align === "center" ? "center" : "flex-start",
                }}
              >
                {column.type === "statusPill" ? (
                  <StatusPill value={row[column.key]} />
                ) : (
                  <Typography
                    sx={{
                      fontSize: "15px",
                      color: column.cellSx?.color || "#333333",
                      textAlign: column.align || "left",
                      whiteSpace: column.wrap === false ? "nowrap" : "normal",
                      overflow: column.wrap === false ? "hidden" : "visible",
                      textOverflow: column.wrap === false ? "ellipsis" : "clip",
                      wordBreak: "break-word",
                    }}
                  >
                    {row[column.key] || "-"}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        ))
      )}
    </Box>
  );
}

const pendingColumns = [
  {
    key: "status",
    label: "案件狀態",
    width: "120px",
    align: "center",
    withDivider: true,
    type: "statusPill",
  },
  {
    key: "title",
    label: "標題",
    width: "1fr",
    withDivider: true,
    cellSx: { color: "#5a3c12" },
  },
  {
    key: "assigner",
    label: "指派者",
    width: "120px",
    align: "center",
    withDivider: true,
    cellSx: { color: "#5a3c12" },
  },
  {
    key: "deadline",
    label: "期限",
    width: "200px",
    align: "center",
    withDivider: true,
    cellSx: { color: "#5a3c12" },
  },
];

const assignedColumns = [
  {
    key: "status",
    label: "案件狀態",
    width: "120px",
    align: "center",
    withDivider: true,
    type: "statusPill",
  },
  {
    key: "title",
    label: "標題",
    width: "1fr",
    withDivider: true,
    cellSx: { color: "#5a3c12" },
  },
  {
    key: "handoverTarget",
    label: "交辦對象",
    width: "140px",
    align: "center",
    withDivider: true,
    cellSx: { color: "#5a3c12" },
  },
  {
    key: "deadline",
    label: "期限",
    width: "180px",
    align: "center",
    withDivider: true,
    cellSx: { color: "#5a3c12" },
  },
];

export default function TodoList() {
  const employeeId = Number(getCurrentEmployeeId() || 0);

  const [activeTab, setActiveTab] = useState("pending");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [detailAttachments, setDetailAttachments] = useState([]);
  const [detailReplies, setDetailReplies] = useState([]);
  const [replyAttachmentsMap, setReplyAttachmentsMap] = useState({});

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyRow, setReplyRow] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!employeeId) {
      setTasks([]);
      return;
    }

    setLoading(true);

    try {
      const response = await http.get("/task-assignees", {
        params: {
          employee_id: employeeId,
        },
      });

      const rows = unwrap(response, []);
      setTasks(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Failed to load task assignees:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const mappedRows = useMemo(() => {
    return tasks.map((row) => {
      const title = row.title || "-";
      const deadline = formatDateTime(row.due_date);
      const employeeLabel = row.display_name || "-";
      const assignerLabel = row.creator_display_name || "-";

      return {
        ...row,
        id: row.task_assignee_id,
        status: row.assigned_status || row.task_status || "-",
        title,
        assigner: assignerLabel,
        handoverTarget: employeeLabel,
        deadline,
      };
    });
  }, [tasks]);

  const handleOpenDetail = async (row) => {
    setDetailRow(row);
    setDetailAttachments([]);
    setDetailReplies([]);
    setReplyAttachmentsMap({});
    setDetailOpen(true);

    try {
      const [attachmentsResponse, repliesResponse] = await Promise.all([
        http.get("/task-attachments", {
          params: {
            task_id: row.task_id,
          },
        }),
        http.get("/task-replies", {
          params: {
            task_id: row.task_id,
            employee_id: employeeId,
          },
        }),
      ]);

      const attachments = unwrap(attachmentsResponse, []);
      const replies = unwrap(repliesResponse, []);

      setDetailAttachments(
        Array.isArray(attachments)
          ? attachments.filter((item) => !item.task_reply_id)
          : [],
      );

      setDetailReplies(Array.isArray(replies) ? replies : []);

      const replyAttachmentPairs = await Promise.all(
        (Array.isArray(replies) ? replies : []).map(async (reply) => {
          try {
            const response = await http.get("/task-attachments", {
              params: {
                task_reply_id: reply.task_reply_id,
              },
            });

            return [String(reply.task_reply_id), unwrap(response, [])];
          } catch {
            return [String(reply.task_reply_id), []];
          }
        }),
      );

      setReplyAttachmentsMap(Object.fromEntries(replyAttachmentPairs));
    } catch (error) {
      console.error("Failed to load task detail:", error);
    }
  };

  const handleOpenReply = (row) => {
    setReplyRow(row);
    setReplyOpen(true);
  };

  const handleSubmitReply = async ({ content, file }) => {
    if (!replyRow || !employeeId) return;

    setSubmittingReply(true);

    try {
      const formData = new FormData();

      formData.append("task_id", String(replyRow.task_id));
      formData.append("task_assignee_id", String(replyRow.task_assignee_id));
      formData.append("employee_id", String(employeeId));
      formData.append("reply_content", content);

      if (file) {
        formData.append("reply_file", file);
      }

      await http.post("/task-replies", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setReplyOpen(false);
      setReplyRow(null);
      await loadTasks();
    } catch (error) {
      console.error("Failed to submit task reply:", error);
      alert("送出回覆失敗，請稍後再試。");
    } finally {
      setSubmittingReply(false);
    }
  };

  const currentRows = activeTab === "pending" ? mappedRows : mappedRows;
  const currentColumns =
    activeTab === "pending" ? pendingColumns : assignedColumns;

  return (
    <Box>
      <Breadcrumb rootLabel="首頁" currentLabel="待辦事項" mb="14px" />

      <Typography
        sx={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#111827",
          mb: "18px",
        }}
      >
        待辦事項
      </Typography>

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
        <Box
          sx={{
            width: "168px",
            border: "1px solid #e0e0e0",
            bgcolor: "#f7f7f7",
            flexShrink: 0,
            mt: "46px",
          }}
        >
          <Box
            sx={{
              borderTop: `5px solid ${accentColor}`,
              minHeight: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderBottom: "1px solid #e5e5e5",
              px: "12px",
            }}
          >
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 700,
                color: accentColor,
                textAlign: "center",
              }}
            >
              Assignment
            </Typography>
          </Box>

          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <Box
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                sx={{
                  minHeight: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: "12px",
                  borderBottom: "1px solid #e5e5e5",
                  color: isActive ? accentColor : "#c9c9c9",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "15px",
                  textAlign: "center",
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": {
                    color: accentColor,
                    bgcolor: "#fafafa",
                  },
                }}
              >
                {tab.label}
              </Box>
            );
          })}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              mb: "12px",
              minHeight: "34px",
            }}
          >
            <Button
              variant="outlined"
              sx={{
                minWidth: "112px",
                height: "34px",
                px: "14px",
                borderColor: "#c5c5c5",
                color: "#333333",
                fontSize: "15px",
                bgcolor: "#ffffff",
              }}
            >
              新增指派事項
            </Button>

            <Button
              variant="outlined"
              sx={{
                minWidth: "112px",
                height: "34px",
                px: "14px",
                borderColor: "#c5c5c5",
                color: "#333333",
                fontSize: "15px",
                bgcolor: "#ffffff",
              }}
            >
              下載勾選項目
            </Button>
          </Box>

          {loading ? (
            <Box
              sx={{
                minHeight: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #d3d3d3",
                bgcolor: "#ffffff",
              }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : (
            <DataTable
              columns={currentColumns}
              rows={currentRows}
              emptyText="查無資料"
              onRowClick={
                activeTab === "pending" ? handleOpenDetail : handleOpenReply
              }
            />
          )}

          <Box
            sx={{
              mt: "18px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Typography sx={{ fontSize: "15px", color: "#1f2f4a" }}>
              顯示 {currentRows.length === 0 ? 0 : 1} - {currentRows.length}{" "}
              筆，共 {currentRows.length} 筆
            </Typography>
          </Box>
        </Box>
      </Box>

      <TaskDialog
        open={detailOpen}
        row={detailRow}
        attachments={detailAttachments}
        replies={detailReplies}
        replyAttachmentsMap={replyAttachmentsMap}
        onClose={() => setDetailOpen(false)}
      />

      <ReplyDialog
        open={replyOpen}
        row={replyRow}
        submitting={submittingReply}
        onClose={() => setReplyOpen(false)}
        onSubmit={handleSubmitReply}
      />
    </Box>
  );
}
