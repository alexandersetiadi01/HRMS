export const UNIT_OPTIONS = [
  { value: "", label: "請選擇" },
  { value: "D001/總經理", label: "D001/總經理" },
  { value: "D002/業務部", label: "D002/業務部" },
  { value: "D003/品牌部", label: "D003/品牌部" },
  { value: "DL/導入期單位", label: "DL/導入期單位" },
];

export const EMPLOYEE_OPTIONS = [
  { value: "", label: "請選擇" },
  { value: "14001/李偉銘", label: "14001/李偉銘" },
  { value: "15001/郭姿敏", label: "15001/郭姿敏" },
  { value: "17001/王穎傑", label: "17001/王穎傑" },
  { value: "19001/周欣慈", label: "19001/周欣慈" },
  { value: "25001/錢敏雯", label: "25001/錢敏雯" },
  { value: "25002/許明城", label: "25002/許明城" },
  { value: "25004/張亭灝", label: "25004/張亭灝" },
  { value: "D0000/導入中", label: "D0000/導入中" },
];

export const COMMON_SELECT_MENU_PROPS = {
  PaperProps: {
    sx: {
      mt: "2px",
      borderRadius: "2px",
      boxShadow: "none",
      border: "1px solid #cfcfcf",
      maxHeight: 260,
      "& .MuiMenuItem-root": {
        minHeight: "36px",
        fontSize: "15px",
        color: "#374151",
      },
      "& .Mui-selected": {
        bgcolor: "#dbe5f1 !important",
        color: "#111827",
      },
      "& .MuiMenuItem-root:hover": {
        bgcolor: "#eef3f8",
      },
    },
  },
};

export const COMMON_SELECT_SX = {
  height: "32px",
  fontSize: "15px",
  bgcolor: "#ffffff",
  "& .MuiSelect-select": {
    py: "4px",
  },
};

export const ACTION_BUTTON_SX = {
  minWidth: { xs: "60px", sm: "50px" },
  height: "32px",
  px: "14px",
  borderColor: "#9ca3af",
  color: "#111827",
  fontSize: "15px",
  borderRadius: "4px",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

export function getApplicationRecordYearOptions(currentYear) {
  return Array.from({ length: 5 }, (_, index) => String(currentYear - 3 + index));
}

export function getApplicationRecordMonthOptions() {
  return Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0")
  );
}