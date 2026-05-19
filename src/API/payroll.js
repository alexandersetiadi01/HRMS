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