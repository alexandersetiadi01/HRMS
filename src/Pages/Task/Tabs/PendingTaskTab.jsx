import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Box, CircularProgress } from "@mui/material";
import {
  fetchPendingTaskAssignments,
  fetchTaskReplies,
} from "../../../API/task";
import TaskTable from "../TaskTable";
import { downloadExcelFile, formatDateTime } from "../taskUtils";

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
  {
    key: "selected",
    label: "選取",
    width: "80px",
    align: "center",
    type: "checkbox",
  },
];

function getEmployeeLabel(employeeId, rows) {
  const matchedRow = rows.find(
    (row) => Number(row.employee_id) === Number(employeeId),
  );

  if (!matchedRow) {
    return String(employeeId || "");
  }

  return `${matchedRow.employee_id || employeeId} ${
    matchedRow.display_name || ""
  }`.trim();
}

const PendingTaskTab = forwardRef(function PendingTaskTab(
  { employeeId, active, onOpenDetail, onRowsChange },
  ref,
) {
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadRows = useCallback(async () => {
    if (!employeeId) {
      setRows([]);
      setSelectedIds([]);
      setHasLoaded(true);
      onRowsChange?.(0);
      return;
    }

    setLoading(true);

    try {
      const data = await fetchPendingTaskAssignments(employeeId);
      const nextRows = Array.isArray(data) ? data : [];

      setRows(nextRows);
      setHasLoaded(true);
      onRowsChange?.(nextRows.length);
    } catch (error) {
      console.error("Failed to load pending tasks:", error);
      setRows([]);
      setSelectedIds([]);
      setHasLoaded(true);
      onRowsChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [employeeId, onRowsChange]);

  useEffect(() => {
    if (!active || hasLoaded) return;

    loadRows();
  }, [active, hasLoaded, loadRows]);

  const mappedRows = useMemo(() => {
    return rows.map((row) => {
      return {
        ...row,
        id: row.task_assignee_id,
        status: row.assigned_status || row.task_status || "-",
        title: row.title || "-",
        assigner: row.creator_display_name || "-",
        handoverTarget: row.display_name || "-",
        deadline: formatDateTime(row.due_date),
      };
    });
  }, [rows]);

  useEffect(() => {
    onRowsChange?.(mappedRows.length);
  }, [mappedRows.length, onRowsChange]);

  const toggleSelected = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleDownloadSelected = useCallback(async () => {
    const selectedRows = mappedRows.filter((row) => selectedIds.includes(row.id));

    if (selectedRows.length === 0) {
      alert("請先勾選要下載的項目。");
      return;
    }

    const rowsWithReplies = await Promise.all(
      selectedRows.map(async (row) => {
        try {
          const replies = await fetchTaskReplies(row.task_id, employeeId);

          const replyText = Array.isArray(replies)
            ? replies
                .map((reply) => {
                  return `${formatDateTime(reply.reply_date)} / ${
                    reply.reply_status || "-"
                  } / ${reply.reply_content || "-"}`;
                })
                .join("\n")
            : "-";

          return {
            ...row,
            replyText,
          };
        } catch {
          return {
            ...row,
            replyText: "-",
          };
        }
      }),
    );

    const employeeLabel = getEmployeeLabel(employeeId, rows);
    downloadExcelFile(`${employeeLabel} - 指派事項.xls`, rowsWithReplies);
  }, [employeeId, mappedRows, rows, selectedIds]);

  useImperativeHandle(ref, () => ({
    reload: loadRows,
    downloadSelected: handleDownloadSelected,
    getRowsCount: () => mappedRows.length,
  }));

  if (loading) {
    return (
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
    );
  }

  return (
    <TaskTable
      columns={pendingColumns}
      rows={mappedRows}
      emptyText="查無資料"
      selectedIds={selectedIds}
      onToggleSelected={toggleSelected}
      onRowClick={onOpenDetail}
    />
  );
});

export default PendingTaskTab;