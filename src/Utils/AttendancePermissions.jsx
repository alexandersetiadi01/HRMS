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

  if (authUser?.is_admin_access === true) {
    return true;
  }

  return getAttendancePermissionCodes(authUser).includes(code);
}

export function hasAnyAttendancePermission(
  authUser,
  permissionCodes = [],
) {
  if (authUser?.is_admin_access === true) {
    return true;
  }

  return (Array.isArray(permissionCodes)
    ? permissionCodes
    : []
  ).some((permissionCode) =>
    hasAttendancePermission(
      authUser,
      permissionCode,
    ),
  );
}

export function canViewStaffAttendance(authUser) {
  return hasAttendancePermission(
    authUser,
    "attendance_staff_view",
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
  return (
    authUser?.is_admin_access === true ||
    authUser?.can_manage_schedule === true
  );
}