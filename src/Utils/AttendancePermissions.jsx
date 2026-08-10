const STAFF_ATTENDANCE_SYSTEM_ROLES = [
  "admin",
  "manager",
  "supervisor",
];

const STAFF_ATTENDANCE_WORDPRESS_ROLES = [
  "administrator",
  "hrms_admin",
  "hrms_manager",
  "hrms_supervisor",
];

function normalizeRole(value) {
  return String(value || "").trim().toLowerCase();
}

export function getAuthUserSystemRole(authUser) {
  return normalizeRole(
    authUser?.employee?.system_role?.role_code,
  );
}

export function getAuthUserWordPressRoles(authUser) {
  return Array.isArray(authUser?.roles)
    ? authUser.roles.map(normalizeRole).filter(Boolean)
    : [];
}

export function canViewStaffAttendance(authUser) {
  const systemRole = getAuthUserSystemRole(authUser);

  if (
    STAFF_ATTENDANCE_SYSTEM_ROLES.includes(systemRole)
  ) {
    return true;
  }

  const wordpressRoles =
    getAuthUserWordPressRoles(authUser);

  return wordpressRoles.some((role) =>
    STAFF_ATTENDANCE_WORDPRESS_ROLES.includes(role),
  );
}