import dayjs from "dayjs";

export function safeText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text !== "" ? text : fallback;
}

export function getTaiwanTodayDayjs() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value || "";
  const month = parts.find((part) => part.type === "month")?.value || "";
  const day = parts.find((part) => part.type === "day")?.value || "";

  return dayjs(`${year}-${month}-${day}`);
}

export function pad2(value) {
  return String(value).padStart(2, "0");
}

export function buildDateTimeString(dateValue, hour, minute) {
  if (!dateValue) {
    return "";
  }

  const date =
    typeof dateValue === "string"
      ? dateValue
      : dayjs(dateValue).isValid()
        ? dayjs(dateValue).format("YYYY-MM-DD")
        : "";

  if (!date) {
    return "";
  }

  return `${date} ${pad2(hour)}:${pad2(minute)}:00`;
}

export function formatHoursText(value) {
  const num = Number(value || 0);

  if (!Number.isFinite(num) || num <= 0) {
    return "0 小時";
  }

  const totalMinutes = Math.round(num * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} 小時`;
  }

  return `${hours} 小時 ${minutes} 分`;
}

export function formatHoursSummaryText(value) {
  const num = Number(value || 0);

  if (!Number.isFinite(num) || num <= 0) {
    return "0 時 0 分";
  }

  const totalMinutes = Math.round(num * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours} 時 ${minutes} 分`;
}

export function normalizeLeaveTypes(payload) {
  const list = payload?.data?.data || payload?.data || payload || [];
  const items = Array.isArray(list) ? list : [];

  return items.map((item, index) => {
    const value =
      item?.leave_type_id ??
      item?.id ??
      item?.leaveTypeId ??
      item?.value ??
      index + 1;

    const label =
      item?.leave_type_name ||
      item?.leave_name ||
      item?.name ||
      item?.label ||
      `假別 ${index + 1}`;

    return {
      value: String(value),
      label: String(label),
      raw: item,
    };
  });
}

export function normalizeDateSet(input) {
  const set = new Set();

  if (Array.isArray(input)) {
    input.forEach((item) => {
      const value = safeText(item, "");
      if (value) {
        set.add(value);
      }
    });
    return set;
  }

  if (input && typeof input === "object") {
    Object.entries(input).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          const normalized = safeText(item, "");
          if (normalized) {
            set.add(normalized);
          }
        });
      } else if (value && typeof value === "object") {
        Object.keys(value).forEach((nestedKey) => {
          const normalized = safeText(nestedKey, "");
          if (normalized) {
            set.add(normalized);
          }
        });
      } else if (value) {
        const normalizedKey = safeText(key, "");
        if (normalizedKey) {
          set.add(normalizedKey);
        }
      }
    });
  }

  return set;
}

export function getLeaveMinimumText(leaveType) {
  const unitHours =
    leaveType?.minimum_unit_hours ??
    leaveType?.minimumHours ??
    leaveType?.min_hours ??
    leaveType?.minHours ??
    "";

  if (unitHours === "" || unitHours === null || unitHours === undefined) {
    return "(申請時數將依後端規則自動計算)";
  }

  return `(至少須申請 ${formatHoursSummaryText(unitHours)} 且申請時數須為 ${formatHoursSummaryText(unitHours)} 的倍數)`;
}

export function getEmployeeScopedMap(source, employeeId) {
  if (!source || typeof source !== "object") {
    return {};
  }

  const key = String(employeeId || "");
  const scoped = source[key];

  if (scoped && typeof scoped === "object") {
    return scoped;
  }

  return source;
}

export function getDateKey(dateValue) {
  if (!dateValue || !dayjs(dateValue).isValid()) {
    return "";
  }

  return dayjs(dateValue).format("YYYY-MM-DD");
}

export function combineDateAndTime(dateKey, timeValue) {
  const text = safeText(timeValue, "");

  if (!dateKey || !text) {
    return null;
  }

  if (text.includes("T") || text.includes(" ")) {
    const dt = dayjs(text);
    return dt.isValid() ? dt : null;
  }

  const normalized = text.length === 5 ? `${text}:00` : text;
  const dt = dayjs(`${dateKey} ${normalized}`);

  return dt.isValid() ? dt : null;
}

export function resolveScheduleMap(formMeta, employeeId) {
  const source =
    formMeta?.leave_schedule_map ||
    formMeta?.schedule_map ||
    formMeta?.employee_schedule_map ||
    {};

  return getEmployeeScopedMap(source, employeeId);
}

export function resolveScheduleForDate(scheduleMap, dateKey) {
  if (!dateKey) {
    return null;
  }

  return scheduleMap?.[dateKey] || null;
}

export function getScheduleTime(schedule, keys = []) {
  for (const key of keys) {
    const value = safeText(schedule?.[key], "");
    if (value) {
      return value;
    }
  }

  return "";
}

