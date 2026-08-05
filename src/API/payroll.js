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

export async function getPayrollPermissions() {
  const response = await http.get(
    "/payroll/permissions",
  );

  return unwrapResponse(response, []);
}

export async function getPayrollPermissionRoles() {
  const response = await http.get(
    "/payroll/permission-roles",
  );

  return unwrapResponse(response, []);
}

export async function getPayrollPermissionRole(
  roleKey,
) {
  const normalizedRoleKey = String(
    roleKey || "",
  ).trim();

  if (!normalizedRoleKey) {
    throw new Error("Role key is required.");
  }

  const response = await http.get(
    `/payroll/permission-roles/${encodeURIComponent(
      normalizedRoleKey,
    )}`,
  );

  return unwrapResponse(response, {
    role_key: normalizedRoleKey,
    role_name: "",
    is_protected: false,
    permission_codes: [],
    permissions: [],
  });
}

export async function updatePayrollPermissionRole(
  roleKey,
  permissionCodes,
) {
  const normalizedRoleKey = String(
    roleKey || "",
  ).trim();

  if (!normalizedRoleKey) {
    throw new Error("Role key is required.");
  }

  const normalizedPermissionCodes = Array.from(
    new Set(
      (Array.isArray(permissionCodes)
        ? permissionCodes
        : []
      )
        .map((permissionCode) =>
          String(permissionCode || "").trim(),
        )
        .filter(Boolean),
    ),
  );

  const response = await http.put(
    `/payroll/permission-roles/${encodeURIComponent(
      normalizedRoleKey,
    )}`,
    {
      permission_codes:
        normalizedPermissionCodes,
    },
  );

  return unwrapResponse(response, null);
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

export async function getInsuranceUnits(
  params = {},
) {
  const response = await http.get(
    "/insurance-units",
    {
      params: buildParams({
        search: params.search,
        status: params.status,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function getInsuranceUnit(
  insuranceUnitId,
) {
  const response = await http.get(
    `/insurance-units/${insuranceUnitId}`,
  );

  return unwrapResponse(response, null);
}

export async function createInsuranceUnit(
  payload,
) {
  const response = await http.post(
    "/insurance-units",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updateInsuranceUnit(
  insuranceUnitId,
  payload,
) {
  const response = await http.put(
    `/insurance-units/${insuranceUnitId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deleteInsuranceUnit(
  insuranceUnitId,
) {
  const response = await http.delete(
    `/insurance-units/${insuranceUnitId}`,
  );

  return unwrapResponse(response, {
    deleted: false,
    disabled: false,
  });
}

export async function createInsuranceUnitAccidentRate(
  insuranceUnitId,
  payload,
) {
  const response = await http.post(
    `/insurance-units/${insuranceUnitId}/accident-rates`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deleteInsuranceUnitAccidentRate(
  insuranceUnitId,
  accidentRateId,
) {
  const response = await http.delete(
    `/insurance-units/${insuranceUnitId}/accident-rates/${accidentRateId}`,
  );

  return unwrapResponse(response, {
    deleted: false,
    insurance_unit: null,
  });
}

export async function getInsuranceGradeVersions(
  params = {},
) {
  const response = await http.get(
    "/insurance-grade-versions",
    {
      params: buildParams({
        search: params.search,
        status: params.status,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function getInsuranceGradeVersion(
  insuranceGradeVersionId,
) {
  const response = await http.get(
    `/insurance-grade-versions/${insuranceGradeVersionId}`,
  );

  return unwrapResponse(response, null);
}

export async function createInsuranceGradeVersion(
  payload,
) {
  const response = await http.post(
    "/insurance-grade-versions",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updateInsuranceGradeVersion(
  insuranceGradeVersionId,
  payload,
) {
  const response = await http.put(
    `/insurance-grade-versions/${insuranceGradeVersionId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function publishInsuranceGradeVersion(
  insuranceGradeVersionId,
) {
  const response = await http.post(
    `/insurance-grade-versions/${insuranceGradeVersionId}/publish`,
  );

  return unwrapResponse(response, null);
}

export async function getEffectiveInsuranceGradeVersion(
  date,
) {
  const response = await http.get(
    "/insurance-grade-versions/effective",
    {
      params: buildParams({
        date,
      }),
    },
  );

  return unwrapResponse(response, null);
}

export async function getPayrollCalculationRules(
  params = {},
) {
  const response = await http.get(
    "/payroll-calculation-rules",
    {
      params: buildParams({
        rule_category: params.rule_category,
        source_type: params.source_type,
        status: params.status,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function getPayrollCalculationRuleOptions(
  params = {},
) {
  const response = await http.get(
    "/payroll-calculation-rule-options",
    {
      params: buildParams({
        status: params.status,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function updatePayrollCalculationRule(
  calculationRuleId,
  payload,
) {
  const response = await http.put(
    `/payroll-calculation-rules/${calculationRuleId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function getPayrollSalaryBanks(
  params = {},
) {
  const response = await http.get(
    "/payroll-salary-banks",
    {
      params: buildParams({
        search: params.search,
        status: params.status,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function createPayrollSalaryBank(
  payload,
) {
  const response = await http.post(
    "/payroll-salary-banks",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updatePayrollSalaryBank(
  salaryBankId,
  payload,
) {
  const response = await http.put(
    `/payroll-salary-banks/${salaryBankId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deletePayrollSalaryBank(
  salaryBankId,
) {
  const response = await http.delete(
    `/payroll-salary-banks/${salaryBankId}`,
  );

  return unwrapResponse(response, null);
}

export async function getPayrollEmployees(
  params = {},
) {
  const response = await http.get("/employees", {
    params: buildParams({
      page: params.page || 1,
      per_page: params.per_page || 100,
      search: params.search,
      employee_status: params.employee_status,
    }),
  });

  return unwrapResponse(response, []);
}

export async function getPayrollEmployeeSalaryData(
  params = {},
) {
  const response = await http.get(
    "/payroll/employee-salary-data",
    {
      params: buildParams({
        page: params.page || 1,
        per_page: params.per_page || 20,
        search: params.search,
        employee_status: params.employee_status,
        salary_data_status: params.salary_data_status,
      }),
    },
  );

  return unwrapResponse(response, {
    rows: [],
    pagination: {
      page: 1,
      per_page: 20,
      total: 0,
      total_pages: 0,
    },
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

export async function createEmployeeSalaryRecord(
  payload,
) {
  const response = await http.post(
    "/salary-records",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updateEmployeeSalaryRecord(
  salaryRecordId,
  payload,
) {
  const response = await http.put(
    `/salary-records/${salaryRecordId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deleteEmployeeSalaryRecord(
  salaryRecordId,
) {
  const response = await http.delete(
    `/salary-records/${salaryRecordId}`,
  );

  return unwrapResponse(response, null);
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

export async function createSalaryRecordItem(payload) {
  const response = await http.post(
    "/salary-items",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updateSalaryRecordItem(
  salaryItemId,
  payload,
) {
  const response = await http.put(
    `/salary-items/${salaryItemId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deleteSalaryRecordItem(
  salaryItemId,
) {
  const response = await http.delete(
    `/salary-items/${salaryItemId}`,
  );

  return unwrapResponse(response, null);
}

function createSalaryMasterPayload(values) {
  return {
    payroll_range_id: values.payroll_range_id,
    effective_from: values.effective_from,
    effective_to: values.effective_to,
    salary_type: values.salary_type,
    welfare_fee_deduct_type:
      values.welfare_fee_deduct_type,
    salary_bank_id: values.salary_bank_id,
    bank_branch_code: values.bank_branch_code,
    bank_account_no: values.bank_account_no,
    print_payslip_enabled:
      values.print_payslip_enabled,
    status: values.status,
    remarks: values.remarks,
  };
}

function createSalaryItemPayload(
  salaryRecordId,
  item,
) {
  return {
    salary_record_id: Number(salaryRecordId),
    payroll_item_id: Number(
      item.payroll_item_id,
    ),
    amount: Number(item.amount),
  };
}

export async function saveEmployeeSalaryRecord({
  employeeId,
  record = null,
  originalItems = [],
  values,
}) {
  const editing = Boolean(
    record?.salary_record_id,
  );

  const masterPayload =
    createSalaryMasterPayload(values);

  let salaryRecordId = editing
    ? Number(record.salary_record_id)
    : null;

  if (editing) {
    await updateEmployeeSalaryRecord(
      salaryRecordId,
      masterPayload,
    );
  } else {
    const createResult =
      await createEmployeeSalaryRecord({
        ...masterPayload,
        employee_ids: [Number(employeeId)],
      });

    salaryRecordId = Number(
      createResult?.salary_record_ids?.[0] || 0,
    );

    if (!salaryRecordId) {
      const createError = new Error(
        "薪資主檔已送出，但系統未回傳薪資資料 ID。",
      );

      createError.code =
        "salary_record_id_missing";

      throw createError;
    }
  }

  const submittedItems = Array.isArray(
    values.salary_items,
  )
    ? values.salary_items
    : [];

  const existingItems = Array.isArray(
    originalItems,
  )
    ? originalItems
    : [];

  const submittedExistingIds = new Set(
    submittedItems
      .map((item) =>
        Number(item.salary_item_id || 0),
      )
      .filter((itemId) => itemId > 0),
  );

  const removedItems = existingItems.filter(
    (item) => {
      const salaryItemId = Number(
        item.salary_item_id || 0,
      );

      return (
        salaryItemId > 0 &&
        !submittedExistingIds.has(salaryItemId)
      );
    },
  );

  try {
    /*
     * Finish all create/update requests before
     * deleting removed items. This prevents an
     * early deletion if an upsert fails.
     */
    for (const item of submittedItems) {
      const itemPayload =
        createSalaryItemPayload(
          salaryRecordId,
          item,
        );

      if (item.salary_item_id) {
        await updateSalaryRecordItem(
          Number(item.salary_item_id),
          itemPayload,
        );
      } else {
        await createSalaryRecordItem(
          itemPayload,
        );
      }
    }

    for (const removedItem of removedItems) {
      await deleteSalaryRecordItem(
        Number(removedItem.salary_item_id),
      );
    }
  } catch (requestError) {
    /*
     * A newly created record can be removed safely
     * when one of its item requests fails.
     */
    if (!editing && salaryRecordId) {
      try {
        await deleteEmployeeSalaryRecord(
          salaryRecordId,
        );
      } catch {
        requestError.salaryRecordId =
          salaryRecordId;

        requestError.partialSave = true;
      }
    } else {
      requestError.salaryRecordId =
        salaryRecordId;

      requestError.partialSave = true;
    }

    throw requestError;
  }

  return {
    salary_record_id: salaryRecordId,
    created: !editing,
    updated: editing,
  };
}

export async function previewSalaryAdjustments(
  payload,
) {
  const response = await http.post(
    "/salary-adjustments/preview",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function applySalaryAdjustments(
  payload,
) {
  const response = await http.post(
    "/salary-adjustments/apply",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function getSalaryAdjustmentHistory(
  params = {},
) {
  const response = await http.get(
    "/salary-adjustments/history",
    {
      params: buildParams({
        page: params.page || 1,
        per_page: params.per_page || 20,
        search: params.search,
        status: params.status,
        employee_id: params.employee_id,
        date_from: params.date_from,
        date_to: params.date_to,
      }),
    },
  );

  return unwrapResponse(response, {
    rows: [],
    pagination: {
      page: 1,
      per_page: 20,
      total: 0,
      total_pages: 0,
    },
  });
}

export async function getSalaryAdjustmentHistoryDetail(
  batchId,
) {
  const response = await http.get(
    `/salary-adjustments/history/${batchId}`,
  );

  return unwrapResponse(response, null);
}

export async function getInsuranceRateVersions(
  params = {},
) {
  const response = await http.get(
    "/insurance-rate-versions",
    {
      params: buildParams({
        search: params.search,
        status: params.status,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function getInsuranceRateVersion(
  insuranceRateVersionId,
) {
  const response = await http.get(
    `/insurance-rate-versions/${insuranceRateVersionId}`,
  );

  return unwrapResponse(response, null);
}

export async function getEffectiveInsuranceRateVersion(
  date,
) {
  const response = await http.get(
    "/insurance-rate-versions/effective",
    {
      params: buildParams({
        date,
      }),
    },
  );

  return unwrapResponse(response, null);
}

export async function createInsuranceRateVersion(
  payload,
) {
  const response = await http.post(
    "/insurance-rate-versions",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updateInsuranceRateVersion(
  insuranceRateVersionId,
  payload,
) {
  const response = await http.put(
    `/insurance-rate-versions/${insuranceRateVersionId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deleteInsuranceRateVersion(
  insuranceRateVersionId,
) {
  const response = await http.delete(
    `/insurance-rate-versions/${insuranceRateVersionId}`,
  );

  return unwrapResponse(response, null);
}

export async function publishInsuranceRateVersion(
  insuranceRateVersionId,
) {
  const response = await http.post(
    `/insurance-rate-versions/${insuranceRateVersionId}/publish`,
  );

  return unwrapResponse(response, null);
}

export async function getInsuranceIdentities(
  params = {},
) {
  const response = await http.get(
    "/insurance-identities",
    {
      params: buildParams({
        search: params.search,
        status: params.status,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function getInsuranceIdentity(
  insuranceIdentityId,
) {
  const response = await http.get(
    `/insurance-identities/${insuranceIdentityId}`,
  );

  return unwrapResponse(response, null);
}

export async function createInsuranceIdentity(
  payload,
) {
  const response = await http.post(
    "/insurance-identities",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updateInsuranceIdentity(
  insuranceIdentityId,
  payload,
) {
  const response = await http.put(
    `/insurance-identities/${insuranceIdentityId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deleteInsuranceIdentity(
  insuranceIdentityId,
) {
  const response = await http.delete(
    `/insurance-identities/${insuranceIdentityId}`,
  );

  return unwrapResponse(response, {
    deleted: false,
    disabled: false,
  });
}

export async function getTaxDeclarationUnits(
  params = {},
) {
  const response = await http.get(
    "/tax-declaration-units",
    {
      params: buildParams({
        search: params.search,
        status: params.status,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function getTaxDeclarationUnit(
  taxDeclarationUnitId,
) {
  const response = await http.get(
    `/tax-declaration-units/${taxDeclarationUnitId}`,
  );

  return unwrapResponse(response, null);
}

export async function createTaxDeclarationUnit(
  payload,
) {
  const response = await http.post(
    "/tax-declaration-units",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updateTaxDeclarationUnit(
  taxDeclarationUnitId,
  payload,
) {
  const response = await http.put(
    `/tax-declaration-units/${taxDeclarationUnitId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deleteTaxDeclarationUnit(
  taxDeclarationUnitId,
) {
  const response = await http.delete(
    `/tax-declaration-units/${taxDeclarationUnitId}`,
  );

  return unwrapResponse(response, {
    deleted: false,
    disabled: false,
  });
}

export async function getTaxParameters(
  params = {},
) {
  const response = await http.get(
    "/tax-parameters",
    {
      params: buildParams({
        search: params.search,
        status: params.status,
        effective_year:
          params.effective_year,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function getTaxParameter(
  taxParameterId,
) {
  const response = await http.get(
    `/tax-parameters/${taxParameterId}`,
  );

  return unwrapResponse(response, null);
}

export async function createTaxParameter(
  payload,
) {
  const response = await http.post(
    "/tax-parameters",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updateTaxParameter(
  taxParameterId,
  payload,
) {
  const response = await http.put(
    `/tax-parameters/${taxParameterId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deleteTaxParameter(
  taxParameterId,
) {
  const response = await http.delete(
    `/tax-parameters/${taxParameterId}`,
  );

  return unwrapResponse(response, {
    deleted: false,
    disabled: false,
  });
}

export async function getTaxTableRows(
  taxParameterId,
  params = {},
) {
  const response = await http.get(
    `/tax-parameters/${taxParameterId}/tax-table-rows`,
    {
      params: buildParams({
        dependent_count:
          params.dependent_count,
        status: params.status,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function getTaxTableRow(
  taxTableRowId,
) {
  const response = await http.get(
    `/tax-table-rows/${taxTableRowId}`,
  );

  return unwrapResponse(response, null);
}

export async function createTaxTableRow(
  taxParameterId,
  payload,
) {
  const response = await http.post(
    `/tax-parameters/${taxParameterId}/tax-table-rows`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updateTaxTableRow(
  taxTableRowId,
  payload,
) {
  const response = await http.put(
    `/tax-table-rows/${taxTableRowId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deleteTaxTableRow(
  taxTableRowId,
) {
  const response = await http.delete(
    `/tax-table-rows/${taxTableRowId}`,
  );

  return unwrapResponse(response, {
    deleted: false,
    disabled: false,
    already_disabled: false,
    tax_table_row_id: null,
    payroll_usage_count: 0,
    message: "",
    item: null,
  });
}

export async function getPayrollTaxProfiles(
  params = {},
) {
  const response = await http.get(
    "/payroll-tax-profiles",
    {
      params: buildParams({
        employee_id: params.employee_id,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function createPayrollTaxProfile(
  payload,
) {
  const response = await http.post(
    "/payroll-tax-profiles",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updatePayrollTaxProfile(
  taxProfileId,
  payload,
) {
  const response = await http.put(
    `/payroll-tax-profiles/${taxProfileId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deletePayrollTaxProfile(
  taxProfileId,
) {
  const response = await http.delete(
    `/payroll-tax-profiles/${taxProfileId}`,
  );

  return unwrapResponse(response, {
    deleted: false,
    retired: false,
    already_retired: false,
    tax_profile_id: null,
    status: "",
    effective_to: null,
    payroll_usage_count: 0,
    is_payroll_used: false,
    message: "",
  });
}

export async function getPayrollTaxDependents(
  params = {},
) {
  const response = await http.get(
    "/payroll-tax-dependents",
    {
      params: buildParams({
        employee_id: params.employee_id,
        tax_profile_id:
          params.tax_profile_id,
        status: params.status,
      }),
    },
  );

  return unwrapResponse(response, []);
}

export async function createPayrollTaxDependent(
  payload,
) {
  const response = await http.post(
    "/payroll-tax-dependents",
    payload,
  );

  return unwrapResponse(response, null);
}

export async function updatePayrollTaxDependent(
  taxDependentId,
  payload,
) {
  const response = await http.put(
    `/payroll-tax-dependents/${taxDependentId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

export async function deletePayrollTaxDependent(
  taxDependentId,
) {
  const response = await http.delete(
    `/payroll-tax-dependents/${taxDependentId}`,
  );

  return unwrapResponse(response, {
    deleted: false,
    tax_dependent_id: null,
  });
}

async function getEmployeeInsuranceRecords(
  endpoint,
  params = {},
) {
  const response = await http.get(endpoint, {
    params: buildParams({
      page: params.page || 1,
      per_page: params.per_page || 100,
      employee_id: params.employee_id,
      action_type: params.action_type,
      include_deleted: params.include_deleted
        ? 1
        : undefined,
      date_from: params.date_from,
      date_to: params.date_to,
    }),
  });

  return unwrapResponse(response, []);
}

async function getEmployeeInsuranceRecord(
  endpoint,
  recordId,
) {
  const response = await http.get(
    `${endpoint}/${recordId}`,
  );

  return unwrapResponse(response, null);
}

async function createEmployeeInsuranceRecord(
  endpoint,
  payload,
) {
  const response = await http.post(
    endpoint,
    payload,
  );

  return unwrapResponse(response, null);
}

async function updateEmployeeInsuranceRecord(
  endpoint,
  recordId,
  payload,
) {
  const response = await http.put(
    `${endpoint}/${recordId}`,
    payload,
  );

  return unwrapResponse(response, null);
}

async function deleteEmployeeInsuranceRecord(
  endpoint,
  recordId,
) {
  const response = await http.delete(
    `${endpoint}/${recordId}`,
  );

  return unwrapResponse(response, {
    deleted: false,
    record: null,
  });
}

async function transferEmployeeInsuranceRecord(
  endpoint,
  payload,
) {
  const response = await http.post(
    `${endpoint}/transfer`,
    payload,
  );

  return unwrapResponse(response, {
    transferred: false,
    withdrawal_record: null,
    enrollment_record: null,
  });
}


const LABOR_INSURANCE_RECORDS_ENDPOINT =
  "/employee-labor-insurance-records";

const OCCUPATIONAL_INSURANCE_RECORDS_ENDPOINT =
  "/employee-occupational-insurance-records";

const PENSION_INSURANCE_RECORDS_ENDPOINT =
  "/employee-pension-insurance-records";

export async function getEmployeeLaborInsuranceRecords(
  params = {},
) {
  return getEmployeeInsuranceRecords(
    LABOR_INSURANCE_RECORDS_ENDPOINT,
    params,
  );
}

export async function getEmployeeLaborInsuranceRecord(
  recordId,
) {
  return getEmployeeInsuranceRecord(
    LABOR_INSURANCE_RECORDS_ENDPOINT,
    recordId,
  );
}

export async function createEmployeeLaborInsuranceRecord(
  payload,
) {
  return createEmployeeInsuranceRecord(
    LABOR_INSURANCE_RECORDS_ENDPOINT,
    payload,
  );
}

export async function updateEmployeeLaborInsuranceRecord(
  recordId,
  payload,
) {
  return updateEmployeeInsuranceRecord(
    LABOR_INSURANCE_RECORDS_ENDPOINT,
    recordId,
    payload,
  );
}

export async function deleteEmployeeLaborInsuranceRecord(
  recordId,
) {
  return deleteEmployeeInsuranceRecord(
    LABOR_INSURANCE_RECORDS_ENDPOINT,
    recordId,
  );
}

export async function transferEmployeeLaborInsurance(
  payload,
) {
  return transferEmployeeInsuranceRecord(
    LABOR_INSURANCE_RECORDS_ENDPOINT,
    payload,
  );
}


export async function getEmployeeOccupationalInsuranceRecords(
  params = {},
) {
  return getEmployeeInsuranceRecords(
    OCCUPATIONAL_INSURANCE_RECORDS_ENDPOINT,
    params,
  );
}

export async function getEmployeeOccupationalInsuranceRecord(
  recordId,
) {
  return getEmployeeInsuranceRecord(
    OCCUPATIONAL_INSURANCE_RECORDS_ENDPOINT,
    recordId,
  );
}

export async function createEmployeeOccupationalInsuranceRecord(
  payload,
) {
  return createEmployeeInsuranceRecord(
    OCCUPATIONAL_INSURANCE_RECORDS_ENDPOINT,
    payload,
  );
}

export async function updateEmployeeOccupationalInsuranceRecord(
  recordId,
  payload,
) {
  return updateEmployeeInsuranceRecord(
    OCCUPATIONAL_INSURANCE_RECORDS_ENDPOINT,
    recordId,
    payload,
  );
}

export async function deleteEmployeeOccupationalInsuranceRecord(
  recordId,
) {
  return deleteEmployeeInsuranceRecord(
    OCCUPATIONAL_INSURANCE_RECORDS_ENDPOINT,
    recordId,
  );
}

export async function transferEmployeeOccupationalInsurance(
  payload,
) {
  return transferEmployeeInsuranceRecord(
    OCCUPATIONAL_INSURANCE_RECORDS_ENDPOINT,
    payload,
  );
}

export async function getEmployeePensionInsuranceRecords(
  params = {},
) {
  return getEmployeeInsuranceRecords(
    PENSION_INSURANCE_RECORDS_ENDPOINT,
    params,
  );
}

export async function getEmployeePensionInsuranceRecord(
  recordId,
) {
  return getEmployeeInsuranceRecord(
    PENSION_INSURANCE_RECORDS_ENDPOINT,
    recordId,
  );
}

export async function createEmployeePensionInsuranceRecord(
  payload,
) {
  return createEmployeeInsuranceRecord(
    PENSION_INSURANCE_RECORDS_ENDPOINT,
    payload,
  );
}

export async function updateEmployeePensionInsuranceRecord(
  recordId,
  payload,
) {
  return updateEmployeeInsuranceRecord(
    PENSION_INSURANCE_RECORDS_ENDPOINT,
    recordId,
    payload,
  );
}

export async function deleteEmployeePensionInsuranceRecord(
  recordId,
) {
  return deleteEmployeeInsuranceRecord(
    PENSION_INSURANCE_RECORDS_ENDPOINT,
    recordId,
  );
}

export async function transferEmployeePensionInsurance(
  payload,
) {
  return transferEmployeeInsuranceRecord(
    PENSION_INSURANCE_RECORDS_ENDPOINT,
    payload,
  );
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