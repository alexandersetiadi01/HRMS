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

  const requestStart = dayjs(
    buildDateTimeString(startDate, startHour, startMin),
  );
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

export function isSpecialLeaveType(leaveType) {
  const raw = leaveType?.raw || leaveType || {};

  const category =
    raw.leave_category ||
    raw.category ||
    raw.type_category ||
    raw.leave_type_category ||
    raw.leave_kind ||
    raw.kind ||
    "";

  const isSpecial =
    raw.is_special ??
    raw.special ??
    raw.isSpecial ??
    raw.special_leave ??
    raw.is_special_leave ??
    raw.requires_entitlement ??
    raw.need_entitlement ??
    false;

  return (
    String(category).toLowerCase() === "special" ||
    String(category) === "特殊" ||
    String(category) === "特殊假" ||
    String(isSpecial) === "1" ||
    isSpecial === true ||
    String(isSpecial).toLowerCase() === "true"
  );
}

export function normalizeEntitlementInstances(payload) {
  const list = payload?.data?.data || payload?.data || payload || [];
  const items = Array.isArray(list) ? list : [];

  return items.map((item) => {
    const entitlementInstanceId =
      item?.entitlement_instance_id ??
      item?.instance_id ??
      item?.id ??
      item?.value ??
      "";

    const leaveTypeId =
      item?.leave_type_id ??
      item?.leaveTypeId ??
      item?.type_id ??
      item?.leave_type?.leave_type_id ??
      "";

    const leaveTypeName =
      item?.leave_type_name ??
      item?.leave_name ??
      item?.name ??
      item?.label ??
      item?.leave_type?.leave_type_name ??
      "";

    const remainingHoursValue =
      item?.remaining_hours ??
      item?.remainingHours ??
      item?.available_hours ??
      item?.availableHours ??
      item?.balance_hours ??
      item?.balanceHours ??
      item?.remaining_entitlement_hours ??
      item?.entitlement_remaining_hours ??
      "";

    const remainingDaysValue =
      item?.remaining_days ??
      item?.remainingDays ??
      item?.available_days ??
      item?.availableDays ??
      item?.balance_days ??
      item?.balanceDays ??
      item?.remaining_entitlement_days ??
      item?.entitlement_remaining_days ??
      "";

    const totalHoursValue =
      item?.total_hours ??
      item?.totalHours ??
      item?.entitlement_hours ??
      item?.entitlementHours ??
      item?.granted_hours ??
      item?.grantedHours ??
      "";

    const totalDaysValue =
      item?.total_days ??
      item?.totalDays ??
      item?.entitlement_days ??
      item?.entitlementDays ??
      item?.granted_days ??
      item?.grantedDays ??
      "";

    const status =
      item?.request_status ??
      item?.status ??
      item?.instance_status ??
      item?.approval_status ??
      "";

    return {
      ...item,
      entitlement_instance_id: String(entitlementInstanceId || ""),
      leave_type_id: String(leaveTypeId || ""),
      leave_type_name: String(leaveTypeName || ""),
      relation_type: String(
        item?.relation_type ||
          item?.condition_value ||
          item?.condition_label ||
          item?.kinship ||
          item?.kinship_label ||
          item?.relationship ||
          "",
      ),
      remaining_hours:
        remainingHoursValue === "" || remainingHoursValue === null
          ? null
          : Number(remainingHoursValue),
      remaining_days:
        remainingDaysValue === "" || remainingDaysValue === null
          ? null
          : Number(remainingDaysValue),
      total_hours:
        totalHoursValue === "" || totalHoursValue === null
          ? null
          : Number(totalHoursValue),
      total_days:
        totalDaysValue === "" || totalDaysValue === null
          ? null
          : Number(totalDaysValue),
      valid_from:
        item?.valid_from ||
        item?.validFrom ||
        item?.start_date ||
        item?.startDate ||
        "",
      valid_to:
        item?.valid_to ||
        item?.validTo ||
        item?.end_date ||
        item?.endDate ||
        "",
      status: String(status || ""),
      raw: item,
    };
  });
}

export function isApprovedEntitlementInstance(instance) {
  const status = safeText(instance?.status || instance?.request_status, "");

  if (!status) {
    return true;
  }

  return (
    status === "已核准" ||
    status === "approved" ||
    status === "核准" ||
    status === "有效"
  );
}

export function hasRemainingEntitlementBalance(instance) {
  const remainingHours = Number(instance?.remaining_hours);
  const remainingDays = Number(instance?.remaining_days);

  if (Number.isFinite(remainingHours) && remainingHours > 0) {
    return true;
  }

  if (Number.isFinite(remainingDays) && remainingDays > 0) {
    return true;
  }

  return false;
}

export function getEntitlementInstancesByLeaveType(instances = []) {
  return instances.reduce((map, instance) => {
    const leaveTypeId = String(instance?.leave_type_id || "");

    if (!leaveTypeId) {
      return map;
    }

    if (!map[leaveTypeId]) {
      map[leaveTypeId] = [];
    }

    map[leaveTypeId].push(instance);
    return map;
  }, {});
}

export function getUsableEntitlementInstances(instances = []) {
  return instances.filter((instance) => {
    return (
      isApprovedEntitlementInstance(instance) &&
      hasRemainingEntitlementBalance(instance)
    );
  });
}

export function getBestEntitlementInstanceForLeaveType(
  instances = [],
  leaveTypeId,
) {
  const key = String(leaveTypeId || "");
  const usable = getUsableEntitlementInstances(instances).filter((instance) => {
    return String(instance?.leave_type_id || "") === key;
  });

  if (usable.length <= 1) {
    return usable[0] || null;
  }

  return [...usable].sort((a, b) => {
    const aTo = safeText(a?.valid_to, "9999-12-31");
    const bTo = safeText(b?.valid_to, "9999-12-31");

    return aTo.localeCompare(bTo);
  })[0];
}

