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
    systemRoleLinks,
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
    safeGet(`/employee-system-roles?employee_id=${employeeId}`, []),
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
    systemRoleLinks: safeArray(systemRoleLinks),
    lookups: {
      units: safeArray(units),
      positions: safeArray(positions),
      systemRoles: safeArray(systemRoles),
    },
  };
}