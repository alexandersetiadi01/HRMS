export function formatLocation(value) {
  const map = {
    office: "公司",
    company: "公司",
    公司: "公司",
    other: "其他",
    其他: "其他",
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
    after_work: "下班後",
    weekday: "平日",
    "rest-day": "休假日",
    rest_day: "休假日",
    "national-holiday": "國定假日",
    national_holiday: "國定假日",
    下班後: "下班後",
    上班前: "上班前",
    假日加班: "假日加班",
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
    加班費: "加班費",
    補休: "補休",
  };

  return map[value] || value || "-";
}