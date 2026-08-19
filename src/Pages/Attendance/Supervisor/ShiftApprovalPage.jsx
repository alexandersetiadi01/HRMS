import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";

import {
  apiAttendanceAdminMeta,
  apiAttendanceSelfSchedulingReview,
  apiPublishAttendanceSelfSchedule,
} from "../../../API/attendance";
import FormDialog from "../../../Components/FormDialog";
import SuccessDialog from "../../../Components/SuccessDialog";
import Breadcrumb from "../../../Utils/Breadcrumb";
import ResponsiveAttendanceTable from "../AttendanceForm/ResponsiveAttendanceTable";
import { SelectField } from "../AttendanceForm/ApplicationRecord/SharedFields";

const TABLE_COLUMNS = [
  { key: "work_date", label: "日期", width: "1fr" },
  { key: "shift_name", label: "班次", width: "1.2fr" },
  { key: "schedule_time", label: "班表時間", width: "1.4fr" },
  { key: "status", label: "排班狀態", width: "1fr" },
  { key: "publication_status", label: "發布狀態", width: "1fr" },
];

function getNextMonthYear() {
  const today = new Date();
  const target = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  return {
    year: target.getFullYear(),
    month: target.getMonth() + 1,
  };
}

function getPayload(response) {
  return response?.data?.data || response?.data || response || {};
}

function formatDate(value) {
  const raw = String(value || "").trim();
  return raw ? raw.replace(/-/g, "/").slice(0, 10) : "-";
}

