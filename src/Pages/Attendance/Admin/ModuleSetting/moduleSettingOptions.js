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

export const CALENDAR_STATUS_OPTIONS = [
  { value: "draft", label: "草稿" },
  { value: "published", label: "已發布" },
  { value: "inactive", label: "停用" },
];

export const CALENDAR_STATUS_FILTER_OPTIONS = [
  { value: "", label: "全部狀態" },
  ...CALENDAR_STATUS_OPTIONS,
];

export function getCalendarStatusLabel(value) {
  return CALENDAR_STATUS_OPTIONS.find((item) => item.value === value)?.label || value || "-";
}

export function createCalendarYearOptions(startYear, endYear) {
  const start = Number(startYear || 0);
  const end = Number(endYear || 0);

  if (!start || !end || end < start) return [];

  return Array.from({ length: end - start + 1 }, (_, index) => {
    const year = end - index;

    return {
      value: String(year),
      label: `${year} 年`,
    };
  });
}

export const CALENDAR_DATE_TYPE_OPTIONS = [
  { value: "workday", label: "工作日", color: "#ffffff", textColor: "#111827" },
  { value: "special_workday", label: "特殊上班日", color: "#dbeafe", textColor: "#1d4ed8" },
  { value: "rest_day", label: "休息日", color: "#f3f4f6", textColor: "#6b7280" },
  { value: "regular_holiday", label: "例假日", color: "#fef3c7", textColor: "#92400e" },
  { value: "national_holiday", label: "國定假日", color: "#fee2e2", textColor: "#b91c1c" },
];

export const CALENDAR_OVERRIDE_TYPE_OPTIONS = CALENDAR_DATE_TYPE_OPTIONS.filter(
  (item) => item.value !== "workday",
);

export function getCalendarDateTypeOption(value) {
  return CALENDAR_DATE_TYPE_OPTIONS.find((item) => item.value === value) || null;
}

export const SHIFT_GROUP_STATUS_OPTIONS = [
  { value: "active", label: "啟用" },
  { value: "inactive", label: "停用" },
];

export const SHIFT_GROUP_STATUS_FILTER_OPTIONS = [
  { value: "", label: "全部狀態" },
  ...SHIFT_GROUP_STATUS_OPTIONS,
];