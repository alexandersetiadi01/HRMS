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
  { value: "applying", label: "申請中" },
  { value: "returned", label: "已退回" },
  { value: "confirmed", label: "已確認" },
];

const TABLE_COLUMNS = [
  { label: "申請日期", width: "11%" },
  { label: "單位", width: "17%" },
  { label: "申請人", width: "17%" },
  { label: "假別", width: "16%" },
  { label: "附件", width: "22%" },
  { label: "狀態", width: "17%" },
];

export default function SpecialLeave() {
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
            label="年度"
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