export function getScheduleBreakMinutes(schedule) {
  const value =
    schedule?.break_minutes ??
    schedule?.rest_minutes ??
    schedule?.breakMinutes ??
    schedule?.restMinutes ??
    0;

  const num = Number(value || 0);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

export function overlapMinutes(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) {
    return 0;
  }

  const start = Math.max(startA.valueOf(), startB.valueOf());
  const end = Math.min(endA.valueOf(), endB.valueOf());

  if (end <= start) {
    return 0;
  }

  return Math.round((end - start) / 60000);
}

export function roundToHalfHourHours(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 0;
  }

  const rounded = Math.round(minutes / 30) * 30;
  return rounded / 60;
}

export function calculateLeaveHoursFromSchedule({
  startDate,
  startHour,
  startMin,
  endDate,
  endHour,
  endMin,
  formMeta,
  employeeId,
}) {
  if (
    !startDate ||
    !endDate ||
    !dayjs(startDate).isValid() ||
    !dayjs(endDate).isValid()
  ) {
    return 0;
  }

  const requestStart = dayjs(buildDateTimeString(startDate, startHour, startMin));
  const requestEnd = dayjs(buildDateTimeString(endDate, endHour, endMin));

  if (!requestStart.isValid() || !requestEnd.isValid()) {
    return 0;
  }

  if (requestEnd.valueOf() <= requestStart.valueOf()) {
    return 0;
  }

  const scheduleMap = resolveScheduleMap(formMeta, employeeId);
  let cursor = dayjs(startDate);
  const last = dayjs(endDate);
  let totalMinutes = 0;

  while (cursor.isBefore(last) || cursor.isSame(last, "day")) {
    const dateKey = cursor.format("YYYY-MM-DD");
    const schedule = resolveScheduleForDate(scheduleMap, dateKey);

    if (schedule) {
      const scheduleStartText = getScheduleTime(schedule, [
        "expected_start",
        "actual_start",
        "shift_start_time",
        "start_time",
      ]);

      const scheduleEndText = getScheduleTime(schedule, [
        "expected_end",
        "actual_end",
        "shift_end_time",
        "end_time",
      ]);

      const breakStartText = getScheduleTime(schedule, [
        "break_start_time",
        "rest_start_time",
        "rest_start_datetime",
      ]);

      const breakEndText = getScheduleTime(schedule, [
        "break_end_time",
        "rest_end_time",
        "rest_end_datetime",
      ]);

      const scheduleStart = combineDateAndTime(dateKey, scheduleStartText);
      const scheduleEnd = combineDateAndTime(dateKey, scheduleEndText);

      if (
        scheduleStart &&
        scheduleEnd &&
        scheduleEnd.valueOf() > scheduleStart.valueOf()
      ) {
        let dayMinutes = overlapMinutes(
          requestStart,
          requestEnd,
          scheduleStart,
          scheduleEnd,
        );

        if (dayMinutes > 0) {
          const breakStart = combineDateAndTime(dateKey, breakStartText);
          const breakEnd = combineDateAndTime(dateKey, breakEndText);

          if (
            breakStart &&
            breakEnd &&
            breakEnd.valueOf() > breakStart.valueOf()
          ) {
            const breakOverlap = overlapMinutes(
              requestStart,
              requestEnd,
              breakStart,
              breakEnd,
            );
            dayMinutes = Math.max(0, dayMinutes - breakOverlap);
          } else {
            const breakMinutes = getScheduleBreakMinutes(schedule);
            const fullShiftMinutes = overlapMinutes(
              scheduleStart,
              scheduleEnd,
              scheduleStart,
              scheduleEnd,
            );

            if (breakMinutes > 0 && dayMinutes >= fullShiftMinutes) {
              dayMinutes = Math.max(0, dayMinutes - breakMinutes);
            }
          }
        }

        totalMinutes += dayMinutes;
      }
    }

    cursor = cursor.add(1, "day");
  }

  return roundToHalfHourHours(totalMinutes);
}

export function getRemainingHoursValue(balanceMap, leaveTypeId, employeeId) {
  const scopedBalanceMap = getEmployeeScopedMap(balanceMap, employeeId);
  const key = String(leaveTypeId || "");
  const source = scopedBalanceMap?.[key];

  if (!source || typeof source !== "object") {
    return null;
  }

  const remaining =
    source.remaining_hours ??
    source.remainingHours ??
    source.available_hours ??
    source.availableHours ??
    source.balance_hours ??
    source.balanceHours;

  if (remaining === null || remaining === undefined || remaining === "") {
    return null;
  }

  const num = Number(remaining);
  return Number.isFinite(num) ? num : null;
}

export function formatBalanceMap(balanceMap, leaveTypeId, employeeId) {
  const remaining = getRemainingHoursValue(balanceMap, leaveTypeId, employeeId);

  if (remaining === null) {
    return "剩餘：- 時 - 分";
  }

  const totalMinutes = Math.round(remaining * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `剩餘：${hours} 小時 ${minutes} 分`;
}