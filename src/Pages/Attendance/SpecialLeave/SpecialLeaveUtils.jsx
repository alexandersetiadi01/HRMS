import dayjs from "dayjs";
import { getSpecialLeaveRules } from "../../../Utils/Attendance/SpecialLeaveRules";

export const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1];

export function unwrapPayload(response, fallback = null) {
  return response?.data?.data ?? response?.data ?? fallback;
}

export function toBoolean(value) {
  return value === true || value === 1 || value === "1";
}

export function toNumber(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

export function normalizeConditions(conditions = []) {
  if (!Array.isArray(conditions)) {
    return [];
  }

  return conditions
    .map((item) => ({
      conditionId: String(item?.condition_id || item?.condition_rule_id || ""),
      relationType: String(item?.relation_type || "").trim(),
      entitlementDays: toNumber(item?.entitlement_days, 0),
      entitlementHours: toNumber(item?.entitlement_hours, 0),
    }))
    .filter((item) => item.relationType);
}

export function normalizeSpecialLeaveOptions(response) {
  const payload = unwrapPayload(response, []);
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  return items
    .map((item) => {
      const label = String(item?.leave_name || item?.label || "").trim();

      return {
        value: String(item?.leave_type_id || item?.value || ""),
        label,
        requireAttachment: toBoolean(item?.require_attachment),
        requireEventDate: toBoolean(item?.require_event_date),
        requireRelationType: toBoolean(item?.require_relation_type),
        requireRequestYear: toBoolean(item?.require_request_year),
        requireStartEndDateTime: toBoolean(item?.require_start_end_dt),
        mustBeContinuous: toBoolean(item?.must_be_continuous),
        allowSplit: toBoolean(item?.allow_split),
        excludeNonWorkingDays: toBoolean(item?.exclude_non_working_days),
        useBalanceControl: toBoolean(item?.use_balance_control),
        validWindowMode: String(item?.valid_window_mode || ""),
        entitlementMode: String(item?.entitlement_mode || ""),
        entitlementDays: toNumber(item?.entitlement_days, 0),
        entitlementHours: toNumber(item?.entitlement_hours, 0),
        smallestUnitHours: toNumber(
          item?.smallest_unit_hours ?? item?.minimum_unit_hours,
          0,
        ),
        validBeforeDays: toNumber(item?.valid_before_days, 0),
        validAfterDays: toNumber(item?.valid_after_days, 0),
        extendedValidDays: toNumber(item?.extended_valid_days, 0),
        conditions: normalizeConditions(item?.conditions),
        rules: getSpecialLeaveRules(label),
      };
    })
    .filter((item) => item.value && item.label);
}

export function calculateEntitlementHours(source = {}) {
  const hours = toNumber(
    source.entitlementHours ?? source.entitlement_hours,
    0,
  );
  const days = toNumber(source.entitlementDays ?? source.entitlement_days, 0);

  if (hours > 0) {
    return hours;
  }

  if (days > 0) {
    return days * 8;
  }

  return 0;
}

export function formatHoursText(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return "";
  }

  const totalMinutes = Math.round(number * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours} 時 ${minutes} 分`;
}

export function getLeaveNameType(label) {
  const name = String(label || "");

  if (name.includes("婚")) return "marriage";
  if (name.includes("喪")) return "funeral";
  if (name.includes("家庭照顧")) return "family-care";
  if (name.includes("陪產")) return "maternity-checkup";
  if (name.includes("公傷")) return "injury-leave";
  if (name.includes("公假")) return "public";
  if (name.includes("無薪病假")) return "unpaid-sick";

  return "";
}

export function formatDateSlash(date) {
  const value = dayjs(date);

  if (!value.isValid()) {
    return "-";
  }

  return value.format("YYYY/MM/DD");
}

export function addDays(dateString, days) {
  const date = dayjs(dateString);

  if (!date.isValid()) {
    return null;
  }

  return date.add(Number(days || 0), "day");
}

export function getExpiryRange(dateString, beforeDays = 0, afterDays = 0) {
  if (!dateString) return "-";

  const start = addDays(dateString, beforeDays);
  const end = addDays(dateString, afterDays);

  if (!start || !end) {
    return "-";
  }

  return `${formatDateSlash(start)} ~ ${formatDateSlash(end)}`;
}

export function getMaternityCheckupExpiryRange(dateString) {
  return getExpiryRange(dateString, -300, 15);
}

export function getMarriageExpiryRange(dateString) {
  return getExpiryRange(dateString, -10, 80);
}

export function getFuneralExpiryDate(dateString) {
  if (!dateString) return "-";

  const end = addDays(dateString, 100);

  if (!end) {
    return "-";
  }

  return formatDateSlash(end);
}

export function getPublicLeaveTotal(
  startDate,
  startHour,
  startMinute,
  endDate,
  endHour,
  endMinute,
) {
  if (!startDate || !endDate) return "0 時 0 分";

  const start = dayjs(
    `${startDate}T${startHour || "00"}:${startMinute || "00"}:00`,
  );
  const end = dayjs(
    `${endDate}T${endHour || "00"}:${endMinute || "00"}:00`,
  );

  const diffMinutes = end.diff(start, "minute");

  if (!Number.isFinite(diffMinutes) || diffMinutes <= 0) {
    return "0 時 0 分";
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return `${hours} 時 ${minutes} 分`;
}

export function normalizeDateSet(source) {
  const set = new Set();

  if (Array.isArray(source)) {
    source.forEach((item) => {
      const value = typeof item === "string" ? item : item?.date || item?.work_date;

      if (value) {
        set.add(String(value).slice(0, 10));
      }
    });

    return set;
  }

  if (source && typeof source === "object") {
    Object.keys(source).forEach((key) => {
      if (source[key]) {
        set.add(String(key).slice(0, 10));
      }
    });
  }

  return set;
}

export function normalizeScheduleMap(response) {
  const payload = unwrapPayload(response, {});
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  const map = {};

  items.forEach((item) => {
    const workDate = String(item?.work_date || item?.date || "").slice(0, 10);

    if (workDate) {
      map[workDate] = item;
    }
  });

  return map;
}

export function isWeekendDate(dateString) {
  const date = dayjs(dateString);

  if (!date.isValid()) {
    return false;
  }

  const day = date.day();

  return day === 0 || day === 6;
}

export function getBackendErrorMessage(error) {
  const data = error?.response?.data;

  if (data?.message) {
    return data.message;
  }

  if (typeof data === "string") {
    return data;
  }

  if (error?.message) {
    return error.message;
  }

  return "送出特殊假別申請失敗，請稍後再試。";
}