export function getSpecialLeaveEntitlementHours(instance) {
  const remainingHours = Number(instance?.remaining_hours);
  const totalHours = Number(instance?.total_hours);
  const remainingDays = Number(instance?.remaining_days);
  const totalDays = Number(instance?.total_days);

  if (Number.isFinite(remainingHours) && remainingHours > 0) {
    return remainingHours;
  }

  if (Number.isFinite(totalHours) && totalHours > 0) {
    return totalHours;
  }

  if (Number.isFinite(remainingDays) && remainingDays > 0) {
    return remainingDays * 8;
  }

  if (Number.isFinite(totalDays) && totalDays > 0) {
    return totalDays * 8;
  }

  return 0;
}

export function getSpecialLeaveRuleSettings(leaveType, instance = null) {
  const raw = leaveType?.raw || leaveType || {};
  const instanceRaw = instance?.raw || instance || {};

  return {
    mustBeContinuous:
      raw.must_be_continuous === true ||
      raw.must_be_continuous === 1 ||
      String(raw.must_be_continuous || "") === "1" ||
      String(raw.must_be_continuous || "") === "須連續一次休足" ||
      instanceRaw.must_be_continuous === true ||
      instanceRaw.must_be_continuous === 1 ||
      String(instanceRaw.must_be_continuous || "") === "1" ||
      String(instanceRaw.must_be_continuous || "") === "須連續一次休足",

    excludeHoliday:
      raw.exclude_holiday === true ||
      raw.exclude_holiday === 1 ||
      String(raw.exclude_holiday || "") === "1" ||
      instanceRaw.exclude_holiday === true ||
      instanceRaw.exclude_holiday === 1 ||
      String(instanceRaw.exclude_holiday || "") === "1",

    validFrom: instance?.valid_from || raw.valid_from || raw.validFrom || "",

    validTo: instance?.valid_to || raw.valid_to || raw.validTo || "",
  };
}

export function isDateWithinEntitlementRange(dateValue, instance) {
  const dateKey = getDateKey(dateValue);

  if (!dateKey) {
    return false;
  }

  const validFrom = safeText(instance?.valid_from, "");
  const validTo = safeText(instance?.valid_to, "");

  if (validFrom && dateKey < validFrom) {
    return false;
  }

  if (validTo && dateKey > validTo) {
    return false;
  }

  return true;
}

export function isWorkingDateForAutoContinuous({
  dateValue,
  scheduleMap = {},
  holidayDateSet = new Set(),
  approvedDateSet = new Set(),
  excludeHoliday = false,
}) {
  const dateKey = getDateKey(dateValue);

  if (!dateKey) {
    return false;
  }

  const weekday = dayjs(dateValue).day();

  if (approvedDateSet.has(dateKey)) {
    return false;
  }

  if (excludeHoliday) {
    if (weekday === 0 || weekday === 6) {
      return false;
    }

    if (holidayDateSet.has(dateKey)) {
      return false;
    }

    if (!scheduleMap?.[dateKey]) {
      return false;
    }
  }

  return true;
}

export function calculateContinuousSpecialLeaveEndDate({
  startDate,
  targetHours,
  formMeta,
  employeeId,
  holidayDateSet = new Set(),
  approvedDateSet = new Set(),
  excludeHoliday = false,
}) {
  const start = dayjs(startDate);

  if (!start.isValid()) {
    return "";
  }

  const hours = Number(targetHours || 0);

  if (!Number.isFinite(hours) || hours <= 0) {
    return start.format("YYYY-MM-DD");
  }

  const scheduleMap = resolveScheduleMap(formMeta, employeeId);
  let cursor = start;
  let accumulatedHours = 0;
  let safetyCounter = 0;

  while (safetyCounter < 370) {
    const dateKey = cursor.format("YYYY-MM-DD");

    if (
      isWorkingDateForAutoContinuous({
        dateValue: cursor,
        scheduleMap,
        holidayDateSet,
        approvedDateSet,
        excludeHoliday,
      })
    ) {
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

        const scheduleStart = combineDateAndTime(dateKey, scheduleStartText);
        const scheduleEnd = combineDateAndTime(dateKey, scheduleEndText);

        if (
          scheduleStart &&
          scheduleEnd &&
          scheduleEnd.valueOf() > scheduleStart.valueOf()
        ) {
          let dayMinutes = overlapMinutes(
            scheduleStart,
            scheduleEnd,
            scheduleStart,
            scheduleEnd,
          );

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

          const breakStart = combineDateAndTime(dateKey, breakStartText);
          const breakEnd = combineDateAndTime(dateKey, breakEndText);

          if (
            breakStart &&
            breakEnd &&
            breakEnd.valueOf() > breakStart.valueOf()
          ) {
            dayMinutes = Math.max(
              0,
              dayMinutes -
                overlapMinutes(
                  scheduleStart,
                  scheduleEnd,
                  breakStart,
                  breakEnd,
                ),
            );
          } else {
            dayMinutes = Math.max(
              0,
              dayMinutes - getScheduleBreakMinutes(schedule),
            );
          }

          accumulatedHours += roundToHalfHourHours(dayMinutes);
        }
      } else if (!excludeHoliday) {
        accumulatedHours += 8;
      }
    }

    if (accumulatedHours >= hours) {
      return dateKey;
    }

    cursor = cursor.add(1, "day");
    safetyCounter += 1;
  }

  return start.format("YYYY-MM-DD");
}
