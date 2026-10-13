import http from "./http";
import { getStoredAuthUser } from "./auth";

function unwrap(response, fallback = null) {
  return response?.data?.data ?? fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

async function safeGet(url, fallback) {
  try {
    const response = await http.get(url);
    return unwrap(response, fallback);
  } catch {
    return fallback;
  }
}

export function getCurrentEmployeeId() {
  const authUser = getStoredAuthUser();

  return Number(
    authUser?.employee?.employee_id ||
      authUser?.employee?.id ||
      authUser?.employee_id ||
      0
  );
}

export async function fetchHrmsAccounts() {
  const response = await http.get("/accounts");

  return safeArray(unwrap(response, []));
}

export async function createHrmsAccount(payload = {}) {
  const response = await http.post("/accounts", payload);

  return unwrap(response, {});
}

export async function updateHrmsAccount(employeeId, payload = {}) {
  const response = await http.put(
    `/accounts/${Number(employeeId)}`,
    payload,
  );

  return unwrap(response, {});
}

export async function deleteHrmsAccount(employeeId) {
  const response = await http.delete(
    `/accounts/${Number(employeeId)}`,
  );

  return unwrap(response, {});
}

export async function fetchHrmsAccountSystemRoles() {
  const roles = await safeGet("/system-roles", []);

  return safeArray(roles).filter((role) =>
    ["user", "admin"].includes(
      String(role?.role_code || "")
        .trim()
        .toLowerCase(),
    ),
  );
}

export async function fetchMyAccountProfile() {
  const employeeId = getCurrentEmployeeId();

  if (!employeeId) {
    throw new Error("找不到目前登入者對應的員工資料。");
  }

  const [
    employee,
    contact,
    military,
    identityDocuments,
    educations,
    certificates,
    experiences,
    jobRecords,
    accountSystemRoles,
    units,
    positions,
    systemRoles,
  ] = await Promise.all([
    safeGet(`/employees/${employeeId}`, {}),
    safeGet(`/employees/${employeeId}/contact`, {}),
    safeGet(`/employees/${employeeId}/military`, {}),
    safeGet(`/employees/${employeeId}/identity-documents`, []),
    safeGet(`/employees/${employeeId}/educations`, []),
    safeGet(`/employees/${employeeId}/certificates`, []),
    safeGet(`/employees/${employeeId}/experiences`, []),
    safeGet(`/employee-job-records?employee_id=${employeeId}`, []),
    safeGet(`/account-system-roles?employee_id=${employeeId}`, []),
    safeGet("/org-units", []),
    safeGet("/positions", []),
    safeGet("/system-roles", []),
  ]);

  return {
    employeeId,
    employee: employee || {},
    contact: contact || {},
    military: military || {},
    identityDocuments: safeArray(identityDocuments),
    educations: safeArray(educations),
    certificates: safeArray(certificates),
    experiences: safeArray(experiences),
    jobRecords: safeArray(jobRecords),
    accountSystemRoles: safeArray(accountSystemRoles),
    lookups: {
      units: safeArray(units),
      positions: safeArray(positions),
      systemRoles: safeArray(systemRoles),
    },
  };
}