function formatTime(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const match = raw.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function formatScheduleTime(row) {
  const start = formatTime(row?.expected_start);
  const end = formatTime(row?.expected_end);

  if (!start || !end) {
    return "-";
  }

  return `${start} ~ ${end}`;
}

function formatScheduleStatus(value) {
  const map = {
    published: "已排班",
    rest: "休假",
    unscheduled: "未排班",
  };

  return map[value] || value || "-";
}

function formatPublicationStatus(row) {
  if (row?.is_supervisor_published) {
    return "已發布";
  }

  if (String(row?.publication_status || "") === "draft") {
    return "待發布";
  }

  return "尚未確認";
}

export default function ShiftApprovalPage() {
  const targetMonth = useMemo(() => getNextMonthYear(), []);

  const [unitOptions, setUnitOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [unitId, setUnitId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [reviewData, setReviewData] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    const loadMeta = async () => {
      setLoadingMeta(true);
      setErrorText("");

      try {
        const meta = await apiAttendanceAdminMeta();

        setUnitOptions([
          { value: "", label: "全部單位" },
          ...(Array.isArray(meta?.unitOptions) ? meta.unitOptions : []),
        ]);

        setEmployeeOptions(
          Array.isArray(meta?.employeeOptions) ? meta.employeeOptions : [],
        );
      } catch (error) {
        console.error(error);
        setUnitOptions([{ value: "", label: "全部單位" }]);
        setEmployeeOptions([]);
        setErrorText("無法載入班表審核查詢條件。");
      } finally {
        setLoadingMeta(false);
      }
    };

    loadMeta();
  }, []);

  const filteredEmployeeOptions = useMemo(() => {
    if (!unitId) {
      return employeeOptions;
    }

    return employeeOptions.filter(
      (employee) => String(employee.unit_id || "") === String(unitId),
    );
  }, [employeeOptions, unitId]);

  const rows = Array.isArray(reviewData?.items) ? reviewData.items : [];
  const summary = reviewData?.summary || {};

  const handleUnitChange = (value) => {
    setUnitId(value);
    setEmployeeId("");
    setReviewData(null);
    setErrorText("");
  };

  const handleEmployeeChange = (value) => {
    setEmployeeId(value);
    setReviewData(null);
    setErrorText("");
  };

  const loadReview = async () => {
    if (!employeeId) {
      setReviewData(null);
      setErrorText("請先選擇員工。");
      return;
    }

    setLoading(true);
    setErrorText("");

    try {
      const response = await apiAttendanceSelfSchedulingReview({
        employee_id: employeeId,
        year: targetMonth.year,
        month: targetMonth.month,
      });

      setReviewData(getPayload(response));
    } catch (error) {
      console.error(error);
      setReviewData(null);
      setErrorText(
        error?.response?.data?.message ||
          error?.message ||
          "無法載入班表審核資料。",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!employeeId || publishing) {
      return;
    }

    setPublishing(true);
    setErrorText("");

    try {
      await apiPublishAttendanceSelfSchedule({
        employee_id: employeeId,
        year: targetMonth.year,
        month: targetMonth.month,
      });

      const response = await apiAttendanceSelfSchedulingReview({
        employee_id: employeeId,
        year: targetMonth.year,
        month: targetMonth.month,
      });

      setReviewData(getPayload(response));
      setPublishDialogOpen(false);
      setSuccessDialog({
        open: true,
        title: "操作成功",
        message: "次月班表已成功發布。",
      });
    } catch (error) {
      console.error(error);
      setErrorText(
        error?.response?.data?.message ||
          error?.message ||
          "發布次月班表失敗。",
      );
    } finally {
      setPublishing(false);
    }
  };

  const renderTableValue = (row, column) => {
    if (column.key === "work_date") {
      return formatDate(row.work_date);
    }

    if (column.key === "shift_name") {
      return row.shift_name || row.shift_code || "-";
    }

    if (column.key === "schedule_time") {
      return formatScheduleTime(row);
    }

    if (column.key === "status") {
      return formatScheduleStatus(row.status);
    }

    if (column.key === "publication_status") {
      return formatPublicationStatus(row);
    }

    return row[column.key] || "-";
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, sm: 2.5, md: 3 } }}>
      <Breadcrumb
        rootLabel="主管專區"
        rootTo="/attendance"
        currentLabel="班表審核"
        mb="14px"
      />

      <Typography
        component="h1"
        sx={{
          mb: 2,
          fontSize: { xs: "22px", sm: "25px", md: "28px" },
          fontWeight: 700,
          color: "#111827",
        }}
      >
        班表審核
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          borderColor: "#d1d5db",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: { xs: "14px", sm: "20px" } }}>
          <Box sx={{ mb: "18px" }}>
            <Typography
              sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}
            >
              次月班表審核
            </Typography>

            <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
              審核並發布員工 {targetMonth.year}/{String(targetMonth.month).padStart(2, "0")} 班表
            </Typography>
          </Box>

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
              mb: "18px",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
              >
                單位
              </Typography>

              <SelectField
                value={unitId}
                onChange={handleUnitChange}
                options={unitOptions}
                displayEmpty
                fullWidth
                height="38px"
                disabled={loadingMeta || loading}
              />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
              >
                員工
              </Typography>

              <SelectField
                value={employeeId}
                onChange={handleEmployeeChange}
                options={[
                  { value: "", label: "請選擇員工" },
                  ...filteredEmployeeOptions,
                ]}
                displayEmpty
                fullWidth
                height="38px"
                disabled={loadingMeta || loading}
              />
            </Box>

            <Button
              variant="contained"
              onClick={loadReview}
              disabled={loadingMeta || loading || !employeeId}
              sx={{
                height: "38px",
                width: { xs: "100%", md: "auto" },
                justifySelf: { xs: "stretch", md: "start" },
              }}
            >
              查詢
            </Button>
          </Box>

          {errorText ? (
            <Alert severity="error" sx={{ mb: "18px" }}>
              {errorText}
            </Alert>
          ) : null}

          {loading ? (
            <Box
              sx={{
                minHeight: "180px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={30} />
            </Box>
          ) : reviewData ? (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: "12px",
                  mb: "18px",
                }}
              >
                <Paper variant="outlined" sx={{ p: "14px" }}>
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    班表筆數
                  </Typography>
                  <Typography sx={{ mt: "4px", fontSize: "22px", fontWeight: 700 }}>
                    {Number(summary.total || 0)}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: "14px" }}>
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    待發布
                  </Typography>
                  <Typography sx={{ mt: "4px", fontSize: "22px", fontWeight: 700 }}>
                    {Number(summary.draft_count || 0)}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: "14px" }}>
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    已發布
                  </Typography>
                  <Typography sx={{ mt: "4px", fontSize: "22px", fontWeight: 700 }}>
                    {Number(summary.explicitly_published_count || 0)}
                  </Typography>
                </Paper>
              </Box>

              <ResponsiveAttendanceTable
                columns={TABLE_COLUMNS}
                rows={rows}
                getRowKey={(row) => row.schedule_id || row.work_date}
                desktopMinWidth="760px"
                mobileCardTitleKey="work_date"
                renderValue={renderTableValue}
                emptyText="目前尚無次月班表資料"
                pagination
                rowsPerPage={10}
                fitToContainer
              />

              <Box
                sx={{
                  mt: "18px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="contained"
                  disabled={
                    publishing ||
                    summary.can_publish !== true
                  }
                  onClick={() => setPublishDialogOpen(true)}
                >
                  發布次月班表
                </Button>
              </Box>
            </>
          ) : (
            <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
              請選擇員工後查詢次月班表。
            </Typography>
          )}
        </Box>
      </Paper>

      <FormDialog
        open={publishDialogOpen}
        title="發布次月班表"
        submitting={publishing}
        submitLabel="確認發布"
        cancelLabel="取消"
        onClose={() => setPublishDialogOpen(false)}
        onSubmit={handlePublish}
      >
        <Typography sx={{ fontSize: "15px", color: "#374151" }}>
          發布後，員工將無法再修改此月份的自行排班內容。確定要發布
          {reviewData?.employee?.display_name
            ? `「${reviewData.employee.display_name}」`
            : "此員工"}
          的 {targetMonth.year}/{String(targetMonth.month).padStart(2, "0")} 班表嗎？
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