import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InternalModule from "../../Components/InternalModule";
import {
  createStickyNote,
  deleteStickyNote,
  fetchStickyNoteEmployees,
  fetchStickyNotes,
  markStickyNoteRead,
} from "../../API/stickyNote";
import NoteCreateDialog from "./Dialog/NoteCreateDialog";
import RecipientSelectDialog from "./Dialog/RecipientSelectDialog";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

const ACCENT_COLOR = "#f45a4d";

function normalizeEmployee(row) {
  return {
    employee_id: Number(row?.employee_id || row?.id || 0),
    employee_no: row?.employee_no || row?.employee_code || "",
    display_name: row?.display_name || row?.name || row?.employee_name || "",
    department_name: row?.department_name || row?.unit_name || "",
  };
}

function getEmployeeName(employee) {
  return (
    employee?.display_name || employee?.name || employee?.employee_name || "-"
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  const text = String(value).replace("T", " ");
  return text.length >= 16 ? text.slice(0, 16) : text;
}

function stripEmployeeNoList(value) {
  if (!value) return "-";

  return String(value)
    .split("、")
    .map((item) => {
      const parts = item.trim().split(/\s+/);
      return parts.length > 1 ? parts.slice(1).join(" ") : item.trim();
    })
    .filter(Boolean)
    .join("、");
}

function normalizeStickyRow(row) {
  return {
    ...row,
    sender_display_name: row.sender_name || row.sender_display_name || "",
    receiver_display_name: row.receiver_name || row.receiver_display_name || "",
    receiver_names: row.receiver_names || row.receiver_name || "",
    note_created_at: row.note_created_at || row.created_at || "",
  };
}

function StatusBox({ status }) {
  const label = status || "-";
  const background =
    label === "未讀" ? "#ef4444" : label === "已讀" ? "#9ca3af" : "#2563eb";

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "52px",
        height: "18px",
        px: "8px",
        borderRadius: "2px",
        bgcolor: background,
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {label}
    </Box>
  );
}

function DeleteIconButton({ row, box, onDelete }) {
  return (
    <IconButton
      size="small"
      onClick={(event) => {
        event.stopPropagation();
        onDelete(row, box);
      }}
      sx={{ p: 0, color: "#8a8a8a" }}
    >
      <DeleteOutlineIcon sx={{ fontSize: "20px" }} />
    </IconButton>
  );
}

function ViewIconButton({ row, onView }) {
  return (
    <IconButton
      size="small"
      onClick={(event) => {
        event.stopPropagation();
        onView(row);
      }}
      sx={{ p: 0, color: "#8a8a8a" }}
    >
      <VisibilityOutlinedIcon sx={{ fontSize: "20px" }} />
    </IconButton>
  );
}

function ActionButtons({ row, box, onView, onDelete }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      {box === "received" ? <ViewIconButton row={row} onView={onView} /> : null}

      <DeleteIconButton row={row} box={box} onDelete={onDelete} />
    </Box>
  );
}

