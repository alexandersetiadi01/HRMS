import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  apiApproveLeaveEntitlementRequest,
  apiLeaveApplicationMeta,
  apiLeaveEntitlementRequests,
  apiRejectLeaveEntitlementRequest,
  apiSpecialLeaveOptions,
} from "../../../../API/attendance";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";
import { normalizeSpecialLeaveOptions } from "../../SpecialLeave/SpecialLeaveUtils";

const INITIAL_FILTERS = {
  unit: "",
  employee_id: "",
  leave_type_id: "",
  request_status: "",
};

const STATUS_OPTIONS = [
  { value: "", label: "全部狀態" },
  { value: "待審核", label: "待審核" },
  { value: "已核准", label: "已核准" },
  { value: "已駁回", label: "已駁回" },
];

const TABLE_COLUMNS = [
  { key: "employee", label: "員工", width: "1.5fr" },
  { key: "leave_name", label: "特殊假別", width: "1.3fr" },
  { key: "submitted_at", label: "申請日期", width: "1.1fr" },
  { key: "request_status", label: "狀態", width: "1fr" },
  { key: "actions", label: "操作", width: "120px" },
];

function getItems(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function formatDateTime(value) {
  const raw = String(value || "").trim();
  return raw ? raw.replace(/-/g, "/").slice(0, 16) : "-";
}

function formatDate(value) {
  const raw = String(value || "").trim();
  return raw ? raw.replace(/-/g, "/").slice(0, 10) : "-";
}

function formatHours(value) {
  const hours = Number(value);
  return Number.isFinite(hours) ? `${hours} 小時` : "-";
}

export default function EntitlementRequestsTab() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [unitOptions, setUnitOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [detailRow, setDetailRow] = useState(null);
  const [actionRow, setActionRow] = useState(null);
  const [actionType, setActionType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const filteredEmployeeOptions = useMemo(() => {
    if (!filters.unit) {
      return employeeOptions;
    }

    return employeeOptions.filter(
      (employee) => String(employee.unit_label || "") === String(filters.unit),
    );
  }, [employeeOptions, filters.unit]);

  const employeeMap = useMemo(
    () =>
      new Map(
        employeeOptions.map((employee) => [
          Number(employee.employee_id || employee.value || 0),
          employee,
        ]),
      ),
    [employeeOptions],
  );

  const displayRows = useMemo(() => {
    return rows
      .map((row) => {
        const employee = employeeMap.get(Number(row.employee_id || 0));

        return {
          ...row,
          employee:
            row.employee_no && row.employee_name
              ? `${row.employee_no}/${row.employee_name}`
              : employee?.label ||
                row.employee_name ||
                row.employee_no ||
                `#${row.employee_id}`,
          unit_label: employee?.unit_label || "",
        };
      })
      .filter((row) => {
        if (!appliedFilters.unit) {
          return true;
        }

        return String(row.unit_label || "") === String(appliedFilters.unit);
      });
  }, [rows, employeeMap, appliedFilters.unit]);

  const loadMeta = useCallback(async () => {
    const [meta, specialOptionsResponse] = await Promise.all([
      apiLeaveApplicationMeta(),
      apiSpecialLeaveOptions(),
    ]);

    const specialOptions = normalizeSpecialLeaveOptions(specialOptionsResponse);

    setUnitOptions([
      { value: "", label: "全部單位" },
      ...(Array.isArray(meta?.unitOptions) ? meta.unitOptions : []),
    ]);

    setEmployeeOptions(
      Array.isArray(meta?.employeeOptions) ? meta.employeeOptions : [],
    );

    setLeaveTypeOptions([
      { value: "", label: "全部特殊假別" },
      ...specialOptions.map((item) => ({
        value: item.value,
        label: item.label,
      })),
    ]);
  }, []);

  const loadRows = useCallback(async (nextFilters) => {
    const result = await apiLeaveEntitlementRequests({
      employee_id: nextFilters.employee_id || undefined,
      leave_type_id: nextFilters.leave_type_id || undefined,
      request_status: nextFilters.request_status || undefined,
    });

    setRows(getItems(result));
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorText("");

      try {
        await Promise.all([loadMeta(), loadRows(INITIAL_FILTERS)]);
      } catch (error) {
        console.error(error);

        if (active) {
          setRows([]);
          setErrorText("無法載入特殊假別申請資料。");
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
  }, [loadMeta, loadRows]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => {
      const next = { ...current, [field]: value };

      if (field === "unit") {
        next.employee_id = "";
      }

      return next;
    });
  };

  const handleSearch = async () => {
    setLoading(true);
    setErrorText("");

    try {
      setAppliedFilters(filters);
      await loadRows(filters);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入特殊假別申請資料。");
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
      await loadRows(INITIAL_FILTERS);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入特殊假別申請資料。");
    } finally {
      setLoading(false);
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
    const entitlementRequestId = Number(actionRow?.entitlement_request_id || 0);

    if (entitlementRequestId <= 0 || !actionType) return;

    setSubmitting(true);
    setErrorText("");

    try {
      if (actionType === "approve") {
        await apiApproveLeaveEntitlementRequest(entitlementRequestId);
      } else {
        await apiRejectLeaveEntitlementRequest(entitlementRequestId);
      }

      closeActionDialog();
      await loadRows(appliedFilters);

      setSuccessDialog({
        open: true,
        title: actionType === "approve" ? "核准成功" : "駁回成功",
        message:
          actionType === "approve"
            ? "特殊假別申請已成功核准。"
            : "特殊假別申請已成功駁回。",
      });
    } catch (error) {
      console.error(error);
      setErrorText(
        error?.response?.data?.message ||
          (actionType === "approve"
            ? "無法核准特殊假別申請。"
            : "無法駁回特殊假別申請。"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderTableValue = (row, column) => {
    if (column.key === "submitted_at") {
      return formatDateTime(row.submitted_at);
    }

    if (column.key === "actions") {
      const pending = row.request_status === "待審核";
      const approved = row.request_status === "已核准";
      const usedHours = Number(row.generated_used_hours || 0);
      const rejectBlocked = approved && usedHours > 0;

      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <Tooltip title="詳細">
            <IconButton size="small" onClick={() => setDetailRow(row)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {pending ? (
            <Tooltip title="核准">
              <IconButton
                size="small"
                onClick={() => openActionDialog(row, "approve")}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}

          {pending || approved ? (
            <Tooltip
              title={
                rejectBlocked
                  ? "此特殊假別時數已被請假單使用，請先撤銷或修改相關假單"
                  : "駁回"
              }
            >
              <span>
                <IconButton
                  size="small"
                  disabled={rejectBlocked}
                  onClick={() => openActionDialog(row, "reject")}
                >
                  <CloseOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </Box>
      );
    }

    return row[column.key] || "-";
  };

  return (
    <Box sx={{ p: { xs: "14px", sm: "20px" } }}>
      <Box sx={{ mb: "18px" }}>
        <Typography
          sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}
        >
          特殊假別申請
        </Typography>

        <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
          查詢及管理員工特殊假別額度申請
        </Typography>
      </Box>

      <Box sx={{ mb: "18px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: "14px",
            alignItems: "end",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              單位
            </Typography>

            <SelectField
              value={filters.unit}
              onChange={(value) => handleFilterChange("unit", value)}
              options={unitOptions}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              員工
            </Typography>

            <SelectField
              value={filters.employee_id}
              onChange={(value) => handleFilterChange("employee_id", value)}
              options={[
                { value: "", label: "全部員工" },
                ...filteredEmployeeOptions,
              ]}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              特殊假別
            </Typography>

            <SelectField
              value={filters.leave_type_id}
              onChange={(value) => handleFilterChange("leave_type_id", value)}
              options={leaveTypeOptions}
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
              value={filters.request_status}
              onChange={(value) => handleFilterChange("request_status", value)}
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
          getRowKey={(row) => row.entitlement_request_id}
          mobileCardTitleKey="employee"
          emptyText="查無特殊假別申請資料"
          desktopMinWidth="680px"
          renderValue={renderTableValue}
          pagination
          rowsPerPage={10}
        />
      </Box>

      <FormDialog
        open={Boolean(detailRow)}
        title="特殊假別申請詳細"
        submitLabel="關閉"
        cancelLabel=""
        maxWidth="md"
        onClose={() => setDetailRow(null)}
        onSubmit={() => setDetailRow(null)}
      >
        {detailRow ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                員工
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {detailRow.employee || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                特殊假別
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {detailRow.leave_name || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                事件日期
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatDate(detailRow.event_date)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                申請年度
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {detailRow.request_year || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                關係 / 類別
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {detailRow.relation_type || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                狀態
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {detailRow.request_status || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                申請時間
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatDateTime(detailRow.submitted_at)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                核准時間
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatDateTime(detailRow.approved_at)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                駁回時間
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatDateTime(detailRow.rejected_at)}
              </Typography>
            </Box>

            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                申請原因
              </Typography>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 600,
                  whiteSpace: "pre-wrap",
                }}
              >
                {detailRow.reason || "-"}
              </Typography>
            </Box>

            {detailRow.generated_entitlement_instance_id ? (
              <>
                <Box>
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    有效開始日
                  </Typography>
                  <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                    {formatDate(detailRow.generated_valid_from)}
                  </Typography>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    有效結束日
                  </Typography>
                  <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                    {formatDate(detailRow.generated_valid_to)}
                  </Typography>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    核准時數
                  </Typography>
                  <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                    {formatHours(detailRow.generated_total_hours)}
                  </Typography>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    已使用時數
                  </Typography>
                  <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                    {formatHours(detailRow.generated_used_hours)}
                  </Typography>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    剩餘時數
                  </Typography>
                  <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                    {formatHours(detailRow.generated_remaining_hours)}
                  </Typography>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    額度狀態
                  </Typography>
                  <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                    {detailRow.generated_instance_status || "-"}
                  </Typography>
                </Box>
              </>
            ) : null}
          </Box>
        ) : null}
      </FormDialog>
      <FormDialog
        open={Boolean(actionRow)}
        title={actionType === "approve" ? "確認核准" : "確認駁回"}
        submitLabel={actionType === "approve" ? "核准" : "駁回"}
        cancelLabel="取消"
        maxWidth="xs"
        submitting={submitting}
        onClose={closeActionDialog}
        onSubmit={handleActionSubmit}
      >
        <Typography
          sx={{ fontSize: "15px", color: "#374151", lineHeight: 1.7 }}
        >
          {actionType === "approve"
            ? `確認核准 ${actionRow?.employee || ""} 的「${actionRow?.leave_name || ""}」特殊假別申請？`
            : `確認駁回 ${actionRow?.employee || ""} 的「${actionRow?.leave_name || ""}」特殊假別申請？`}
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
