import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import {
  apiApprovalAction,
  apiGetPendingApprovalActor,
  apiGetPendingApprovals,
} from "../../../API/attendance";
import {
  ActionButtons,
  FilterRow,
  SelectField,
} from "../AttendanceForm/ApplicationRecord/SharedFields";
import PendingApprovalDetailDialog from "./PendingApprovalDetailDialog";
import Breadcrumb from "../../../Utils/Breadcrumb";

const FORM_TYPE_OPTIONS = [
  { value: "all", label: "全部", disabled: false },
  { value: "missed_punch", label: "忘打卡", disabled: false },
  { value: "leave", label: "請假", disabled: false },
  { value: "leave_entitlement", label: "特殊假額度申請", disabled: false },
  { value: "leave_cancel", label: "請假撤銷", disabled: true },
  { value: "overtime", label: "加班", disabled: false },
  { value: "overtime_cancel", label: "加班撤銷", disabled: true },
  { value: "business_trip", label: "公出/出差", disabled: true },
  { value: "business_trip_cancel", label: "公出/出差撤銷", disabled: true },
];

const BATCH_BUTTON_SX = {
  minWidth: "78px",
  height: "30px",
  px: "14px",
  fontSize: "15px",
  fontWeight: 700,
  bgcolor: "#5b6478",
  color: "#fff",
  "&:hover": {
    bgcolor: "#4b5563",
  },
};

const ACTION_ICON_BUTTON_SX = {
  width: "30px",
  height: "30px",
  borderRadius: "4px",
  color: "#374151",
  "&:hover": {
    bgcolor: "#eef2f7",
  },
};

const SEARCH_INPUT_SX = {
  width: { xs: "100%", sm: "160px" },
  "& .MuiOutlinedInput-root": {
    height: "32px",
    bgcolor: "#fff",
  },
  "& .MuiOutlinedInput-input": {
    py: "6px",
    px: "10px",
    fontSize: "14px",
  },
};

function getErrorMessage(error, fallback = "操作失敗，請稍後再試。") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function getTypeFilterValue(formType) {
  if (!formType || formType === "all") {
    return undefined;
  }

  if (
    ["leave", "leave_entitlement", "overtime", "missed_punch"].includes(
      formType,
    )
  ) {
    return formType;
  }

  return undefined;
}

function getRowKey(row) {
  return `${row.type}-${row.id}`;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatDateOnly(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const normalized = raw.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    const plain = raw.slice(0, 10).replace(/-/g, "/");
    return plain || raw;
  }

  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
}

