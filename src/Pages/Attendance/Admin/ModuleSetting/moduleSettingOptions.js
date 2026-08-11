export const MODULE_TABS = [
  { value: "permissions", label: "權限設定" },
  { value: "approval", label: "簽核設定" },
  { value: "form-parameters", label: "表單參數" },
];

export const FORM_PARAMETER_ITEMS = [
  { value: "calendar", label: "行事曆管理" },
  { value: "shift", label: "班次" },
  { value: "shift-group", label: "班別" },
  { value: "leave-types", label: "假別名稱維護" },
  { value: "attendance-rules", label: "出勤規則設定", expandable: true },
  { value: "clock-settings", label: "打卡設定" },
  { value: "unit-settings", label: "單位參數設定" },
];

export const ATTENDANCE_RULE_ITEMS = [
  { value: "leave", label: "假別規則" },
  { value: "clock", label: "打卡規則" },
  { value: "overtime", label: "加班規則" },
  { value: "schedule", label: "排班規則" },
  { value: "outing", label: "公出規則" },
  { value: "business-trip", label: "出差規則" },
];

export const ENABLE_STATUS_OPTIONS = [
  { value: "啟用", label: "啟用" },
  { value: "停用", label: "停用" },
];

export const ENABLE_STATUS_FILTER_OPTIONS = [
  { value: "", label: "全部狀態" },
  ...ENABLE_STATUS_OPTIONS,
];

export const YES_NO_OPTIONS = [
  { value: "0", label: "否" },
  { value: "1", label: "是" },
];

export const WORKDAY_OPTIONS = [
  { value: "1", label: "工作日" },
  { value: "0", label: "非工作日" },
];

export const SHIFT_COLOR_OPTIONS = [
  { value: "#3b82f6", label: "藍色", color: "#3b82f6" },
  { value: "#22c55e", label: "綠色", color: "#22c55e" },
  { value: "#f59e0b", label: "橘色", color: "#f59e0b" },
  { value: "#ef4444", label: "紅色", color: "#ef4444" },
  { value: "#8b5cf6", label: "紫色", color: "#8b5cf6" },
  { value: "#06b6d4", label: "青色", color: "#06b6d4" },
  { value: "#64748b", label: "灰色", color: "#64748b" },
  { value: "#111827", label: "黑色", color: "#111827" },
];

export function getShiftColorOption(value) {
  return SHIFT_COLOR_OPTIONS.find((item) => item.value === value) || null;
}