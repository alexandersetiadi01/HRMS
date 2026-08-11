import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ToggleOffOutlinedIcon from "@mui/icons-material/ToggleOffOutlined";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";

import {
  apiCreateLeaveType,
  apiDeleteLeaveType,
  apiLeaveTypes,
  apiUpdateLeaveType,
  apiUpdateLeaveTypeStatus,
} from "../../../../API/attendance";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";

const INITIAL_FILTERS = {
  keyword: "",
  leave_category: "",
  status: "",
};

const INITIAL_FORM = {
  leave_code: "",
  leave_name: "",
  leave_category: "一般",
  paid_type: "不支薪",
  is_unlimited_balance: "0",
};

const CATEGORY_OPTIONS = [
  { value: "", label: "全部分類" },
  { value: "一般", label: "一般" },
  { value: "特殊", label: "特殊" },
];

const STATUS_OPTIONS = [
  { value: "", label: "全部狀態" },
  { value: "啟用", label: "啟用" },
  { value: "停用", label: "停用" },
];

const PAID_TYPE_OPTIONS = [
  { value: "支薪", label: "支薪" },
  { value: "不支薪", label: "不支薪" },
  { value: "半薪", label: "半薪" },
  { value: "依假別", label: "依假別" },
];

const UNLIMITED_BALANCE_OPTIONS = [
  { value: "0", label: "否" },
  { value: "1", label: "是" },
];

const TABLE_COLUMNS = [
  { key: "leave_code", label: "假別代碼", width: "1fr" },
  { key: "leave_name", label: "假別名稱", width: "1.3fr" },
  { key: "leave_category", label: "分類", width: "1fr" },
  { key: "paid_type", label: "支薪方式", width: "1fr" },
  { key: "unlimited_balance", label: "無餘額限制", width: "1fr" },
  { key: "status", label: "狀態", width: "1fr" },
  { key: "actions", label: "操作", width: "120px" },
];