function formatTimeOnly(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const normalized = raw.replace(" ", "T");
  const date = new Date(normalized);

  if (!Number.isNaN(date.getTime())) {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }

  const match = raw.match(/(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }

  return "";
}

function formatDateTimeCompact(value) {
  const datePart = formatDateOnly(value);
  const timePart = formatTimeOnly(value);

  if (datePart && timePart) {
    return `${datePart} ${timePart}`;
  }

  return datePart || timePart || String(value || "").trim();
}

function formatDateTimeRange(startValue, endValue) {
  const startRaw = String(startValue || "").trim();
  const endRaw = String(endValue || "").trim();

  if (!startRaw && !endRaw) {
    return "";
  }

  if (!startRaw || !endRaw) {
    return formatDateTimeCompact(startRaw || endRaw);
  }

  const startDate = formatDateOnly(startRaw);
  const endDate = formatDateOnly(endRaw);
  const startTime = formatTimeOnly(startRaw);
  const endTime = formatTimeOnly(endRaw);

  if (startDate && endDate && startDate === endDate) {
    if (startTime && endTime) {
      return `${startDate} ${startTime} - ${endTime}`;
    }

    return `${startDate} ${startTime || endTime}`.trim();
  }

  return `${formatDateTimeCompact(startRaw)} - ${formatDateTimeCompact(endRaw)}`;
}

function formatMissedPunchContent(raw) {
  const requestType = String(raw?.request_punch_type || "").trim();
  const requestDatetime = String(raw?.request_datetime || "").trim();

  const typeLabel =
    requestType === "in" || requestType === "上班"
      ? "上班"
      : requestType === "out" || requestType === "下班"
        ? "下班"
        : "忘打卡";

  const dateTimeText = formatDateTimeCompact(requestDatetime);

  if (dateTimeText) {
    return `${typeLabel} - ${dateTimeText}`;
  }

  return typeLabel;
}

function formatLeaveEntitlementContent(raw) {
  const leaveName = String(
    raw?.leave_name || raw?.leave_type_name || "特殊假",
  ).trim();
  const relationType = String(
    raw?.relation_type || raw?.condition_value || raw?.condition_label || "",
  ).trim();
  const eventDate = formatDateOnly(raw?.event_date);
  const requestYear = String(raw?.request_year || "").trim();

  const leaveLabel = relationType
    ? `${leaveName} - ${relationType}`
    : leaveName;

  return [
    leaveLabel,
    eventDate ? `事件日期：${eventDate}` : "",
    requestYear ? `年度：${requestYear}` : "",
  ]
    .filter(Boolean)
    .join("｜");
}

function getReasonFromRaw(raw) {
  return String(raw?.reason || "").trim();
}

function getContentFromRaw(type, raw) {
  if (type === "leave" || type === "overtime") {
    return formatDateTimeRange(raw?.start_datetime, raw?.end_datetime);
  }

  if (type === "missed_punch") {
    return formatMissedPunchContent(raw);
  }

  if (type === "leave_entitlement") {
    return formatLeaveEntitlementContent(raw);
  }

  return "";
}

function mapItemsFromResponse(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : [];

  return items.map((item) => {
    const raw = item?.raw || {};

    return {
      ...item,
      raw,
      date: item?.request_date || "",
      applicant: item?.applicant || "",
      formType: item?.type_label || "",
      content: getContentFromRaw(item?.type, raw),
      reason: getReasonFromRaw(raw),
      status: item?.status || "",
      statusLabel: item?.status_label || "",
      searchText: [
        item?.request_date || "",
        item?.applicant || "",
        item?.type_label || "",
        getContentFromRaw(item?.type, raw),
        getReasonFromRaw(raw),
        raw?.leave_name || "",
        raw?.relation_type || "",
        raw?.event_date || "",
        raw?.request_year || "",
      ]
        .join(" ")
        .toLowerCase(),
    };
  });
}

export default function AttendancePendingApproval() {
  const [unit, setUnit] = useState("");
  const [employee, setEmployee] = useState("");
  const [formType, setFormType] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTrigger, setSearchTrigger] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rows, setRows] = useState([]);
  const [actor, setActor] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [errorText, setErrorText] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetRow, setDeleteTargetRow] = useState(null);

  const isEmployee = !!actor?.is_employee_position;

  const employeeOptions = useMemo(() => {
    if (isEmployee) {
      return [
        {
          value: actor?.employee_id
            ? String(actor.employee_id)
            : "self-employee",
          label: actor?.applicant_label || "-",
        },
      ];
    }

    const uniqueMap = new Map();
    rows.forEach((row) => {
      const id = String(row?.employee_id || "").trim();
      const label = String(row?.applicant || "").trim();

      if (id && label && !uniqueMap.has(id)) {
        uniqueMap.set(id, { value: id, label });
      }
    });

    return [{ value: "", label: "請選擇" }, ...Array.from(uniqueMap.values())];
  }, [actor, isEmployee, rows]);

  const filteredData = useMemo(() => {
    let list = [...rows];

    if (!isEmployee && employee) {
      list = list.filter((row) => String(row.employee_id) === String(employee));
    }

    if (formType && formType !== "all") {
      list = list.filter((row) => row.type === formType);
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      list = list.filter((row) => row.searchText.includes(keyword));
    }

    return list;
  }, [rows, isEmployee, employee, formType, searchKeyword]);

  const allIds = useMemo(
    () => filteredData.map((row) => getRowKey(row)),
    [filteredData],
  );

  const isAllChecked =
    filteredData.length > 0 && selectedIds.length === filteredData.length;
  const isIndeterminate =
    selectedIds.length > 0 && selectedIds.length < filteredData.length;

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorText("");

      const [actorResponse, approvalResponse] = await Promise.all([
        apiGetPendingApprovalActor(),
        apiGetPendingApprovals({
          type: getTypeFilterValue(formType),
        }),
      ]);

      const actorData =
        actorResponse?.data?.data || actorResponse?.data || actorResponse || {};

      const approvalData =
        approvalResponse?.data?.data ||
        approvalResponse?.data ||
        approvalResponse ||
        {};

      setActor(actorData);
      setRows(mapItemsFromResponse(approvalData));

      if (actorData?.is_employee_position) {
        setUnit(actorData.unit_id ? String(actorData.unit_id) : "self-unit");
        setEmployee(
          actorData.employee_id
            ? String(actorData.employee_id)
            : "self-employee",
        );
      }
    } catch (error) {
      console.error(error);
      setErrorText(getErrorMessage(error, "載入待審核資料失敗。"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTrigger]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => allIds.includes(id)));
  }, [allIds]);

  const handleSearch = () => {
    setSearchKeyword(searchText.trim());
    setSearchTrigger((prev) => prev + 1);
  };

  const handleClear = () => {
    if (isEmployee) {
      setFormType("all");
      setSearchText("");
      setSearchKeyword("");
      setSelectedIds([]);
      setSearchTrigger((prev) => prev + 1);
      return;
    }

    setUnit("");
    setEmployee("");
    setFormType("all");
    setSearchText("");
    setSearchKeyword("");
    setSelectedIds([]);
    setSearchTrigger((prev) => prev + 1);
  };

  const handleCheckAll = (checked) => {
    setSelectedIds(checked ? allIds : []);
  };

  const handleCheckOne = (rowKey, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, rowKey] : prev.filter((x) => x !== rowKey),
    );
  };

  const handleOpenDetail = (row) => {
    setActiveRow(row);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setActiveRow(null);
  };

  const handleRequestDelete = (row) => {
    if (!row?.id || !row?.type) {
      return;
    }

    setDeleteTargetRow(row);
    setConfirmDeleteOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setConfirmDeleteOpen(false);
    setDeleteTargetRow(null);
  };

  const executeDelete = async () => {
    if (!deleteTargetRow?.id || !deleteTargetRow?.type) {
      return;
    }

    try {
      setSubmitting(true);
      setErrorText("");

      await apiApprovalAction({
        type: deleteTargetRow.type,
        id: deleteTargetRow.id,
        action: "delete",
      });

      handleCloseDeleteConfirm();
      handleCloseDetail();
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      console.error(error);
      setErrorText(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (row, action) => {
    if (!row?.id || !row?.type || !action) {
      return;
    }

    if (action === "delete") {
      handleRequestDelete(row);
      return;
    }

    try {
      setSubmitting(true);
      setErrorText("");

      await apiApprovalAction({
        type: row.type,
        id: row.id,
        action,
      });

      handleCloseDetail();
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      console.error(error);
      setErrorText(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchApprove = async () => {
    if (isEmployee || selectedIds.length === 0) {
      return;
    }

    const selectedRows = filteredData.filter((row) =>
      selectedIds.includes(getRowKey(row)),
    );

    try {
      setSubmitting(true);
      setErrorText("");

      for (const row of selectedRows) {
        await apiApprovalAction({
          type: row.type,
          id: row.id,
          action: "approve",
        });
      }

      setSelectedIds([]);
      await loadData();
    } catch (error) {
      console.error(error);
      setErrorText(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const canDeleteRow = (row) => {
    if (!row) {
      return false;
    }

    if (isEmployee) {
      return Number(row.employee_id) === Number(actor?.employee_id);
    }

    return true;
  };

  const canApproveRow = (row) => {
    if (!row) {
      return false;
    }

    return !isEmployee;
  };

  const canRejectRow = (row) => {
    if (!row) {
      return false;
    }

    return !isEmployee;
  };

  return (
    <Box>
      <Breadcrumb rootLabel="首頁" currentLabel="待審核表單" mb="14px" />

      <Typography sx={{ fontSize: "18px", fontWeight: 700, mb: "10px" }}>
        待審核表單
      </Typography>

      <Box
        sx={{ border: "1px solid #9ca3af", p: "16px", position: "relative" }}
      >
        {loading || submitting ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(255,255,255,0.45)",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={26} />
          </Box>
        ) : null}

        {errorText ? (
          <Typography
            sx={{
              mb: "12px",
              color: "#dc2626",
              fontSize: "14px",
            }}
          >
            {errorText}
          </Typography>
        ) : null}

        <FilterRow withDivider>
          {!isEmployee ? (
            <SelectField
              label="工號/姓名"
              value={employee}
              onChange={setEmployee}
              options={employeeOptions}
            />
          ) : null}

          <SelectField
            label="表單類型"
            value={formType}
            onChange={setFormType}
            options={FORM_TYPE_OPTIONS}
          />

          <Box
            sx={{
              ml: { xs: 0, sm: "auto" },
              width: { xs: "100%", sm: "auto" },
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "stretch", sm: "flex-end" },
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <TextField
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜尋"
              size="small"
              sx={SEARCH_INPUT_SX}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <ActionButtons onClear={handleClear} onSearch={handleSearch} />
          </Box>
        </FilterRow>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: "20px",
            mb: "10px",
          }}
        >
          {!isEmployee ? (
            <Button
              variant="contained"
              sx={BATCH_BUTTON_SX}
              onClick={handleBatchApprove}
              disabled={selectedIds.length === 0 || submitting}
            >
              批次簽核
            </Button>
          ) : null}
        </Box>

        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: isEmployee ? "1040px" : "1160px" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: isEmployee
                  ? "100px 220px 220px 240px 1fr 72px"
                  : "100px 220px 220px 240px 1fr 72px 48px",
                minHeight: "62px",
                alignItems: "center",
                bgcolor: "#d4d4d4",
                px: "12px",
                columnGap: "8px",
              }}
            >
              <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
                申請日期
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
                申請人
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
                表單類型
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
                內容
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
                事由
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
                操作
              </Typography>

              {!isEmployee ? (
                <Checkbox
                  checked={isAllChecked}
                  indeterminate={isIndeterminate}
                  onChange={(e) => handleCheckAll(e.target.checked)}
                />
              ) : null}
            </Box>

            {filteredData.length === 0 ? (
              <Box
                sx={{
                  minHeight: "62px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: "12px",
                  borderBottom: "1px solid #d1d5db",
                }}
              >
                <Typography sx={{ fontSize: "15px", color: "#111827" }}>
                  查無資料
                </Typography>
              </Box>
            ) : (
              filteredData.map((row) => {
                const rowKey = getRowKey(row);
                const showDelete = canDeleteRow(row);

                return (
                  <Box
                    key={rowKey}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: isEmployee
                        ? "100px 220px 220px 240px 1fr 72px"
                        : "100px 220px 220px 240px 1fr 72px 48px",
                      minHeight: "62px",
                      alignItems: "center",
                      px: "12px",
                      py: "8px",
                      borderBottom: "1px solid #d1d5db",
                      cursor: "pointer",
                      columnGap: "8px",
                    }}
                    onClick={() => handleOpenDetail(row)}
                  >
                    <Typography sx={{ fontSize: "15px" }}>
                      {row.date}
                    </Typography>
                    <Typography sx={{ fontSize: "15px" }}>
                      {row.applicant}
                    </Typography>
                    <Typography sx={{ fontSize: "15px" }}>
                      {row.formType}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "15px",
                        wordBreak: "break-word",
                        whiteSpace: "normal",
                      }}
                    >
                      {row.content || "-"}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "15px",
                        wordBreak: "break-word",
                        whiteSpace: "normal",
                      }}
                    >
                      {row.reason || "-"}
                    </Typography>

                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: "2px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="查看">
                        <IconButton
                          size="small"
                          sx={ACTION_ICON_BUTTON_SX}
                          onClick={() => handleOpenDetail(row)}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {showDelete ? (
                        <Tooltip title="刪除">
                          <IconButton
                            size="small"
                            sx={ACTION_ICON_BUTTON_SX}
                            onClick={() => handleRequestDelete(row)}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </Box>

                    {!isEmployee ? (
                      <Checkbox
                        checked={selectedIds.includes(rowKey)}
                        onChange={(e) =>
                          handleCheckOne(rowKey, e.target.checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : null}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Box>

      <PendingApprovalDetailDialog
        open={detailOpen}
        row={activeRow}
        actor={actor}
        submitting={submitting}
        onClose={handleCloseDetail}
        onAction={handleAction}
        onRequestDelete={handleRequestDelete}
        canDeleteRow={canDeleteRow}
        canApproveRow={canApproveRow}
        canRejectRow={canRejectRow}
      />

      <Dialog
        open={confirmDeleteOpen}
        onClose={submitting ? undefined : handleCloseDeleteConfirm}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontSize: "18px", fontWeight: 700 }}>
          確認刪除
        </DialogTitle>

        <DialogContent dividers>
          <Typography sx={{ fontSize: "15px", color: "#111827" }}>
            確定要刪除這筆申請嗎？
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: "16px", py: "12px", gap: "8px" }}>
          <Button
            variant="outlined"
            onClick={handleCloseDeleteConfirm}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={executeDelete}
            disabled={submitting}
          >
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
