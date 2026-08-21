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

export function getAttendancePermissionCodes(authUser) {
  return Array.isArray(authUser?.attendance_permission_codes)
    ? authUser.attendance_permission_codes
        .map((code) => String(code || "").trim())
        .filter(Boolean)
    : [];
}

export function hasAttendancePermission(authUser, permissionCode) {
  const code = String(permissionCode || "").trim();

  if (!code) {
    return false;
  }

  return getAttendancePermissionCodes(authUser).includes(code);
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

export function getScheduleManagerUnitIds(authUser) {
  const unitIds = Array.isArray(
    authUser?.schedule_manager_unit_ids,
  )
    ? authUser.schedule_manager_unit_ids
    : [];

  return Array.from(
    new Set(
      unitIds
        .map((unitId) => Number(unitId || 0))
        .filter((unitId) => unitId > 0),
    ),
  );
}

export function canManageAttendanceSchedule(authUser) {
  return authUser?.can_manage_schedule === true;
}