function getItems(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

export default function LeaveTypesTab() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrorText, setFormErrorText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });
  const [actionRow, setActionRow] = useState(null);
  const [actionType, setActionType] = useState("");

  const displayRows = useMemo(() => {
    const keyword = String(appliedFilters.keyword || "")
      .trim()
      .toLowerCase();

    return rows
      .map((row) => ({
        ...row,
        unlimited_balance:
          Number(row.is_unlimited_balance || 0) === 1 ? "是" : "否",
      }))
      .filter((row) => {
        if (
          appliedFilters.leave_category &&
          String(row.leave_category || "") !== appliedFilters.leave_category
        ) {
          return false;
        }

        if (
          appliedFilters.status &&
          String(row.status || "") !== appliedFilters.status
        ) {
          return false;
        }

        if (keyword) {
          const searchable = [
            row.leave_code,
            row.leave_name,
            row.leave_category,
            row.paid_type,
          ]
            .map((value) => String(value || "").toLowerCase())
            .join(" ");

          if (!searchable.includes(keyword)) {
            return false;
          }
        }

        return true;
      });
  }, [rows, appliedFilters]);

  const loadRows = useCallback(async () => {
    const result = await apiLeaveTypes();
    setRows(getItems(result));
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorText("");

      try {
        await loadRows();
      } catch (error) {
        console.error(error);

        if (active) {
          setRows([]);
          setErrorText("無法載入假別資料。");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [loadRows]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSearch = async () => {
    setLoading(true);
    setErrorText("");

    try {
      setAppliedFilters(filters);
      await loadRows();
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入假別資料。");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setLoading(true);
    setErrorText("");

    try {
      await loadRows();
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入假別資料。");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRow(null);
    setForm(INITIAL_FORM);
    setFormErrorText("");
    setFormOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditingRow(row);
    setForm({
      leave_code: row.leave_code || "",
      leave_name: row.leave_name || "",
      leave_category: row.leave_category || "一般",
      paid_type: row.paid_type || "不支薪",
      is_unlimited_balance:
        Number(row.is_unlimited_balance || 0) === 1 ? "1" : "0",
    });
    setFormErrorText("");
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (submitting) return;

    setFormOpen(false);
    setEditingRow(null);
    setForm(INITIAL_FORM);
    setFormErrorText("");
  };

  const handleFormChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const leaveCode = form.leave_code.trim();
    const leaveName = form.leave_name.trim();

    if (!leaveCode) {
      setFormErrorText("請輸入假別代碼。");
      return;
    }

    if (!leaveName) {
      setFormErrorText("請輸入假別名稱。");
      return;
    }

    const payload = {
      leave_code: leaveCode,
      leave_name: leaveName,
      leave_category: form.leave_category,
      paid_type: form.paid_type,
      is_unlimited_balance: form.is_unlimited_balance === "1" ? 1 : 0,
    };

    setSubmitting(true);
    setFormErrorText("");

    try {
      if (editingRow) {
        await apiUpdateLeaveType(editingRow.leave_type_id, payload);
      } else {
        await apiCreateLeaveType(payload);
      }

      const editing = Boolean(editingRow);

      setFormOpen(false);
      setEditingRow(null);
      setForm(INITIAL_FORM);
      await loadRows();

      setSuccessDialog({
        open: true,
        title: editing ? "更新成功" : "新增成功",
        message: editing
          ? "假別資料已成功更新。"
          : "假別資料已成功新增。",
      });
    } catch (error) {
      console.error(error);
      setFormErrorText(
        error?.response?.data?.message ||
          (editingRow ? "更新假別失敗。" : "新增假別失敗。"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openActionDialog = (row, type) => {
    setActionRow(row);
    setActionType(type);
  };

  const closeActionDialog = () => {
    if (submitting) return;

    setActionRow(null);
    setActionType("");
  };

  const handleActionSubmit = async () => {
    const leaveTypeId = Number(actionRow?.leave_type_id || 0);

    if (leaveTypeId <= 0 || !actionType) {
      return;
    }

    setSubmitting(true);
    setErrorText("");

    try {
      if (actionType === "enable") {
        await apiUpdateLeaveTypeStatus(leaveTypeId, "啟用");
      } else if (actionType === "disable") {
        await apiUpdateLeaveTypeStatus(leaveTypeId, "停用");
      } else if (actionType === "delete") {
        await apiDeleteLeaveType(leaveTypeId);
      }

      const completedAction = actionType;

      setActionRow(null);
      setActionType("");
      await loadRows();

      setSuccessDialog({
        open: true,
        title:
          completedAction === "enable"
            ? "啟用成功"
            : completedAction === "disable"
              ? "停用成功"
              : "刪除成功",
        message:
          completedAction === "enable"
            ? "假別已成功啟用。"
            : completedAction === "disable"
              ? "假別已成功停用。"
              : "假別已成功刪除。",
      });
    } catch (error) {
      console.error(error);
      setErrorText(
        error?.response?.data?.message ||
          (actionType === "delete"
            ? "刪除假別失敗。"
            : "更新假別狀態失敗。"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderTableValue = (row, column) => {
    if (column.key === "actions") {
      const enabled = row.status === "啟用";

      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <Tooltip title="編輯">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {enabled ? (
            <Tooltip title="停用">
              <IconButton
                size="small"
                onClick={() => openActionDialog(row, "disable")}
              >
                <ToggleOffOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="啟用">
              <IconButton
                size="small"
                onClick={() => openActionDialog(row, "enable")}
              >
                <ToggleOnOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="刪除">
            <IconButton
              size="small"
              onClick={() => openActionDialog(row, "delete")}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }

    return row[column.key] || "-";
  };

  return (
    <Box>
      <Box
        sx={{
          mb: "18px",
          display: "flex",
          alignItems: { xs: "stretch", sm: "flex-start" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: "12px",
        }}
      >
        <Box>
          <Typography
            sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}
          >
            假別名稱維護
          </Typography>

          <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
            管理 Attendance 使用的假別名稱及基本設定
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          新增假別
        </Button>
      </Box>

      <Box sx={{ mb: "18px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
            },
            gap: "14px",
            alignItems: "end",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              關鍵字
            </Typography>

            <TextField
              value={filters.keyword}
              onChange={(event) =>
                handleFilterChange("keyword", event.target.value)
              }
              placeholder="假別代碼或名稱"
              fullWidth
              size="small"
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              分類
            </Typography>

            <SelectField
              value={filters.leave_category}
              onChange={(value) =>
                handleFilterChange("leave_category", value)
              }
              options={CATEGORY_OPTIONS}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              狀態
            </Typography>

            <SelectField
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              options={STATUS_OPTIONS}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>
        </Box>

        <Box sx={{ mt: "14px", display: "flex", justifyContent: "flex-end" }}>
          <ActionButtons
            onClear={handleClear}
            onSearch={handleSearch}
            disabled={loading}
          />
        </Box>
      </Box>

      {errorText ? (
        <Alert severity="error" sx={{ mb: "14px" }}>
          {errorText}
        </Alert>
      ) : null}

      <Box sx={{ position: "relative" }}>
        {loading ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "140px",
              bgcolor: "rgba(255, 255, 255, 0.72)",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : null}

        <ResponsiveAttendanceTable
          columns={TABLE_COLUMNS}
          rows={displayRows}
          getRowKey={(row) => row.leave_type_id}
          mobileCardTitleKey="leave_name"
          emptyText="查無假別資料"
          desktopMinWidth="840px"
          renderValue={renderTableValue}
          pagination
          rowsPerPage={10}
        />
      </Box>

      <FormDialog
        open={formOpen}
        title={editingRow ? "編輯假別" : "新增假別"}
        submitLabel={editingRow ? "更新" : "新增"}
        submitting={submitting}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      >
        {formErrorText ? (
          <Alert severity="error">
            {formErrorText}
          </Alert>
        ) : null}

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            假別代碼
          </Typography>

          <TextField
            value={form.leave_code}
            onChange={(event) =>
              handleFormChange("leave_code", event.target.value)
            }
            placeholder="請輸入假別代碼"
            fullWidth
            size="small"
            disabled={submitting}
          />
        </Box>

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            假別名稱
          </Typography>

          <TextField
            value={form.leave_name}
            onChange={(event) =>
              handleFormChange("leave_name", event.target.value)
            }
            placeholder="請輸入假別名稱"
            fullWidth
            size="small"
            disabled={submitting}
          />
        </Box>

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            假別分類
          </Typography>

          <SelectField
            value={form.leave_category}
            onChange={(value) =>
              handleFormChange("leave_category", value)
            }
            options={CATEGORY_OPTIONS.filter((item) => item.value)}
            fullWidth
            height="38px"
            disabled={submitting}
          />
        </Box>

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            支薪方式
          </Typography>

          <SelectField
            value={form.paid_type}
            onChange={(value) => handleFormChange("paid_type", value)}
            options={PAID_TYPE_OPTIONS}
            fullWidth
            height="38px"
            disabled={submitting}
          />
        </Box>

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            無餘額限制
          </Typography>

          <SelectField
            value={form.is_unlimited_balance}
            onChange={(value) =>
              handleFormChange("is_unlimited_balance", value)
            }
            options={UNLIMITED_BALANCE_OPTIONS}
            fullWidth
            height="38px"
            disabled={submitting}
          />

          <Typography sx={{ mt: "6px", fontSize: "13px", color: "#6b7280" }}>
            設定為「是」時，此假別不需要設定請假餘額，也不會扣除剩餘時數。
          </Typography>
        </Box>
      </FormDialog>

      <FormDialog
        open={Boolean(actionRow)}
        title={
          actionType === "enable"
            ? "確認啟用"
            : actionType === "disable"
              ? "確認停用"
              : "確認刪除"
        }
        submitLabel={
          actionType === "enable"
            ? "啟用"
            : actionType === "disable"
              ? "停用"
              : "刪除"
        }
        cancelLabel="取消"
        maxWidth="xs"
        submitting={submitting}
        onClose={closeActionDialog}
        onSubmit={handleActionSubmit}
      >
        <Typography
          sx={{ fontSize: "15px", color: "#374151", lineHeight: 1.7 }}
        >
          {actionType === "enable"
            ? `確認啟用「${actionRow?.leave_name || ""}」？`
            : actionType === "disable"
              ? `確認停用「${actionRow?.leave_name || ""}」？停用後將不再提供新的請假申請使用。`
              : `確認刪除「${actionRow?.leave_name || ""}」？已有規則、額度或申請紀錄的假別無法刪除。`}
        </Typography>
      </FormDialog>

      <SuccessDialog
        open={successDialog.open}
        title={successDialog.title}
        message={successDialog.message}
        onClose={() =>
          setSuccessDialog({
            open: false,
            title: "",
            message: "",
          })
        }
      />
    </Box>
  );
}