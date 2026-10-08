import {
  Alert,
  Box,
  TextField,
  Typography,
} from "@mui/material";

import FormDialog from "../../../../Components/FormDialog";
import { SelectField } from "../../AttendanceForm/ApplicationRecord/SharedFields";

export const EMPTY_PROBATION_FORM = {
  employee_id: "",
  probation_start_date: "",
  probation_end_date: "",
  work_content: "",
  core_work_ability: "",
};

export function buildProbationForm(caseData = null) {
  if (!caseData) {
    return { ...EMPTY_PROBATION_FORM };
  }

  return {
    employee_id: String(
      caseData.employee_id || "",
    ),
    probation_start_date:
      caseData.probation_start_date || "",
    probation_end_date:
      caseData.probation_end_date || "",
    work_content:
      caseData.work_content || "",
    core_work_ability:
      caseData.core_work_ability || "",
  };
}

export function buildProbationPayload(form) {
  return {
    employee_id: Number(
      form.employee_id || 0,
    ),
    probation_start_date:
      form.probation_start_date || "",
    probation_end_date:
      form.probation_end_date || "",
    work_content:
      String(form.work_content || "").trim(),
    core_work_ability:
      String(form.core_work_ability || "").trim(),
  };
}

export default function ProbationInformationDialog({
  open,
  editing = false,
  form,
  employeeOptions = [],
  submitting = false,
  errorText = "",
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <FormDialog
      open={open}
      title={
        editing
          ? "修改試用期基本資料"
          : "新增試用期"
      }
      submitting={submitting}
      submitLabel={
        editing ? "儲存修改" : "新增"
      }
      maxWidth="sm"
      onClose={onClose}
      onSubmit={onSubmit}
    >
      {errorText ? (
        <Alert severity="error">
          {errorText}
        </Alert>
      ) : null}

      <SelectField
        label="員工"
        required
        value={form.employee_id}
        onChange={(value) =>
          onChange("employee_id", value)
        }
        options={[
          {
            value: "",
            label: "請選擇員工",
          },
          ...employeeOptions,
        ]}
        displayEmpty
        fullWidth
        height="38px"
        disabled={editing || submitting}
      />

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
          <Typography
            sx={{
              mb: "6px",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            試用開始日
          </Typography>

          <TextField
            required
            type="date"
            size="small"
            value={
              form.probation_start_date
            }
            onChange={(event) =>
              onChange(
                "probation_start_date",
                event.target.value,
              )
            }
            disabled={submitting}
            fullWidth
            slotProps={{
              htmlInput: {
                "aria-label":
                  "試用開始日",
              },
            }}
          />
        </Box>

        <Box>
          <Typography
            sx={{
              mb: "6px",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            試用結束日
          </Typography>

          <TextField
            required
            type="date"
            size="small"
            value={
              form.probation_end_date
            }
            onChange={(event) =>
              onChange(
                "probation_end_date",
                event.target.value,
              )
            }
            disabled={submitting}
            fullWidth
            slotProps={{
              htmlInput: {
                "aria-label":
                  "試用結束日",
              },
            }}
          />
        </Box>
      </Box>

      <TextField
        required
        fullWidth
        multiline
        minRows={3}
        label="工作內容"
        value={form.work_content}
        onChange={(event) =>
          onChange(
            "work_content",
            event.target.value,
          )
        }
        disabled={submitting}
      />

      <TextField
        required
        fullWidth
        multiline
        minRows={3}
        label="核心工作能力"
        value={form.core_work_ability}
        onChange={(event) =>
          onChange(
            "core_work_ability",
            event.target.value,
          )
        }
        disabled={submitting}
      />
    </FormDialog>
  );
}