import { formatDateKey } from "./DateHelpers";
import { isWeekend } from "../TaiwanHolidays";

export function getOfficialCalendarInfo(date, holidayMap) {
  if (!date || !holidayMap) return null;
  return holidayMap[formatDateKey(date)] || null;
}

export function getDayType(date, holidayMap) {
  if (!date) return "empty";

  const officialInfo = getOfficialCalendarInfo(date, holidayMap);

  if (officialInfo) {
    return officialInfo.isHoliday ? "holiday" : "normal";
  }

  if (isWeekend(date)) return "holiday";

  return "normal";
}

export function getDisplayHolidayName(date, holidayMap) {
  if (!date) return "";

  const officialInfo = getOfficialCalendarInfo(date, holidayMap);

  if (officialInfo?.isHoliday) {
    return officialInfo.description || officialInfo.name || "國定假日";
  }

  if (isWeekend(date)) {
    return "休息日";
  }

  return "";
}

export function getShiftData(date, holidayMap, scheduleDayMap = {}) {
  if (!date) return null;

  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;

  const scheduleDay = scheduleDayMap?.[key] || null;

  if (scheduleDay) {
    return {
      title: scheduleDay.title || "常日班",
      time: scheduleDay.time || "",
      blockBg: scheduleDay.block_bg || "#f2ac6d",
      textColor: scheduleDay.text_color || "#ffffff",
      peopleColor: scheduleDay.people_color || "#f29a4a",
      filterKey: scheduleDay.filter_key || "normal",
      dayType: scheduleDay.day_type || "normal",
    };
  }

  if (getDayType(date, holidayMap) === "holiday") {
    return {
      title: "休息日",
      time: "",
      blockBg: "#9e9ea3",
      textColor: "#ffffff",
      peopleColor: "#a9a9a9",
      filterKey: "rest",
      dayType: "holiday",
    };
  }

  return {
    title: "常日班",
    time: "09:00~18:00",
    blockBg: "#f2ac6d",
    textColor: "#ffffff",
    peopleColor: "#f29a4a",
    filterKey: "normal",
    dayType: "normal",
  };
}