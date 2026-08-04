export const PAYROLL_PERMISSION_CODES = [
  "payroll_view",
  "payroll_settings_manage",
  "payroll_calculate",
  "payroll_close",
  "payroll_approve",
  "payroll_mark_paid",
  "payroll_reports_view",
  "payroll_tax_insurance_manage",
  "payroll_permissions_manage",
];

const PAYROLL_NAVIGATION_PERMISSION_MAP = {
  ranges: [
    "payroll_settings_manage",
  ],
  periods: [
    "payroll_settings_manage",
  ],
  items: [
    "payroll_settings_manage",
  ],
  "overtime-tax": [
    "payroll_settings_manage",
  ],
  "hourly-formula": [
    "payroll_settings_manage",
  ],
  banks: [
    "payroll_settings_manage",
  ],

  "insurance-units": [
    "payroll_tax_insurance_manage",
  ],
  "insurance-grades": [
    "payroll_tax_insurance_manage",
  ],
  "insurance-rates": [
    "payroll_tax_insurance_manage",
  ],
  "insurance-identities": [
    "payroll_tax_insurance_manage",
  ],
  "tax-units": [
    "payroll_tax_insurance_manage",
  ],
  "tax-parameters": [
    "payroll_tax_insurance_manage",
  ],

  permissions: [
    "payroll_permissions_manage",
  ],

  "employee-settings": [
    "payroll_settings_manage",
    "payroll_tax_insurance_manage",
  ],
  "bulk-adjustment": [
    "payroll_settings_manage",
  ],
  "adjustment-history": [
    "payroll_settings_manage",
  ],

  salary: [
    "payroll_view",
    "payroll_calculate",
    "payroll_approve",
    "payroll_close",
    "payroll_mark_paid",
  ],
  bonus: [
    "payroll_calculate",
  ],
  supplementary: [
    "payroll_calculate",
  ],
  history: [
    "payroll_view",
    "payroll_reports_view",
  ],

  "insurance-reconciliation": [
    "payroll_tax_insurance_manage",
  ],
  "insured-salary-adjustment": [
    "payroll_tax_insurance_manage",
  ],
  "termination-payroll": [
    "payroll_calculate",
  ],

  "non-employee-income": [
    "payroll_tax_insurance_manage",
  ],
  withholding: [
    "payroll_tax_insurance_manage",
  ],
  declarations: [
    "payroll_tax_insurance_manage",
  ],
  "supplementary-premium": [
    "payroll_tax_insurance_manage",
  ],

  "report-center": [
    "payroll_reports_view",
  ],
  "payslip-search": [
    "payroll_view",
    "payroll_reports_view",
  ],
};

export function getPayrollPermissionCodes(
  authUser,
) {
  const candidates = [
    authUser?.payroll_permission_codes,
    authUser?.payroll_permissions,
    authUser?.permissions?.payroll,
  ];

  const permissionList =
    candidates.find(Array.isArray) || [];

  return Array.from(
    new Set(
      permissionList
        .map((permission) => {
          if (
            permission &&
            typeof permission === "object"
          ) {
            return String(
              permission.permission_code ||
                permission.code ||
                permission.id ||
                "",
            ).trim();
          }

          return String(
            permission || "",
          ).trim();
        })
        .filter(Boolean),
    ),
  );
}

export function hasPayrollOverride(
  authUser,
) {
  return (
    authUser?.can_manage_payroll ===
    true
  );
}

export function hasPayrollPermission(
  authUser,
  permissionCode,
) {
  if (hasPayrollOverride(authUser)) {
    return true;
  }

  const normalizedCode = String(
    permissionCode || "",
  ).trim();

  if (!normalizedCode) {
    return false;
  }

  return getPayrollPermissionCodes(
    authUser,
  ).includes(normalizedCode);
}

export function hasAnyPayrollPermission(
  authUser,
  permissionCodes = [],
) {
  if (hasPayrollOverride(authUser)) {
    return true;
  }

  const requiredCodes = Array.isArray(
    permissionCodes,
  )
    ? permissionCodes
    : [];

  if (requiredCodes.length === 0) {
    return false;
  }

  const userCodes = new Set(
    getPayrollPermissionCodes(authUser),
  );

  return requiredCodes.some(
    (permissionCode) =>
      userCodes.has(permissionCode),
  );
}

export function canAccessPayrollModule(
  authUser,
) {
  return (
    hasPayrollOverride(authUser) ||
    hasAnyPayrollPermission(
      authUser,
      PAYROLL_PERMISSION_CODES,
    )
  );
}

export function canViewPayrollNavigationItem(
  authUser,
  item,
) {
  if (hasPayrollOverride(authUser)) {
    return true;
  }

  const requiredPermissions =
    PAYROLL_NAVIGATION_PERMISSION_MAP[
      item?.id
    ] || [];

  return hasAnyPayrollPermission(
    authUser,
    requiredPermissions,
  );
}

export function filterPayrollNavigation(
  navigation,
  authUser,
) {
  if (!Array.isArray(navigation)) {
    return [];
  }

  if (hasPayrollOverride(authUser)) {
    return navigation;
  }

  return navigation
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          canViewPayrollNavigationItem(
            authUser,
            item,
          ),
      ),
    }))
    .filter(
      (section) =>
        section.items.length > 0,
    );
}