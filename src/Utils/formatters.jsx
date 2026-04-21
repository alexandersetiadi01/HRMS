export function formatLocation(value) {
  const map = {
    office: "辦公室",
    company: "公司",
  };

  return map[value] || value || "-";
}

export function formatLeaveType(value) {
  const map = {
    "personal leave": "事假",
    personal_leave: "事假",
    sick_leave: "病假",
    annual_leave: "特休",
  };

  return map[value] || value || "-";
}

export function formatOvertimeType(value) {
  const map = {
    after_work: "平日",
    weekday: "平日",
    "rest-day": "休假日",
    rest_day: "休假日",
    "national-holiday": "國定假日",
    national_holiday: "國定假日",
  };

  return map[value] || value || "-";
}

export function formatPaymentMethod(value) {
  const map = {
    pay: "加班費",
    cash: "加班費",
    overtime_pay: "加班費",
    "overtime-pay": "加班費",
    leave: "補休",
    comp_leave: "補休",
    "comp-leave": "補休",
  };

  return map[value] || value || "-";
}