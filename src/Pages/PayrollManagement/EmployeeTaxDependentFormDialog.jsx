import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import {
  createPayrollTaxDependent,
  updatePayrollTaxDependent,
} from "../../API/payroll";

const CERTIFICATE_TYPE_OPTIONS = [
  {
    value: "",
    label: "未設定",
  },
  {
    value: "0",
    label: "0｜本國個人",
  },
  {
    value: "3",
    label: "3｜境內住滿 183 天之外僑或大陸居民",
  },
  {
    value: "5",
    label: "5｜境內未住滿 183 天之大陸地區人民",
  },
  {
    value: "7",
    label: "7｜境內未住滿 183 天之外僑",
  },
];

const STATUS_OPTIONS = [
  {
    value: "啟用",
    label: "啟用",
  },
  {
    value: "停用",
    label: "停用",
  },
];

function normalizeDate(value) {
  if (!value || value === "0000-00-00") {
    return "";
  }

  return String(value).slice(0, 10);
}

function createInitialForm(record, employeeId, taxProfileId) {
  return {
    employee_id: Number(employeeId || 0),
    tax_profile_id: Number(taxProfileId || 0) || "",
    dependent_name: record?.dependent_name || "",
    identity_number: record?.identity_number || "",
    birth_date: normalizeDate(record?.birth_date),
    relationship_type: record?.relationship_type || "",
    certificate_type: String(record?.certificate_type || ""),
    nationality_type: record?.nationality_type || "",
    effective_from: normalizeDate(record?.effective_from),
    effective_to: normalizeDate(record?.effective_to),
    remarks: record?.remarks || "",
    status: record?.status || "啟用",
  };
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function validateForm(form) {
  if (!Number(form.employee_id || 0)) {
    return "請選擇員工。";
  }

  if (!Number(form.tax_profile_id || 0)) {
    return "請選擇員工所得稅資料。";
  }

  if (!String(form.dependent_name || "").trim()) {
    return "請輸入扶養親屬姓名。";
  }

  if (!form.effective_from) {
    return "請輸入扶養親屬生效開始日。";
  }

  if (
    form.effective_to &&
    form.effective_from &&
    form.effective_to < form.effective_from
  ) {
    return "扶養親屬生效結束日不可早於生效開始日。";
  }

  return "";
}

export default function EmployeeTaxDependentFormDialog({
  open,
  employee,
  taxProfile,
  editingRecord,
  onClose,
  onSaved,
}) {
  const employeeId = Number(employee?.employee_id || 0);
  const taxProfileId = Number(taxProfile?.tax_profile_id || 0);

  const [form, setForm] = useState(() =>
    createInitialForm(editingRecord, employeeId, taxProfileId),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const editingId = Number(editingRecord?.tax_dependent_id || 0);
  const isEditing = editingId > 0;

  const employeeLabel = useMemo(() => {
    const employeeNo = String(employee?.employee_no || "").trim();

    const employeeName =
      employee?.display_name ||
      employee?.employee_name ||
      employee?.english_name ||
      employee?.email ||
      "--";

    return employeeNo ? `${employeeNo}｜${employeeName}` : employeeName;
  }, [employee]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(createInitialForm(editingRecord, employeeId, taxProfileId));
    setError("");
    setSaving(false);
  }, [open, editingRecord, employeeId, taxProfileId]);

  function handleChange(field) {
    return (event) => {
      setForm((currentForm) => ({
        ...currentForm,
        [field]: event.target.value,
      }));
    };
  }

  function handleDialogClose() {
    if (saving) {
      return;
    }

    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      employee_id: Number(form.employee_id),
      tax_profile_id: Number(form.tax_profile_id),
      dependent_name: String(form.dependent_name || "").trim(),
      identity_number: String(form.identity_number || "").trim(),
      birth_date: form.birth_date || null,
      relationship_type: String(form.relationship_type || "").trim(),
      certificate_type: String(form.certificate_type || ""),
      nationality_type: String(form.nationality_type || "").trim(),
      effective_from: form.effective_from,
      effective_to: form.effective_to || null,
      remarks: String(form.remarks || "").trim(),
      status: form.status,
    };

    setSaving(true);
    setError("");

    try {
      const result = isEditing
        ? await updatePayrollTaxDependent(editingId, payload)
        : await createPayrollTaxDependent(payload);

      await onSaved(result, {
        isEditing,
      });
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          isEditing
            ? "更新扶養親屬資料失敗。"
            : "新增扶養親屬資料失敗。",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
      component="form"
      onSubmit={handleSubmit}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
        }}
      >
        {isEditing ? "編輯扶養親屬" : "新增扶養親屬"}
      </DialogTitle>

      <DialogContent dividers>
        {error ? (
          <Alert
            severity="error"
            sx={{
              mb: "16px",
            }}
          >
            {error}
          </Alert>
        ) : null}

        <Box
          sx={{
            p: "14px",
            mb: "16px",
            borderRadius: "5px",
            bgcolor: "#f8fafc",
          }}
        >
          <Typography
            sx={{
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            員工
          </Typography>

          <Typography
            sx={{
              mt: "4px",
              color: "#111827",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            {employeeLabel}
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            所得稅資料 ID：{taxProfileId || "--"}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: "14px",
          }}
        >
          <TextField
            required
            size="small"
            label="扶養親屬姓名"
            value={form.dependent_name}
            disabled={saving}
            onChange={handleChange("dependent_name")}
          />

          <TextField
            size="small"
            label="關係"
            placeholder="例如：配偶、子女、父親"
            value={form.relationship_type}
            disabled={saving}
            onChange={handleChange("relationship_type")}
          />

          <TextField
            size="small"
            label="身分證號／居留證號"
            value={form.identity_number}
            disabled={saving}
            onChange={handleChange("identity_number")}
          />

          <TextField
            type="date"
            size="small"
            label="出生日期"
            value={form.birth_date}
            disabled={saving}
            onChange={handleChange("birth_date")}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            select
            size="small"
            label="證號別"
            value={form.certificate_type}
            disabled={saving}
            onChange={handleChange("certificate_type")}
          >
            {CERTIFICATE_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value || "empty"} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            label="國籍類型"
            placeholder="例如：本國人、外國人"
            value={form.nationality_type}
            disabled={saving}
            onChange={handleChange("nationality_type")}
          />

          <TextField
            required
            type="date"
            size="small"
            label="生效開始日"
            value={form.effective_from}
            disabled={saving}
            onChange={handleChange("effective_from")}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            type="date"
            size="small"
            label="生效結束日"
            value={form.effective_to}
            disabled={saving}
            onChange={handleChange("effective_to")}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            select
            size="small"
            label="狀態"
            value={form.status}
            disabled={saving}
            onChange={handleChange("status")}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            multiline
            minRows={3}
            size="small"
            label="備註"
            value={form.remarks}
            disabled={saving}
            onChange={handleChange("remarks")}
            sx={{
              gridColumn: {
                xs: "auto",
                sm: "1 / -1",
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: "14px 20px",
        }}
      >
        <Button
          type="button"
          color="inherit"
          disabled={saving}
          onClick={handleDialogClose}
        >
          取消
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={saving}
          startIcon={
            saving ? (
              <CircularProgress size={17} color="inherit" />
            ) : null
          }
          sx={{
            fontWeight: 700,
          }}
        >
          {saving
            ? isEditing
              ? "更新中..."
              : "新增中..."
            : isEditing
              ? "儲存變更"
              : "新增扶養親屬"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}