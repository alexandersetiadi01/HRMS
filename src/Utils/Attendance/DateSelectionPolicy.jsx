export const DEFAULT_ATTENDANCE_DATE_POLICY = {
  allowHoliday: false,
  allowRestDay: false,
  allowLeave: false,
  allowUnscheduled: false,
  requireSchedule: true,
};

export function normalizeAttendanceDatePolicy(policy = {}) {
  return {
    ...DEFAULT_ATTENDANCE_DATE_POLICY,
    ...(policy || {}),
  };
}

export function isAttendanceDateSelectable(day, policy = {}) {
  if (!day) {
    return false;
  }

  const normalizedPolicy = normalizeAttendanceDatePolicy(policy);

  const dayType = String(day?.day_type || "").trim().toLowerCase();
  const scheduleId = Number(day?.schedule_id || 0);
  const shiftId = Number(day?.shift_id || 0);
  const hasSchedule = scheduleId > 0 || shiftId > 0;

  const holidayTypes = [
    "holiday",
    "public_holiday",
    "national_holiday",
    "fixed_holiday",
  ];

  const restDayTypes = [
    "rest",
    "rest_day",
    "weekend",
  ];

  if (holidayTypes.includes(dayType)) {
    return normalizedPolicy.allowHoliday;
  }

  if (restDayTypes.includes(dayType)) {
    return normalizedPolicy.allowRestDay;
  }

  if (dayType === "leave") {
    return normalizedPolicy.allowLeave;
  }

  if (dayType === "unscheduled") {
    return normalizedPolicy.allowUnscheduled;
  }

  if (normalizedPolicy.requireSchedule && !hasSchedule) {
    return false;
  }

  return ["normal", "support", "trip"].includes(dayType);
}

export function buildSelectableAttendanceDateSet(days = [], policy = {}) {
  const allowed = new Set();

  days.forEach((day) => {
    const dateKey = String(day?.work_date || "").trim();

    if (!dateKey) {
      return;
    }

    if (isAttendanceDateSelectable(day, policy)) {
      allowed.add(dateKey);
    }
  });

  return allowed;
}