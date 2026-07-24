import http from "./http";

const PAYROLL_VERIFICATION_HEADER = "X-HRMS-Payroll-Verification";

function unwrapResponse(response, fallback = null) {
  let payload = response?.data;

  while (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  ) {
    payload = payload.data;
  }

  return payload ?? fallback;
}

function buildParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    }),
  );
}

function normalizePayslipDetail(detail, payrollResultId) {
  if (Array.isArray(detail)) {
    detail =
      detail.find(
        (item) => String(item?.payroll_result_id || item?.id) === String(payrollResultId),
      ) || null;
  }

  if (!detail || typeof detail !== "object") {
    return null;
  }

  const normalizedId = detail.payroll_result_id || detail.id || detail.result_id;

  if (!normalizedId) {
    return null;
  }

  return {
    ...detail,
    payroll_result_id: normalizedId,
    employee: detail.employee || {},
    earnings: Array.isArray(detail.earnings) ? detail.earnings : [],
    deductions: Array.isArray(detail.deductions) ? detail.deductions : [],
    summary: detail.summary || {},
    notes: detail.notes || { common: [], personal: [] },
  };
}

function getFilenameFromDisposition(disposition, fallback) {
  const raw = String(disposition || "");

  const utf8Match = raw.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const filenameMatch = raw.match(/filename="?([^"]+)"?/i);
  if (filenameMatch?.[1]) {
    return filenameMatch[1];
  }

  return fallback;
}

