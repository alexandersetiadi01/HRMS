import { useMemo, useState } from "react";
import { Box, Button, Checkbox, Divider, Typography } from "@mui/material";
import {
  UNIT_OPTIONS,
  EMPLOYEE_OPTIONS,
} from "./AttendanceForm/ApplicationRecord/Options";
import { SelectField } from "./AttendanceForm/ApplicationRecord/SharedFields";

const FORM_TYPE_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "missed-punch", label: "忘打卡申請" },
  { value: "leave", label: "請假" },
  { value: "leave-cancel", label: "請假撤銷" },
  { value: "overtime", label: "加班" },
  { value: "overtime-cancel", label: "加班撤銷" },
  { value: "business-trip", label: "公出/出差" },
  { value: "business-trip-cancel", label: "公出/出差撤銷" },
];

const MOCK_DATA = [
  {
    id: 1,
    date: "2026/04/01",
    unit: "人資部",
    applicant: "14001 / 李偉銘",
    formType: "請假",
    content: "事假 4 小時",
  },
  {
    id: 2,
    date: "2026/04/02",
    unit: "資訊部",
    applicant: "14002 / 王小明",
    formType: "加班",
    content: "平日加班 2 小時",
  },
];

const ACTION_BUTTON_SX = {
  minWidth: "72px",
  height: "32px",
  px: "16px",
  borderRadius: "2px",
  borderColor: "#9ca3af",
  color: "#111827",
  fontSize: "14px",
  fontWeight: 500,
  bgcolor: "#fff",
};

const DESKTOP_FILTER_ITEM_SX = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  columnGap: "8px",
  alignItems: "center",
};

const MOBILE_FILTER_ITEM_SX = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const BATCH_BUTTON_SX = {
  minWidth: "78px",
  height: "30px",
  px: "14px",
  fontSize: "15px",
  fontWeight: 700,
  bgcolor: "#5b6478",
  color: "#fff",
};

function Field({ label, value }) {
  return (
    <Box>
      <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "15px" }}>{value}</Typography>
    </Box>
  );
}

