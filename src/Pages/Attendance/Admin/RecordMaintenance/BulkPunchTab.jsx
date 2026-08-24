import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";

import {
  apiAttendanceAdminMeta,
  apiAttendancePunchBulkCreate,
  apiAttendancePunchBulkPreview,
} from "../../../../API/attendance";
import SuccessDialog from "../../../../Components/SuccessDialog";
import FormDialog from "../../../../Components/FormDialog";
import MultiDateCalendar from "../../../../Utils/Calendar/MultiDateCalendar";
import { MobileTimeSelect } from "../../../../Utils/Attendance/SharedForm";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  FilterRow,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";

const PREVIEW_COLUMNS = [
  { key: "work_date", label: "日期", width: "1fr" },
  { key: "weekday_label", label: "星期", width: "0.8fr" },
  { key: "clock_in_time", label: "上班時間", width: "1.2fr" },
  { key: "clock_out_time", label: "下班時間", width: "1.2fr" },
  { key: "status_label", label: "狀態", width: "1fr" },
];

const EMPTY_FORM = {
  employee_id: "",
  dates: [],
  clock_in_hour: "09",
  clock_in_minute: "00",
  clock_out_hour: "18",
  clock_out_minute: "00",
  existing_record_action: "skip",
  maintenance_reason: "",
};