function downloadBlobResponse(response, fallbackFilename) {
  const blob = response?.data;
  const disposition = response?.headers?.["content-disposition"];
  const filename = getFilenameFromDisposition(disposition, fallbackFilename);

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

export async function getPayrollRanges(params = {}) {
  const response = await http.get("/payroll-ranges", {
    params: buildParams({
      status: params.status,
    }),
  });

  return unwrapResponse(response, []);
}

export async function getPayrollRange(payrollRangeId) {
  const response = await http.get(
    `/payroll-ranges/${payrollRangeId}`,
  );

  return unwrapResponse(response, null);
}

export async function createPayrollRange(payload) {
  const response = await http.post(
    "/payroll-ranges",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updatePayrollRange(
  payrollRangeId,
  payload,
) {
  const response = await http.put(
    `/payroll-ranges/${payrollRangeId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deletePayrollRange(
  payrollRangeId,
) {
  const response = await http.delete(
    `/payroll-ranges/${payrollRangeId}`,
  );

  return unwrapResponse(response, null);
}



export async function getPayrollPeriods(params = {}) {
  const response = await http.get("/payroll-periods", {
    params: buildParams({
      payroll_range_id: params.payroll_range_id,
    }),
  });

  return unwrapResponse(response, []);
}

export async function createPayrollPeriod(payload) {
  const response = await http.post("/payroll-periods", payload);

  return unwrapResponse(response, null);
}

export async function getPayrollPeriod(payrollPeriodId) {
  const response = await http.get(
    `/payroll-periods/${payrollPeriodId}`,
  );

  return unwrapResponse(response, null);
}

export async function updatePayrollPeriod(
  payrollPeriodId,
  payload,
) {
  const response = await http.put(
    `/payroll-periods/${payrollPeriodId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deletePayrollPeriod(
  payrollPeriodId,
) {
  const response = await http.delete(
    `/payroll-periods/${payrollPeriodId}`,
  );

  return unwrapResponse(response, null);
}

export async function getPayrollRuns(params = {}) {
  const response = await http.get("/payroll-runs", {
    params: buildParams({
      payroll_period_id: params.payroll_period_id,
      payroll_range_id: params.payroll_range_id,
    }),
  });

  return unwrapResponse(response, []);
}

export async function createPayrollRun(payload) {
  const response = await http.post("/payroll-runs", payload);

  return unwrapResponse(response, null);
}

export async function getPayrollRunReadiness(
  payrollRunId,
) {
  const response = await http.get(
    `/payroll-runs/${payrollRunId}/readiness`,
  );

  return unwrapResponse(response, {
    summary: {},
    employees: [],
  });
}

export async function getPayrollRunResults(
  payrollRunId,
) {
  const response = await http.get(
    `/payroll-runs/${payrollRunId}/results`,
  );

  return unwrapResponse(response, {
    summary: {},
    missing_employees: [],
    results: [],
  });
}

export async function approvePayrollRun(
  payrollRunId,
) {
  const response = await http.post(
    `/payroll-runs/${payrollRunId}/approve`,
  );

  return unwrapResponse(response, null);
}

export async function closePayrollRun(
  payrollRunId,
) {
  const response = await http.post(
    `/payroll-runs/${payrollRunId}/close`,
  );

  return unwrapResponse(response, null);
}

export async function calculatePayrollRun(
  payrollRunId,
  employeeIds,
) {
  const response = await http.post(
    `/payroll-runs/${payrollRunId}/calculate`,
    {
      employee_ids: Array.isArray(employeeIds)
        ? employeeIds.map(Number)
        : [],
    },
  );

  return unwrapResponse(response, {
    payroll_run_id: payrollRunId,
    calculated_count: 0,
    calculated: [],
    errors: [],
  });
}

export async function getPayrollResults(params = {}) {
  const response = await http.get("/payroll-results", {
    params: buildParams({
      payroll_run_id: params.payroll_run_id,
      employee_id: params.employee_id,
    }),
  });

  return unwrapResponse(response, []);
}

export async function approvePayrollResult(payrollResultId) {
  const response = await http.post(
    `/payroll-results/${payrollResultId}/approve`,
  );

  return unwrapResponse(response, null);
}

export async function markPayrollResultPaid(payrollResultId) {
  const response = await http.post(
    `/payroll-results/${payrollResultId}/mark-paid`,
  );

  return unwrapResponse(response, null);
}

export async function getPayrollResultLines(
  payrollResultId,
) {
  const response = await http.get(
    "/payroll-result-lines",
    {
      params: {
        payroll_result_id: payrollResultId,
      },
    },
  );

  return unwrapResponse(response, []);
}

export async function getPayrollExtraItems(params = {}) {
  const response = await http.get(
    "/payroll-extra-items",
    {
      params: buildParams({
        payroll_run_id: params.payroll_run_id,
        employee_id: params.employee_id,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function createPayrollExtraItem(payload) {
  const response = await http.post(
    "/payroll-extra-items",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function getPayrollItems() {
  const response = await http.get("/payroll-items");

  return unwrapResponse(response, []);
}

export async function createPayrollItem(payload) {
  const response = await http.post(
    "/payroll-items",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updatePayrollItem(
  payrollItemId,
  payload,
) {
  const response = await http.put(
    `/payroll-items/${payrollItemId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deletePayrollItem(
  payrollItemId,
) {
  const response = await http.delete(
    `/payroll-items/${payrollItemId}`,
  );

  return unwrapResponse(response, null);
}

export async function getPayrollOvertimeTaxSettings() {
  const response = await http.get(
    "/payroll-overtime-tax-settings",
  );

  return unwrapResponse(response, {
    setting: null,
    rules: [],
  });
}

export async function updatePayrollOvertimeTaxSettings(
  payload,
) {
  const response = await http.put(
    "/payroll-overtime-tax-settings",
    payload,
  );

  return unwrapResponse(response, {
    setting: null,
    rules: [],
  });
}

export async function getEmployeeSalaryRecords(
  employeeId = null,
) {
  const response = await http.get("/salary-records", {
    params: buildParams({
      employee_id: employeeId,
    }),
  });

  return unwrapResponse(response, []);
}

export async function getSalaryRecordItems(
  salaryRecordId = null,
) {
  const response = await http.get("/salary-items", {
    params: buildParams({
      salary_record_id: salaryRecordId,
    }),
  });

  return unwrapResponse(response, []);
}

export async function verifyPayrollPassword(password) {
  const response = await http.post("/payroll/verify-password", {
    password,
  });

  return unwrapResponse(response, null);
}

export async function getMyPayslips() {
  const response = await http.get("/payroll/my-payslips");

  return unwrapResponse(response, []);
}

export async function getMyPayslipDetail(payrollResultId, verificationToken) {
  const response = await http.get(`/payroll/my-payslips/${payrollResultId}`, {
    headers: {
      [PAYROLL_VERIFICATION_HEADER]: verificationToken,
    },
  });

  const detail = unwrapResponse(response, null);

  return normalizePayslipDetail(detail, payrollResultId);
}

export async function downloadMyPayslipAttendance(
  payrollResultId,
  verificationToken,
) {
  const response = await http.get(
    `/payroll/my-payslips/${payrollResultId}/attendance-export`,
    {
      headers: {
        [PAYROLL_VERIFICATION_HEADER]: verificationToken,
      },
      responseType: "blob",
    },
  );

  downloadBlobResponse(response, "出勤明細.xlsx");

  return response;
}

export async function downloadMyPayslipExcel(
  payrollResultId,
  verificationToken,
) {
  const response = await http.get(
    `/payroll/my-payslips/${payrollResultId}/payslip-export`,
    {
      headers: {
        [PAYROLL_VERIFICATION_HEADER]: verificationToken,
      },
      responseType: "blob",
    },
  );

  downloadBlobResponse(response, "薪資明細.xlsx");

  return response;
}

export { PAYROLL_VERIFICATION_HEADER };