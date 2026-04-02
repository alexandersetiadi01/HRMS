import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import {
  EMPLOYEE_OPTIONS,
  UNIT_OPTIONS,
  getApplicationRecordYearOptions,
} from "./Options";
import {
  ActionButtons,
  FilterRow,
  SelectField,
  SimpleTable,
} from "./SharedFields";

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "signing", label: "簽核中" },
  { value: "returned", label: "已駁回" },
  { value: "approved", label: "已核准" },
  { value: "cancel-signing", label: "撤銷簽核中" },
  { value: "cancelled", label: "已撤銷" },
];

const YEAR_OPTIONS_LABEL = "年度";
const TABLE_COLUMNS = [
  { label: "申請日期", width: "11%" },
  { label: "單位", width: "17%" },
  { label: "申請人", width: "17%" },
  { label: "假別", width: "16%" },
  { label: "日期/時間", width: "22%" },
  { label: "狀態", width: "17%" },
];

export default function Leave() {
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();

  const yearOptions = useMemo(
    () => getApplicationRecordYearOptions(currentYear),
    [currentYear]
  );

  const [year, setYear] = useState(String(currentYear));
  const [unit, setUnit] = useState("");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("all");

  const yearSelectOptions = yearOptions.map((item) => ({ value: item, label: item }));

  const handleClear = () => {
    setYear(String(currentYear));
    setUnit("");
    setEmployee("");
    setStatus("all");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "14px", mb: "14px" }}>
        <FilterRow>
          <SelectField
            label={YEAR_OPTIONS_LABEL}
            required
            value={year}
            onChange={setYear}
            options={yearSelectOptions}
            minWidth="82px"
          />

          <SelectField
            label="單位"
            value={unit}
            onChange={setUnit}
            options={UNIT_OPTIONS}
            displayEmpty
          />

          <SelectField
            label="工號/姓名"
            value={employee}
            onChange={setEmployee}
            options={EMPLOYEE_OPTIONS}
            displayEmpty
          />
        </FilterRow>

        <FilterRow withDivider>
          <SelectField
            label="狀態"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            minWidth="200px"
          />

          <ActionButtons onClear={handleClear} />
        </FilterRow>
      </Box>

      <SimpleTable columns={TABLE_COLUMNS} />
    </Box>
  );
}