function NoteDetailDialog({ open, row, onClose }) {
  if (!row) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "390px",
          maxWidth: "calc(100vw - 32px)",
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
          便利貼
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

      <DialogContent sx={{ px: "16px", py: "14px" }}>
        <Box sx={{ display: "grid", rowGap: "14px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Typography sx={{ fontSize: "15px", color: "#555555" }}>
              寄件人：
            </Typography>

            <Box
              sx={{
                bgcolor: "#3b82c4",
                color: "#ffffff",
                px: "10px",
                py: "5px",
                borderRadius: "3px",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              {row.sender_display_name || row.sender_name || "-"}
            </Box>
          </Box>

          <Typography sx={{ fontSize: "15px", color: "#555555" }}>
            日期：{formatDateTime(row.note_created_at || row.created_at)}
          </Typography>

          <Typography sx={{ fontSize: "15px", color: "#555555" }}>
            內容：
          </Typography>

          <Box
            sx={{
              border: "1px solid #d8d8d8",
              bgcolor: "#f7f7f7",
              borderRadius: "4px",
              p: "14px",
              minHeight: "220px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: "15px",
              lineHeight: 1.7,
              color: "#444444",
            }}
          >
            {row.content || "-"}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function StickyNotes() {
  const [receivedRows, setReceivedRows] = useState([]);
  const [sentRows, setSentRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [moduleVersion, setModuleVersion] = useState(0);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return (
        window.sessionStorage.getItem("sticky-note-active-tab") || "received"
      );
    } catch {
      return "received";
    }
  });

  const handleSidebarChange = (nextTab) => {
    setActiveTab(nextTab);

    try {
      window.sessionStorage.setItem("sticky-note-active-tab", nextTab);
    } catch {
      //
    }
  };

  const [detailDialog, setDetailDialog] = useState({
    open: false,
    row: null,
  });

  const handleOpenDetail = async (row) => {
    if (!row) return;

    setDetailDialog({
      open: true,
      row,
    });

    if (row.status === "未讀" && row.sticky_note_id) {
      try {
        await markStickyNoteRead(row.sticky_note_id);
        await loadStickyNotes();
      } catch (error) {
        showSnackbar(error?.message || "更新便利貼狀態失敗。", "error");
      }
    }
  };

  const handleCloseDetail = () => {
    setDetailDialog({
      open: false,
      row: null,
    });
  };

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    row: null,
    box: "",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const loadStickyNotes = useCallback(async () => {
    setLoading(true);

    try {
      const [receivedResult, sentResult] = await Promise.all([
        fetchStickyNotes({ box: "received" }),
        fetchStickyNotes({ box: "sent" }),
      ]);

      setReceivedRows(
        (Array.isArray(receivedResult) ? receivedResult : []).map(
          normalizeStickyRow,
        ),
      );

      setSentRows(
        (Array.isArray(sentResult) ? sentResult : []).map(normalizeStickyRow),
      );

      setModuleVersion((prev) => prev + 1);
    } catch (error) {
      showSnackbar(error?.message || "讀取便利貼失敗。", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const result = await fetchStickyNoteEmployees();
      const normalized = (Array.isArray(result) ? result : [])
        .map(normalizeEmployee)
        .filter((employee) => employee.employee_id > 0);

      setEmployees(normalized);
    } catch {
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    loadStickyNotes();
    loadEmployees();
  }, [loadStickyNotes, loadEmployees]);

  const handleSubmitStickyNote = async ({ content }) => {
    const receiverIds = selectedRecipients
      .map((employee) => Number(employee.employee_id))
      .filter((id) => id > 0);

    if (receiverIds.length === 0) {
      showSnackbar("請選擇收件人。", "error");
      return;
    }

    setSubmitting(true);

    try {
      await createStickyNote({
        receiver_employee_ids: receiverIds,
        content,
      });

      setCreateOpen(false);
      setSelectedRecipients([]);
      await loadStickyNotes();
      showSnackbar("便利貼已成功送出。", "success");
    } catch (error) {
      showSnackbar(error?.message || "送出便利貼失敗。", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkRead = async (row) => {
    if (!row?.sticky_note_id || row.status !== "未讀") return;

    try {
      await markStickyNoteRead(row.sticky_note_id);
      await loadStickyNotes();
    } catch (error) {
      showSnackbar(error?.message || "更新便利貼狀態失敗。", "error");
    }
  };

  const handleOpenDeleteDialog = (row, box) => {
    setDeleteDialog({
      open: true,
      row,
      box,
    });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      row: null,
      box: "",
    });
  };

  const handleConfirmDelete = async () => {
    const row = deleteDialog.row;
    const box = deleteDialog.box;

    if (!row?.sticky_note_id) {
      handleCloseDeleteDialog();
      return;
    }

    try {
      await deleteStickyNote(row.sticky_note_id, box);
      handleCloseDeleteDialog();
      await loadStickyNotes();
      showSnackbar("便利貼已成功刪除。", "success");
    } catch (error) {
      handleCloseDeleteDialog();
      showSnackbar(error?.message || "刪除便利貼失敗。", "error");
    }
  };

  const receivedColumns = useMemo(
    () => [
      {
        key: "status",
        label: "狀態",
        width: "90px",
        align: "center",
        withDivider: true,
      },
      { key: "content", label: "內容", width: "1fr", withDivider: true },
      {
        key: "sender",
        label: "寄件人",
        width: "120px",
        align: "center",
        withDivider: true,
      },
      {
        key: "action",
        label: "操作",
        width: "80px",
        align: "center",
        withDivider: true,
      },
      { key: "time", label: "時間", width: "160px", align: "center" },
    ],
    [],
  );

  const sentColumns = useMemo(
    () => [
      {
        key: "status",
        label: "狀態",
        width: "90px",
        align: "center",
        withDivider: true,
      },
      { key: "content", label: "內容", width: "1fr", withDivider: true },
      {
        key: "receiver",
        label: "收件人",
        width: "180px",
        align: "center",
        withDivider: true,
      },
      {
        key: "action",
        label: "操作",
        width: "80px",
        align: "center",
        withDivider: true,
      },
      { key: "time", label: "時間", width: "160px", align: "center" },
    ],
    [],
  );

  const receivedTableRows = useMemo(() => {
    return receivedRows.map((row, index) => ({
      id: `received-${row.sticky_note_recipient_id || row.sticky_note_id || index}`,
      hoverBg: "#f3f4f6",
      status: <StatusBox status={row.status} />,
      content: row.content || "-",
      sender: row.sender_display_name || row.sender_name || "-",
      action: (
        <ActionButtons
          row={row}
          box="received"
          onView={handleOpenDetail}
          onDelete={handleOpenDeleteDialog}
        />
      ),
      time: formatDateTime(row.note_created_at || row.created_at),
      raw: row,
    }));
  }, [receivedRows]);

  const sentTableRows = useMemo(() => {
    return sentRows.map((row, index) => ({
      id: `sent-${row.sticky_note_id || index}`,
      hoverBg: "#f3f4f6",

      status: <StatusBox status={row.status || "已送出"} />,

      content: row.content || "-",

      receiver: stripEmployeeNoList(
        row.receiver_names || row.receiver_display_name,
      ),

      action: (
        <ActionButtons
          row={row}
          box="sent"
          onView={handleOpenDetail}
          onDelete={handleOpenDeleteDialog}
        />
      ),

      time: formatDateTime(row.created_at),

      raw: row,
    }));
  }, [sentRows]);

  const sidebarItems = useMemo(
    () => [
      {
        key: "received",
        label: "收件紀錄",
        columns: receivedColumns,
        rows: receivedTableRows,
        emptyText: loading ? "讀取中..." : "查無資料",
      },
      {
        key: "sent",
        label: "發送紀錄",
        columns: sentColumns,
        rows: sentTableRows,
        emptyText: loading ? "讀取中..." : "查無資料",
      },
    ],
    [loading, receivedColumns, receivedTableRows, sentColumns, sentTableRows],
  );

  return (
    <>
      <InternalModule
        activeSidebarKey={activeTab}
        onSidebarChange={handleSidebarChange}
        rowsVersion={moduleVersion}
        title="便利貼"
        accentColor={ACCENT_COLOR}
        sidebarTitle="NOTE"
        defaultSidebarKey="received"
        sidebarItems={sidebarItems}
        actionButtons={[
          {
            label: "新增便利貼",
            minWidth: "110px",
            onClick: () => {
              setSelectedRecipients([]);
              setCreateOpen(true);
            },
          },
        ]}
        columns={receivedColumns}
        rows={receivedTableRows}
        emptyText={loading ? "讀取中..." : "查無資料"}
      />

      <NoteCreateDialog
        open={createOpen}
        selectedRecipients={selectedRecipients}
        submitting={submitting}
        onClose={() => {
          if (submitting) return;
          setCreateOpen(false);
          setSelectedRecipients([]);
        }}
        onOpenRecipient={() => setRecipientOpen(true)}
        onSubmit={handleSubmitStickyNote}
        getEmployeeLabel={getEmployeeName}
      />

      <RecipientSelectDialog
        open={recipientOpen}
        employees={employees}
        selectedRecipients={selectedRecipients}
        onClose={() => setRecipientOpen(false)}
        onConfirm={(recipients) => {
          setSelectedRecipients(recipients);
          setRecipientOpen(false);
        }}
        getEmployeeLabel={getEmployeeName}
      />

      <Dialog open={deleteDialog.open} onClose={handleCloseDeleteDialog}>
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "15px" }}>
            確定要刪除這張便利貼嗎？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>取消</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
          >
            刪除
          </Button>
        </DialogActions>
      </Dialog>

      <NoteDetailDialog
        open={detailDialog.open}
        row={detailDialog.row}
        onClose={handleCloseDetail}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