export default function AttendancePendingApproval() {
  const [unit, setUnit] = useState("");
  const [employee, setEmployee] = useState("");
  const [formType, setFormType] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);

  const data = useMemo(() => MOCK_DATA, []);
  const allIds = useMemo(() => data.map((d) => d.id), [data]);

  const isAllChecked = data.length > 0 && selectedIds.length === data.length;
  const isIndeterminate =
    selectedIds.length > 0 && selectedIds.length < data.length;

  const handleClear = () => {
    setUnit("");
    setEmployee("");
    setFormType("all");
    setSelectedIds([]);
  };

  const handleCheckAll = (checked) => {
    setSelectedIds(checked ? allIds : []);
  };

  const handleCheckOne = (id, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  return (
    <Box>
      <Typography sx={{ fontSize: "18px", fontWeight: 700, mb: "10px" }}>
        待審核表單
      </Typography>

      <Box sx={{ border: "1px solid #9ca3af", p: "16px" }}>
        {/* DESKTOP FILTER */}
        <Box
          sx={{
            display: { xs: "none", md: "grid" },
            gridTemplateColumns: "1fr 1fr 1fr auto auto",
            columnGap: "20px",
            alignItems: "center",
          }}
        >
          <Box sx={DESKTOP_FILTER_ITEM_SX}>
            <Typography>單位</Typography>
            <SelectField value={unit} onChange={setUnit} options={UNIT_OPTIONS} />
          </Box>

          <Box sx={DESKTOP_FILTER_ITEM_SX}>
            <Typography>工號/姓名</Typography>
            <SelectField value={employee} onChange={setEmployee} options={EMPLOYEE_OPTIONS} />
          </Box>

          <Box sx={DESKTOP_FILTER_ITEM_SX}>
            <Typography>表單類型</Typography>
            <SelectField value={formType} onChange={setFormType} options={FORM_TYPE_OPTIONS} />
          </Box>

          <Button variant="outlined" sx={ACTION_BUTTON_SX}>搜尋</Button>
          <Button variant="outlined" onClick={handleClear} sx={ACTION_BUTTON_SX}>清空</Button>
        </Box>

        {/* MOBILE FILTER */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <Box sx={MOBILE_FILTER_ITEM_SX}>
            <Typography>單位</Typography>
            <SelectField value={unit} onChange={setUnit} options={UNIT_OPTIONS} />
          </Box>

          <Box sx={MOBILE_FILTER_ITEM_SX}>
            <Typography>工號/姓名</Typography>
            <SelectField value={employee} onChange={setEmployee} options={EMPLOYEE_OPTIONS} />
          </Box>

          <Box sx={MOBILE_FILTER_ITEM_SX}>
            <Typography>表單類型</Typography>
            <SelectField value={formType} onChange={setFormType} options={FORM_TYPE_OPTIONS} />
          </Box>

          <Box sx={{ display: "flex", gap: "12px", justifyContent: "center", mt: "10px" }}>
            <Button variant="outlined" sx={ACTION_BUTTON_SX}>搜尋</Button>
            <Button variant="outlined" onClick={handleClear} sx={ACTION_BUTTON_SX}>清空</Button>
          </Box>
        </Box>

        <Divider sx={{ my: "20px" }} />

        {/* DESKTOP ACTION */}
        <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "flex-end", mb: "10px" }}>
          <Button variant="contained" sx={BATCH_BUTTON_SX}>
            批次簽核
          </Button>
        </Box>

        {/* MOBILE ACTION */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            justifyContent: "space-between",
            alignItems: "center",
            mb: "10px",
          }}
        >
          <Button variant="contained" sx={BATCH_BUTTON_SX}>
            批次簽核
          </Button>

          <Box
            sx={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
            onClick={() => handleCheckAll(!isAllChecked)}
          >
            <Typography sx={{ fontSize: "14px" }}>全選</Typography>
            <Checkbox
              checked={isAllChecked}
              indeterminate={isIndeterminate}
              onChange={(e) => handleCheckAll(e.target.checked)}
              size="small"
            />
          </Box>
        </Box>

        {/* DESKTOP TABLE */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "100px 220px 220px 220px 1fr 48px", bgcolor: "#d4d4d4", p: "10px" }}>
            <Typography>申請日期</Typography>
            <Typography>單位</Typography>
            <Typography>申請人</Typography>
            <Typography>表單類型</Typography>
            <Typography>內容</Typography>
            <Checkbox
              checked={isAllChecked}
              indeterminate={isIndeterminate}
              onChange={(e) => handleCheckAll(e.target.checked)}
            />
          </Box>

          {data.length === 0 ? (
            <Typography sx={{ p: "10px" }}>查無資料</Typography>
          ) : (
            data.map((row) => (
              <Box key={row.id} sx={{ display: "grid", gridTemplateColumns: "100px 220px 220px 220px 1fr 48px", p: "10px", borderBottom: "1px solid #ddd" }}>
                <Typography>{row.date}</Typography>
                <Typography>{row.unit}</Typography>
                <Typography>{row.applicant}</Typography>
                <Typography>{row.formType}</Typography>
                <Typography>{row.content}</Typography>
                <Checkbox
                  checked={selectedIds.includes(row.id)}
                  onChange={(e) => handleCheckOne(row.id, e.target.checked)}
                />
              </Box>
            ))
          )}
        </Box>

        {/* MOBILE LIST */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          {data.length === 0 ? (
            <Typography sx={{ p: "10px" }}>查無資料</Typography>
          ) : (
            data.map((row) => (
              <Box key={row.id} sx={{ border: "1px solid #ddd", p: "12px", mb: "10px" }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Checkbox
                    checked={selectedIds.includes(row.id)}
                    onChange={(e) => handleCheckOne(row.id, e.target.checked)}
                  />
                </Box>

                <Field label="申請日期" value={row.date} />
                <Field label="單位" value={row.unit} />
                <Field label="申請人" value={row.applicant} />
                <Field label="表單類型" value={row.formType} />
                <Field label="內容" value={row.content} />
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
}