function getData(response) {
  return response?.data?.data ?? response?.data ?? response ?? {};
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatWeekday(value) {
  const labels = [
    "",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
    "星期日",
  ];
  return labels[Number(value)] || "-";
}

function formatDateTime(value) {
  const raw = String(value || "").trim();
  return raw ? raw.replace(/-/g, "/").slice(0, 16) : "-";
}

export default function BulkPunchTab() {
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [previewErrorText, setPreviewErrorText] = useState("");
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoadingMeta(true);
      setErrorText("");

      try {
        const result = await apiAttendanceAdminMeta();
        setEmployeeOptions(
          Array.isArray(result?.employeeOptions) ? result.employeeOptions : [],
        );
      } catch (error) {
        console.error(error);
        setErrorText("無法載入員工資料。");
      } finally {
        setLoadingMeta(false);
      }
    };

    load();
  }, []);

  const previewRows = useMemo(() => {
    const items = Array.isArray(preview?.items) ? preview.items : [];

    return items.map((item) => ({
      ...item,
      weekday_label: formatWeekday(item.weekday),
    }));
  }, [preview]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setPreview(null);
    setPreviewErrorText("");
  };

  const buildPayload = () => ({
    employee_id: Number(form.employee_id),
    dates: form.dates,
    clock_in_time: `${form.clock_in_hour}:${form.clock_in_minute}`,
    clock_out_time: `${form.clock_out_hour}:${form.clock_out_minute}`,
    existing_record_action: form.existing_record_action,
    maintenance_reason: form.maintenance_reason.trim(),
  });

  const validate = () => {
    if (!form.employee_id) {
      return "請選擇員工。";
    }

    if (!form.dates.length) {
      return "請至少選擇一個日期。";
    }

    if (!form.maintenance_reason.trim()) {
      return "請輸入維護原因。";
    }

    return "";
  };

  const handlePreview = async () => {
    const validationError = validate();

    if (validationError) {
      setErrorText(validationError);
      return;
    }

    setPreviewing(true);
    setErrorText("");
    setPreviewErrorText("");

    try {
      const result = await apiAttendancePunchBulkPreview(buildPayload());
      setPreview(getData(result));
    } catch (error) {
      console.error(error);
      setPreview(null);
      setErrorText(getErrorMessage(error, "批次打卡預覽失敗。"));
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async () => {
    if (!preview) {
      setErrorText("請先執行預覽。");
      return;
    }

    if (!Number(preview?.summary?.processable || 0)) {
      setPreviewErrorText("目前沒有可建立或取代的打卡紀錄。");
      return;
    }

    setSubmitting(true);
    setPreviewErrorText("");

    try {
      const result = await apiAttendancePunchBulkCreate(buildPayload());
      const data = getData(result);
      const summary = data?.summary || {};

      setSuccessDialog({
        open: true,
        title: "批次建立成功",
        message: `已成功建立 ${summary.created_punches || 0} 筆打卡紀錄。`,
      });

      setPreview(null);
      setPreviewErrorText("");
      setForm((current) => ({ ...current, dates: [], maintenance_reason: "" }));
    } catch (error) {
      console.error(error);
      setPreviewErrorText(getErrorMessage(error, "批次建立打卡紀錄失敗。"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setForm(EMPTY_FORM);
    setPreview(null);
    setErrorText("");
    setPreviewErrorText("");
  };

  const renderPreviewValue = (row, column) => {
    if (column.key === "clock_in_time" || column.key === "clock_out_time") {
      return formatDateTime(row[column.key]);
    }

    return row[column.key] || "-";
  };

  return (
    <Box sx={{ p: { xs: "14px", sm: "20px" } }}>
      <Box sx={{ mb: "18px" }}>
        <Typography
          sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}
        >
          批次打卡
        </Typography>

        <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
          選擇一位員工，然後在日曆中選取需要建立上下班打卡的日期。
        </Typography>
      </Box>

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
            員工
            <Box component="span" sx={{ color: "#dc2626" }}>
              *
            </Box>
          </Typography>

          <SelectField
            value={form.employee_id}
            onChange={(value) => handleChange("employee_id", value)}
            options={employeeOptions}
            disabled={loadingMeta}
            fullWidth
            height="38px"
          />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            上班時間
            <Box component="span" sx={{ color: "#dc2626" }}>
              *
            </Box>
          </Typography>

          <Box sx={{ width: "100%" }}>
            <MobileTimeSelect
              hour={form.clock_in_hour}
              minute={form.clock_in_minute}
              onChangeHour={(value) => handleChange("clock_in_hour", value)}
              onChangeMinute={(value) => handleChange("clock_in_minute", value)}
            />
          </Box>
        </Box>
        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            下班時間{" "}
            <Box component="span" sx={{ color: "#dc2626" }}>
              *
            </Box>
          </Typography>

          <MobileTimeSelect
            hour={form.clock_out_hour}
            minute={form.clock_out_minute}
            onChangeHour={(value) => handleChange("clock_out_hour", value)}
            onChangeMinute={(value) => handleChange("clock_out_minute", value)}
          />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            既有紀錄
          </Typography>

          <SelectField
            value={form.existing_record_action}
            onChange={(value) => handleChange("existing_record_action", value)}
            options={[
              { value: "skip", label: "跳過已有紀錄的日期" },
              { value: "replace", label: "取代已有的上下班紀錄" },
            ]}
            fullWidth
            height="38px"
          />
        </Box>  
      </Box>

      <Box sx={{ mt: "18px" }}>
        <MultiDateCalendar
          value={form.dates}
          onChange={(dates) => handleChange("dates", dates)}
          maxSelected={93}
          disableFuture
        />
      </Box>

      <TextField
        required
        fullWidth
        multiline
        minRows={3}
        label="維護原因"
        value={form.maintenance_reason}
        onChange={(event) =>
          handleChange("maintenance_reason", event.target.value)
        }
        sx={{ mt: "16px", maxWidth: "100%" }}
      />

      <Box sx={{ mt: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={handlePreview}
          disabled={previewing || submitting}
        >
          {previewing ? "預覽中..." : "預覽批次打卡"}
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            !preview ||
            submitting ||
            !Number(preview?.summary?.processable || 0)
          }
        >
          {submitting ? "建立中..." : "確認建立上下班打卡"}
        </Button>

        <Button
          variant="outlined"
          onClick={handleClear}
          disabled={previewing || submitting}
        >
          清空
        </Button>
      </Box>

      {errorText ? (
        <Alert severity="error" sx={{ mt: "14px" }}>
          {errorText}
        </Alert>
      ) : null}

      <FormDialog
        open={Boolean(preview)}
        title="批次打卡預覽"
        submitLabel="確認建立"
        cancelLabel="取消"
        maxWidth="lg"
        submitting={submitting}
        onClose={() => {
          if (!submitting) {
            setPreview(null);
            setPreviewErrorText("");
          }
        }}
        onSubmit={handleSubmit}
      >
        {previewErrorText ? (
          <Alert severity="error">
            {previewErrorText}
          </Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(4, minmax(0, 1fr))",
            },
            gap: "12px",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              選擇日期
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
              {preview?.summary?.selected_dates || 0}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              可處理
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
              {preview?.summary?.processable || 0}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              不可處理
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
              {preview?.summary?.blocked || 0}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              已有紀錄
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
              {preview?.summary?.existing_punches || 0}
            </Typography>
          </Box>
        </Box>

        <ResponsiveAttendanceTable
          columns={PREVIEW_COLUMNS}
          rows={previewRows}
          getRowKey={(row) => row.work_date}
          mobileCardTitleKey="work_date"
          emptyText="查無預覽資料"
          desktopMinWidth="720px"
          renderValue={renderPreviewValue}
        />
      </FormDialog>

      <SuccessDialog
        open={successDialog.open}
        title={successDialog.title}
        message={successDialog.message}
        onClose={() =>
          setSuccessDialog((current) => ({ ...current, open: false }))
        }
      />
    </Box>
  );
}
