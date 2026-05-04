import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const accentColor = "#677986";

export function formatDateTime(value) {
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

function getStatusColor(value) {
  switch (value) {
    case "未開始":
    case "待處理":
      return "#b8b8b8";

    case "已開始":
    case "進行中":
      return "#2563eb";

    case "已完成":
    case "準時":
      return "#16a34a";

    case "已結束":
      return "#111827";

    case "已取消":
      return "#9ca3af";

    case "已逾期":
    case "逾期":
      return "#dc2626";

    default:
      return "#b8b8b8";
  }
}

export function StatusPill({ value }) {
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
        bgcolor: getStatusColor(value),
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      {value || "-"}
    </Box>
  );
}

export function AttachmentLinks({ attachments }) {
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

function DialogHeader({ title, onClose, disabled = false }) {
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

      <IconButton
        onClick={onClose}
        size="small"
        disabled={disabled}
        sx={{ color: "#ffffff", p: 0 }}
      >
        <CloseIcon sx={{ fontSize: "18px" }} />
      </IconButton>
    </Box>
  );
}

export function TaskDetailDialog({
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

export function TaskReplyDialog({ open, row, submitting, onClose, onSubmit }) {
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
      <DialogHeader title="送出任務回覆" onClose={onClose} disabled={submitting} />

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

export function TaskCreateAssignDialog({
  open,
  employees,
  tasks,
  currentEmployeeId,
  submitting,
  onClose,
  onCreateTask,
  onAssignTask,
}) {
  const [activeTab, setActiveTab] = useState("create");

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    start_date: "",
    due_date: "",
  });

  const [assignForm, setAssignForm] = useState({
    task_id: "",
    employee_ids: [],
  });

  useEffect(() => {
    if (open) {
      setActiveTab("create");
      setCreateForm({
        title: "",
        description: "",
        start_date: "",
        due_date: "",
      });
      setAssignForm({
        task_id: "",
        employee_ids: [],
      });
    }
  }, [open]);

  const handleEmployeeToggle = (employeeId) => {
    setAssignForm((prev) => {
      const nextIds = prev.employee_ids.includes(employeeId)
        ? prev.employee_ids.filter((id) => id !== employeeId)
        : [...prev.employee_ids, employeeId];

      return {
        ...prev,
        employee_ids: nextIds,
      };
    });
  };

  const canCreate =
    createForm.title.trim() !== "" &&
    currentEmployeeId > 0 &&
    !submitting;

  const canAssign =
    Number(assignForm.task_id) > 0 &&
    assignForm.employee_ids.length > 0 &&
    !submitting;

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
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
      <DialogHeader title="新增指派事項" onClose={onClose} disabled={submitting} />

      <DialogContent sx={{ p: "16px" }}>
        <Box
          sx={{
            display: "flex",
            borderBottom: "1px solid #d7d7d7",
            mb: "16px",
          }}
        >
          {[
            { key: "create", label: "新增任務" },
            { key: "assign", label: "任務指派" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <Box
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                sx={{
                  px: "18px",
                  py: "10px",
                  border: "1px solid #d7d7d7",
                  borderBottom: isActive ? "1px solid #ffffff" : "1px solid #d7d7d7",
                  bgcolor: isActive ? "#ffffff" : "#f3f4f6",
                  color: isActive ? "#111827" : "#6b7280",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  transform: "translateY(1px)",
                }}
              >
                {tab.label}
              </Box>
            );
          })}
        </Box>

        {activeTab === "create" ? (
          <Box>
            <TextField
              label="任務標題"
              value={createForm.title}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, title: event.target.value }))
              }
              fullWidth
              size="small"
              sx={{ mb: "14px" }}
            />

            <TextField
              label="任務內容"
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              fullWidth
              multiline
              minRows={5}
              sx={{ mb: "14px" }}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <TextField
                label="開始時間"
                type="datetime-local"
                value={createForm.start_date}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    start_date: event.target.value,
                  }))
                }
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="截止時間"
                type="datetime-local"
                value={createForm.due_date}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    due_date: event.target.value,
                  }))
                }
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
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
                disabled={!canCreate}
                onClick={() => onCreateTask(createForm)}
                sx={{
                  bgcolor: accentColor,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: accentColor,
                    boxShadow: "none",
                  },
                }}
              >
                {submitting ? "儲存中..." : "新增任務"}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <TextField
              select
              label="任務"
              value={assignForm.task_id}
              onChange={(event) =>
                setAssignForm((prev) => ({
                  ...prev,
                  task_id: event.target.value,
                }))
              }
              fullWidth
              size="small"
              sx={{ mb: "14px" }}
            >
              <MenuItem value="">請選擇任務</MenuItem>
              {tasks.map((task) => (
                <MenuItem key={task.task_id} value={task.task_id}>
                  #{task.task_id} - {task.title}
                </MenuItem>
              ))}
            </TextField>

            <Typography sx={{ fontSize: "14px", fontWeight: 700, mb: "8px" }}>
              指派員工
            </Typography>

            <Box
              sx={{
                maxHeight: "260px",
                overflowY: "auto",
                border: "1px solid #d7d7d7",
                borderRadius: "4px",
              }}
            >
              {employees.length === 0 ? (
                <Typography sx={{ fontSize: "14px", color: "#777777", p: "12px" }}>
                  目前沒有員工資料。
                </Typography>
              ) : (
                employees.map((employee) => {
                  const employeeId = Number(employee.employee_id);
                  const checked = assignForm.employee_ids.includes(employeeId);

                  return (
                    <Box
                      key={employee.employee_id}
                      onClick={() => handleEmployeeToggle(employeeId)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        px: "12px",
                        py: "8px",
                        borderBottom: "1px solid #eeeeee",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: "#fafafa",
                        },
                      }}
                    >
                      <input type="checkbox" checked={checked} readOnly />
                      <Typography sx={{ fontSize: "14px" }}>
                        {employee.display_name || employee.employee_name || "-"}
                      </Typography>
                    </Box>
                  );
                })
              )}
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
                disabled={!canAssign}
                onClick={() => onAssignTask(assignForm)}
                sx={{
                  bgcolor: accentColor,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: accentColor,
                    boxShadow: "none",
                  },
                }}
              >
                {submitting ? "指派中..." : "指派任務"}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}