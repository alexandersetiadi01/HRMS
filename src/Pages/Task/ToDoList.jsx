import { useCallback, useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import Breadcrumb from "../../Utils/Breadcrumb";
import { getCurrentEmployeeId } from "../../API/account";
import {
  fetchReplyAttachments,
  fetchTaskAttachments,
  fetchTaskReplies,
} from "../../API/task";

import PendingTaskTab from "./Tabs/PendingTaskTab";
import AssignedTaskTab from "./Tabs/AssignedTaskTab";

import TaskDetailDialog from "./dialogs/TaskDetailDialog";
import TaskReplyDialog from "./dialogs/TaskReplyDialog";
import TaskCreateAssignDialog from "./dialogs/TaskCreateAssignDialog";

const accentColor = "#677986";

const tabs = [
  { key: "pending", label: "待辦事項" },
  { key: "assigned", label: "指派事項" },
];

export default function TodoList() {
  const employeeId = Number(getCurrentEmployeeId() || 0);

  const pendingRef = useRef(null);
  const assignedRef = useRef(null);

  const [activeTab, setActiveTab] = useState("pending");

  const [pendingCount, setPendingCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [detailAttachments, setDetailAttachments] = useState([]);
  const [detailReplies, setDetailReplies] = useState([]);
  const [replyAttachmentsMap, setReplyAttachmentsMap] = useState({});

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyRow, setReplyRow] = useState(null);

  const [createAssignOpen, setCreateAssignOpen] = useState(false);

  const currentRowsCount =
    activeTab === "pending" ? pendingCount : assignedCount;

  const handleDownloadSelected = () => {
    if (activeTab === "pending") {
      pendingRef.current?.downloadSelected();
      return;
    }

    assignedRef.current?.downloadSelected();
  };

  const handleOpenDetail = useCallback(
    async (row) => {
      setDetailRow(row);
      setDetailAttachments([]);
      setDetailReplies([]);
      setReplyAttachmentsMap({});
      setDetailOpen(true);

      try {
        const [attachments, replies] = await Promise.all([
          fetchTaskAttachments(row.task_id),
          fetchTaskReplies(row.task_id, employeeId),
        ]);

        const taskAttachments = Array.isArray(attachments)
          ? attachments.filter((item) => !item.task_reply_id)
          : [];

        const replyRows = Array.isArray(replies) ? replies : [];

        setDetailAttachments(taskAttachments);
        setDetailReplies(replyRows);

        const replyAttachmentPairs = await Promise.all(
          replyRows.map(async (reply) => {
            try {
              const replyAttachments = await fetchReplyAttachments(
                reply.task_reply_id,
              );

              return [
                String(reply.task_reply_id),
                Array.isArray(replyAttachments) ? replyAttachments : [],
              ];
            } catch {
              return [String(reply.task_reply_id), []];
            }
          }),
        );

        setReplyAttachmentsMap(Object.fromEntries(replyAttachmentPairs));
      } catch (error) {
        console.error("Failed to load task detail:", error);
      }
    },
    [employeeId],
  );

  const handleOpenReply = (row) => {
    setReplyRow(row);
    setReplyOpen(true);
  };

  const handleReloadCurrentTab = () => {
    if (activeTab === "pending") {
      pendingRef.current?.reload();
      return;
    }

    assignedRef.current?.reload();
  };

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
              onClick={() => setCreateAssignOpen(true)}
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
              onClick={handleDownloadSelected}
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

          {activeTab === "pending" && (
            <PendingTaskTab
              ref={pendingRef}
              employeeId={employeeId}
              active={activeTab === "pending"}
              onOpenDetail={handleOpenDetail}
              onRowsChange={setPendingCount}
            />
          )}

          {activeTab === "assigned" && (
            <AssignedTaskTab
              ref={assignedRef}
              employeeId={employeeId}
              active={activeTab === "assigned"}
              onOpenReply={handleOpenReply}
              onRowsChange={setAssignedCount}
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
              顯示 {currentRowsCount === 0 ? 0 : 1} - {currentRowsCount} 筆，共{" "}
              {currentRowsCount} 筆
            </Typography>
          </Box>
        </Box>
      </Box>

      <TaskDetailDialog
        open={detailOpen}
        row={detailRow}
        attachments={detailAttachments}
        replies={detailReplies}
        replyAttachmentsMap={replyAttachmentsMap}
        onClose={() => setDetailOpen(false)}
      />

      <TaskReplyDialog
        open={replyOpen}
        row={replyRow}
        employeeId={employeeId}
        onClose={() => setReplyOpen(false)}
        onSubmitted={() => {
          handleReloadCurrentTab();
        }}
      />

      <TaskCreateAssignDialog
        open={createAssignOpen}
        employeeId={employeeId}
        onClose={() => setCreateAssignOpen(false)}
        onSuccess={() => {
          pendingRef.current?.reload();
          assignedRef.current?.reload();
        }}
      />
    </Box>
  );
}