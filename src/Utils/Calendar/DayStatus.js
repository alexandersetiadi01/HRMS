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

export function getShiftData(date, holidayMap) {
  if (!date) return null;

  if (getDayType(date, holidayMap) === "holiday") {
    return {
      title: "休息日",
      time: "",
      blockBg: "#9e9ea3",
      textColor: "#ffffff",
      peopleColor: "#a9a9a9",
    };
  }

  return {
    title: "常日班",
    time: "09:00~18:00",
    blockBg: "#f2ac6d",
    textColor: "#ffffff",
    peopleColor: "#f29a4a",
  };
}