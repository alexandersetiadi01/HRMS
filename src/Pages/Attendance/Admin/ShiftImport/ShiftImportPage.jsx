import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import * as XLSX from "xlsx";

import {
  apiAttendanceShiftImportCommit,
  apiAttendanceShiftImportMeta,
  apiAttendanceShiftImportPreview,
} from "../../../../API/attendance";
import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import Breadcrumb from "../../../../Utils/Breadcrumb";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  FilterActions,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";
import { ACTION_BUTTON_SX } from "../../AttendanceForm/ApplicationRecord/Options";

const PREVIEW_COLUMNS = [
  { key: "row_number", label: "列號", width: "0.6fr" },
  { key: "employee_label", label: "員工", width: "1.5fr" },
  { key: "work_date", label: "日期", width: "1fr" },
  { key: "shift_label", label: "班次", width: "1.4fr" },
  { key: "current_schedule", label: "目前班表", width: "1.4fr" },
  { key: "status_label", label: "匯入結果", width: "1.2fr" },
  { key: "message", label: "說明", width: "2fr" },
];

const HEADER_MAP = {
  員工編號: "employee_no",
  日期: "work_date",
  班次代碼: "shift_code",
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

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatExcelDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(
      value.getDate(),
    )}`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed?.y && parsed?.m && parsed?.d) {
      return `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`;
    }
  }

  const text = String(value ?? "").trim();

  if (!text) return "";

  const normalized = text.replace(/\./g, "/").replace(/-/g, "/");
  const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);

  if (!match) return text;

  return `${match[1]}-${pad2(match[2])}-${pad2(match[3])}`;
}

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "");
}

function downloadTemplate(shifts = []) {
  const workbook = XLSX.utils.book_new();

  const importSheet = XLSX.utils.aoa_to_sheet([
    ["員工編號", "日期", "班次代碼"],
  ]);

  importSheet["!cols"] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    importSheet,
    "班表匯入",
  );

  const referenceRows = [
    [
      "班次代碼",
      "班次名稱",
      "週期日",
      "星期類型",
      "上班時間",
      "下班時間",
      "休息分鐘",
      "工作日",
    ],
  ];

  shifts.forEach((shift) => {
    const days = Array.isArray(shift?.days)
      ? shift.days
      : [];

    if (!days.length) {
      referenceRows.push([
        shift?.shift_code || "",
        shift?.shift_name || "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      return;
    }

    days.forEach((day) => {
      referenceRows.push([
        shift?.shift_code || "",
        shift?.shift_name || "",
        Number(day?.seq_no || 0),
        day?.weekday_type || "",
        day?.work_start || "",
        day?.work_end || "",
        Number(day?.break_minutes || 0),
        Number(day?.is_workday || 0) === 1
          ? "是"
          : "否",
      ]);
    });
  });

  const referenceSheet =
    XLSX.utils.aoa_to_sheet(
      referenceRows,
    );

  referenceSheet["!cols"] = [
    { wch: 16 },
    { wch: 22 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    referenceSheet,
    "班次對照",
  );

  XLSX.writeFile(
    workbook,
    "班表匯入範本.xlsx",
  );
}

function parseWorkbook(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellDates: true,
  });

  const preferredSheet =
    workbook.SheetNames.find((name) => name.trim() === "班表匯入") ||
    workbook.SheetNames[0];

  if (!preferredSheet) {
    throw new Error("Excel 檔案中沒有可讀取的工作表。");
  }

  const sheet = workbook.Sheets[preferredSheet];
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  if (!matrix.length) {
    throw new Error("Excel 檔案沒有班表資料。");
  }

  const headerRow = matrix[0].map(normalizeHeader);
  const columnIndexes = {};

  Object.entries(HEADER_MAP).forEach(([label, key]) => {
    const index = headerRow.indexOf(label);

    if (index >= 0) {
      columnIndexes[key] = index;
    }
  });

  const missingHeaders = Object.entries(HEADER_MAP)
    .filter(([_label, key]) => columnIndexes[key] === undefined)
    .map(([label]) => label);

  if (missingHeaders.length) {
    throw new Error(`Excel 缺少必要欄位：${missingHeaders.join("、")}`);
  }

  const rows = matrix
    .slice(1)
    .map((row, index) => ({
      row_number: index + 2,
      employee_no: String(
        row[columnIndexes.employee_no] ?? "",
      ).trim(),
      work_date: formatExcelDate(
        row[columnIndexes.work_date],
      ),
      shift_code: String(
        row[columnIndexes.shift_code] ?? "",
      ).trim(),
    }))
    .filter(
      (row) =>
        row.employee_no ||
        row.work_date ||
        row.shift_code,
    );

  if (!rows.length) {
    throw new Error("Excel 檔案沒有可匯入的班表資料。");
  }

  return rows;
}

export default function ShiftImportPage() {
  const fileInputRef = useRef(null);

  const [meta, setMeta] = useState({
    shifts: [],
    max_rows: 1000,
  });
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [existingPolicy, setExistingPolicy] = useState("skip");
  const [preview, setPreview] = useState(null);
  const [readingFile, setReadingFile] = useState(false);
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
        const response = await apiAttendanceShiftImportMeta();
        const data = getData(response);

        setMeta({
          shifts: Array.isArray(data?.shifts) ? data.shifts : [],
          max_rows: Number(data?.max_rows || 1000),
        });
      } catch (error) {
        console.error(error);
        setErrorText(
          getErrorMessage(error, "無法載入班表匯入設定。"),
        );
      } finally {
        setLoadingMeta(false);
      }
    };

    load();
  }, []);

  const previewRows = useMemo(
    () => (Array.isArray(preview?.items) ? preview.items : []),
    [preview],
  );

  const summary = preview?.summary || {};

  const buildPayload = () => ({
    existing_policy: existingPolicy,
    rows,
  });

  const resetPreview = () => {
    setPreview(null);
    setPreviewErrorText("");
  };

  const handleExistingPolicyChange = (value) => {
    setExistingPolicy(value);
    resetPreview();
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(meta.shifts);
  };

  const handleChooseFile = () => {
    if (readingFile || previewing || submitting) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";

    if (!file) return;

    const extension =
      String(file.name || "")
        .split(".")
        .pop()
        ?.toLowerCase() || "";

    if (extension !== "xlsx") {
      setSelectedFile(null);
      setRows([]);
      resetPreview();
      setErrorText("請選擇 .xlsx 格式的 Excel 檔案。");
      return;
    }

    setReadingFile(true);
    setErrorText("");
    resetPreview();

    try {
      const buffer = await file.arrayBuffer();
      const parsedRows = parseWorkbook(buffer);

      if (parsedRows.length > Number(meta.max_rows || 1000)) {
        throw new Error(
          `單次最多可匯入 ${Number(meta.max_rows || 1000)} 筆班表資料。`,
        );
      }

      setSelectedFile(file);
      setRows(parsedRows);
    } catch (error) {
      console.error(error);
      setSelectedFile(null);
      setRows([]);
      setErrorText(
        error?.message || "讀取 Excel 檔案失敗。",
      );
    } finally {
      setReadingFile(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile || !rows.length) {
      setErrorText("請先選擇並讀取 Excel 檔案。");
      return;
    }

    setPreviewing(true);
    setErrorText("");
    setPreviewErrorText("");

    try {
      const response =
        await apiAttendanceShiftImportPreview(
          buildPayload(),
        );

      setPreview(getData(response));
    } catch (error) {
      console.error(error);
      setPreview(null);
      setErrorText(
        getErrorMessage(error, "班表匯入預覽失敗。"),
      );
    } finally {
      setPreviewing(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) {
      setPreviewErrorText("請先執行匯入預覽。");
      return;
    }

    if (!Number(summary.processable || 0)) {
      setPreviewErrorText("目前沒有可匯入的班表資料。");
      return;
    }

    setSubmitting(true);
    setPreviewErrorText("");

    try {
      const response =
        await apiAttendanceShiftImportCommit(
          buildPayload(),
        );

      const data = getData(response);
      const result = data?.summary || {};

      setPreview(null);
      setSelectedFile(null);
      setRows([]);

      setSuccessDialog({
        open: true,
        title: "班表匯入完成",
        message:
          `共匯入 ${Number(result.imported || 0)} 筆班表，` +
          `新增 ${Number(result.inserted || 0)} 筆，` +
          `取代 ${Number(result.replaced || 0)} 筆。`,
      });
    } catch (error) {
      console.error(error);
      setPreviewErrorText(
        getErrorMessage(error, "班表匯入失敗。"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setRows([]);
    setExistingPolicy("skip");
    setErrorText("");
    resetPreview();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderPreviewValue = (row, column) => {
    if (column.key === "current_schedule") {
      return row.current_schedule || "-";
    }

    if (column.key === "message") {
      return row.message || "-";
    }

    return row[column.key] || "-";
  };

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5, md: 3 },
      }}
    >
      <Breadcrumb
        rootLabel="管理者專區"
        rootTo="/attendance"
        currentLabel="班表匯入"
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
        班表匯入
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: "14px", sm: "18px" },
          borderColor: "#d1d5db",
          borderRadius: "8px",
        }}
      >
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          匯入設定
        </Typography>

        <Box
          sx={{
            mt: "4px",
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: "12px",
          }}
        >
          <Typography
            sx={{
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            Excel 必須包含「員工編號」、「日期」及「班次代碼」三個欄位。
          </Typography>

          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            onClick={handleDownloadTemplate}
            disabled={
              loadingMeta ||
              readingFile ||
              previewing ||
              submitting
            }
            sx={ACTION_BUTTON_SX}
          >
            下載匯入範本
          </Button>
        </Box>

        <Box
          sx={{
            mt: "20px",
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 2fr) minmax(220px, 1fr)",
            },
            gap: "14px",
            alignItems: "end",
          }}
        >
          <Box>
            <Typography
              sx={{
                mb: "6px",
                fontSize: "15px",
                fontWeight: 500,
                color: "#111827",
              }}
            >
              Excel 檔案
              <Box component="span" sx={{ color: "#dc2626" }}>
                *
              </Box>
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: { xs: "stretch", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                gap: "10px",
              }}
            >
              <Button
                variant="outlined"
                startIcon={<UploadFileOutlinedIcon />}
                onClick={handleChooseFile}
                disabled={
                  loadingMeta ||
                  readingFile ||
                  previewing ||
                  submitting
                }
                sx={{
                  ...ACTION_BUTTON_SX,
                  minWidth: "150px",
                }}
              >
                選擇 Excel 檔案
              </Button>

              <TextField
                size="small"
                value={selectedFile?.name || ""}
                placeholder="尚未選擇檔案"
                fullWidth
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "32px",
                    fontSize: "15px",
                    bgcolor: "#ffffff",
                  },
                }}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                hidden
                onChange={handleFileChange}
              />
            </Box>
          </Box>

          <Box>
            <Typography
              sx={{
                mb: "6px",
                fontSize: "15px",
                fontWeight: 500,
                color: "#111827",
              }}
            >
              既有班表
            </Typography>

            <SelectField
              value={existingPolicy}
              onChange={handleExistingPolicyChange}
              options={[
                {
                  value: "skip",
                  label: "跳過已有班表",
                },
                {
                  value: "replace",
                  label: "取代已有班表",
                },
              ]}
              fullWidth
              height="32px"
              disabled={
                readingFile ||
                previewing ||
                submitting
              }
            />
          </Box>
        </Box>

        {selectedFile && rows.length ? (
          <Alert severity="info" sx={{ mt: "16px" }}>
            已讀取 {rows.length} 筆班表資料。
          </Alert>
        ) : null}

        {errorText ? (
          <Alert severity="error" sx={{ mt: "16px" }}>
            {errorText}
          </Alert>
        ) : null}

        <Box sx={{ mt: "20px" }}>
          <FilterActions>
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={
                readingFile ||
                previewing ||
                submitting
              }
              sx={ACTION_BUTTON_SX}
            >
              清空
            </Button>

            <Button
              variant="outlined"
              onClick={handlePreview}
              disabled={
                loadingMeta ||
                readingFile ||
                previewing ||
                submitting ||
                !rows.length
              }
              sx={ACTION_BUTTON_SX}
            >
              {previewing ? "預覽中..." : "預覽匯入"}
            </Button>
          </FilterActions>
        </Box>

        {readingFile ? (
          <Box
            sx={{
              mt: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <CircularProgress size={24} />
            <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
              正在讀取 Excel 檔案...
            </Typography>
          </Box>
        ) : null}
      </Paper>

      <FormDialog
        open={Boolean(preview)}
        title="班表匯入預覽"
        submitting={submitting}
        submitLabel="確認匯入"
        cancelLabel="取消"
        maxWidth="lg"
        onClose={() => {
          if (submitting) return;
          setPreview(null);
          setPreviewErrorText("");
        }}
        onSubmit={handleCommit}
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
              sm: "repeat(5, minmax(0, 1fr))",
            },
            gap: "12px",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              總筆數
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
              {summary.total || 0}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              可匯入
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
              {summary.processable || 0}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              不可匯入
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
              {summary.blocked || 0}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              將新增
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
              {summary.insert || 0}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              將取代
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
              {summary.replace || 0}
            </Typography>
          </Box>
        </Box>

        <ResponsiveAttendanceTable
          columns={PREVIEW_COLUMNS}
          rows={previewRows}
          getRowKey={(row) =>
            `${row.row_number}-${row.employee_no}-${row.work_date}`
          }
          mobileCardTitleKey="employee_label"
          emptyText="查無匯入預覽資料"
          renderValue={renderPreviewValue}
          fitToContainer
          pagination
          rowsPerPage={10}
        />
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