import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import PreviewOutlinedIcon from "@mui/icons-material/PreviewOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
  applySalaryAdjustments,
  getEmployeeSalaryRecords,
  getPayrollEmployees,
  getSalaryRecordItems,
  previewSalaryAdjustments,
} from "../../API/payroll";

const WORKFLOW_STEPS = [
  {
    number: "01",
    title: "建立調薪內容",
    description: "設定統一生效日，並輸入需要調整的員工與薪資科目金額。",
  },
  {
    number: "02",
    title: "預覽與驗證",
    description: "確認原薪資、調整後薪資、差額及所有資料驗證結果。",
  },
  {
    number: "03",
    title: "確認套用",
    description: "確認後建立新的生效薪資資料，並保留完整調薪紀錄。",
  },
];

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function getEmployeeLabel(employee) {
  const employeeNo = String(employee?.employee_no || "").trim();

  const displayName = String(
    employee?.display_name ||
      employee?.employee_name ||
      employee?.english_name ||
      "",
  ).trim();

  if (employeeNo && displayName) {
    return `${employeeNo}／${displayName}`;
  }

  return employeeNo || displayName || `員工 #${employee?.employee_id || "--"}`;
}

function getPreviousDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
}

function findApplicableSalaryRecord(records, effectiveDate) {
  const activeRecords = Array.isArray(records)
    ? records.filter((record) => {
        return ["啟用", "active"].includes(String(record?.status || ""));
      })
    : [];

  const coveringRecords = activeRecords.filter((record) => {
    const effectiveFrom = String(record?.effective_from || "");

    const effectiveTo = String(record?.effective_to || "");

    return (
      effectiveFrom &&
      effectiveFrom <= effectiveDate &&
      (!effectiveTo || effectiveTo >= effectiveDate)
    );
  });

  if (coveringRecords.length > 1) {
    throw new Error("此員工在指定生效日有重疊的薪資主檔，請先修正。");
  }

  if (coveringRecords.length === 1) {
    return coveringRecords[0];
  }

  const previousDate = getPreviousDate(effectiveDate);

  const previousRecords = activeRecords.filter(
    (record) => String(record?.effective_to || "") === previousDate,
  );

  if (previousRecords.length > 1) {
    throw new Error("此員工在調薪生效日前有重疊的薪資主檔，請先修正。");
  }

  return previousRecords[0] || null;
}

function isValidAmount(value) {
  return /^\d+(?:\.\d{1,2})?$/.test(String(value ?? "").trim());
}

function getChangedItems(row) {
  return row.items.filter((item) => {
    const newAmount = String(item.new_amount ?? "").trim();

    return newAmount !== "" && Number(newAmount) !== Number(item.amount);
  });
}

function formatAmount(value) {
  return new Intl.NumberFormat("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatSignedAmount(value) {
  const amount = Number(value || 0);

  if (amount > 0) {
    return `+NT$ ${formatAmount(amount)}`;
  }

  if (amount < 0) {
    return `-NT$ ${formatAmount(Math.abs(amount))}`;
  }

  return `NT$ ${formatAmount(0)}`;
}

function getDifferenceColor(value) {
  const amount = Number(value || 0);

  if (amount > 0) {
    return "#15803d";
  }

  if (amount < 0) {
    return "#dc2626";
  }

  return "#64748b";
}

export default function PayrollBulkAdjustmentPage() {
  const [effectiveDate, setEffectiveDate] = useState("");

  const [batchRemarks, setBatchRemarks] = useState("");

  const [employees, setEmployees] = useState([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [rows, setRows] = useState([]);

  const [previewResult, setPreviewResult] = useState(null);

  const [previewPayload, setPreviewPayload] = useState(null);

  const [applyResult, setApplyResult] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [addingEmployee, setAddingEmployee] = useState(false);

  const [previewing, setPreviewing] = useState(false);

  const [applying, setApplying] = useState(false);

  const [error, setError] = useState("");

  const previewRequestIdRef = useRef(0);

  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      setLoadingEmployees(true);

      try {
        const result = await getPayrollEmployees({
          page: 1,
          per_page: 100,
        });

        if (!active) {
          return;
        }

        const employeeList = Array.isArray(result)
          ? result
              .filter((employee) =>
                ["啟用", "active"].includes(
                  String(employee?.employee_status || ""),
                ),
              )
              .sort((employeeA, employeeB) =>
                getEmployeeLabel(employeeA).localeCompare(
                  getEmployeeLabel(employeeB),
                  "zh-Hant",
                ),
              )
          : [];

        setEmployees(employeeList);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(getErrorMessage(loadError, "無法載入員工資料。"));
      } finally {
        if (active) {
          setLoadingEmployees(false);
        }
      }
    }

    loadEmployees();

    return () => {
      active = false;
    };
  }, []);

  const selectedEmployeeIds = useMemo(
    () => new Set(rows.map((row) => Number(row.employee_id))),
    [rows],
  );

  const previewRows = useMemo(
    () => (Array.isArray(previewResult?.rows) ? previewResult.rows : []),
    [previewResult],
  );

  function invalidatePreview() {
    previewRequestIdRef.current += 1;

    setPreviewResult(null);
    setPreviewPayload(null);
    setApplyResult(null);
    setConfirmOpen(false);
    setError("");
  }

  function handleEffectiveDateChange(event) {
    previewRequestIdRef.current += 1;

    setEffectiveDate(event.target.value);
    setSelectedEmployeeId("");
    setRows([]);
    setPreviewResult(null);
    setPreviewPayload(null);
    setApplyResult(null);
    setConfirmOpen(false);
    setError("");
  }

  async function handleAddEmployee() {
    if (!effectiveDate) {
      setError("請先選擇本次調薪生效日。");
      return;
    }

    const employeeId = Number(selectedEmployeeId);

    if (!employeeId) {
      setError("請選擇需要調薪的員工。");
      return;
    }

    if (selectedEmployeeIds.has(employeeId)) {
      setError("同一位員工不可重複加入本次調薪。");
      return;
    }

    const employee = employees.find(
      (item) => Number(item?.employee_id) === employeeId,
    );

    previewRequestIdRef.current += 1;

    setAddingEmployee(true);
    setPreviewResult(null);
    setPreviewPayload(null);
    setApplyResult(null);
    setConfirmOpen(false);
    setError("");

    try {
      const salaryRecords = await getEmployeeSalaryRecords(employeeId);

      const salaryRecord = findApplicableSalaryRecord(
        salaryRecords,
        effectiveDate,
      );

      if (!salaryRecord) {
        throw new Error("此員工在指定生效日沒有可使用的薪資主檔。");
      }

      const salaryItems = await getSalaryRecordItems(
        salaryRecord.salary_record_id,
      );

      if (!Array.isArray(salaryItems) || salaryItems.length === 0) {
        throw new Error("此員工目前的薪資主檔沒有薪資科目。");
      }

      setRows((currentRows) => [
        ...currentRows,
        {
          employee_id: employeeId,
          employee_no: employee?.employee_no || "",
          employee_name: employee?.display_name || employee?.english_name || "",
          salary_record_id: Number(salaryRecord.salary_record_id),
          effective_from: salaryRecord.effective_from || "",
          effective_to: salaryRecord.effective_to || "",
          remarks: "",
          items: salaryItems.map((item) => ({
            salary_item_id: Number(item?.salary_item_id || 0),
            payroll_item_id: Number(item?.payroll_item_id || 0),
            item_code: item?.item_code || "",
            item_name: item?.item_name || "",
            item_type: item?.item_type || "",
            amount: Number(item?.amount || 0),
            new_amount: String(item?.amount ?? 0),
          })),
        },
      ]);

      setSelectedEmployeeId("");
    } catch (addError) {
      setError(getErrorMessage(addError, "無法載入員工薪資資料。"));
    } finally {
      setAddingEmployee(false);
    }
  }

  function handleRemoveEmployee(employeeId) {
    setRows((currentRows) =>
      currentRows.filter(
        (row) => Number(row.employee_id) !== Number(employeeId),
      ),
    );

    invalidatePreview();
  }

  function handleRemarksChange(employeeId, value) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        Number(row.employee_id) === Number(employeeId)
          ? {
              ...row,
              remarks: value,
            }
          : row,
      ),
    );

    invalidatePreview();
  }

  function handleAmountChange(employeeId, payrollItemId, value) {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (Number(row.employee_id) !== Number(employeeId)) {
          return row;
        }

        return {
          ...row,
          items: row.items.map((item) =>
            Number(item.payroll_item_id) === Number(payrollItemId)
              ? {
                  ...item,
                  new_amount: value,
                }
              : item,
          ),
        };
      }),
    );

    invalidatePreview();
  }

  function validatePreview() {
    if (!effectiveDate) {
      return "請選擇本次調薪生效日。";
    }

    if (rows.length === 0) {
      return "請至少加入一位需要調薪的員工。";
    }

    for (const row of rows) {
      const invalidItem = row.items.find((item) => {
        const newAmount = String(item.new_amount ?? "").trim();

        return (
          newAmount !== "" &&
          Number(newAmount) !== Number(item.amount) &&
          !isValidAmount(newAmount)
        );
      });

      if (invalidItem) {
        return `${getEmployeeLabel(row)} 的「${
          invalidItem.item_name || invalidItem.item_code
        }」調整後金額格式不正確。`;
      }

      if (getChangedItems(row).length === 0) {
        return `${getEmployeeLabel(row)} 尚未修改任何薪資科目金額。`;
      }
    }

    return "";
  }

  function buildPreviewPayload() {
    return {
      effective_date: effectiveDate,
      remarks: batchRemarks.trim(),
      employees: rows.map((row) => ({
        employee_id: Number(row.employee_id),
        remarks: row.remarks.trim(),
        items: getChangedItems(row).map((item) => ({
          payroll_item_id: Number(item.payroll_item_id),
          new_amount: String(item.new_amount).trim(),
        })),
      })),
    };
  }

  async function handlePreview() {
    const validationError = validatePreview();

    if (validationError) {
      setError(validationError);
      setPreviewResult(null);
      setPreviewPayload(null);
      return;
    }

    const payload = buildPreviewPayload();

    previewRequestIdRef.current += 1;

    const requestId = previewRequestIdRef.current;

    setPreviewing(true);
    setError("");
    setPreviewResult(null);
    setPreviewPayload(null);
    setApplyResult(null);
    setConfirmOpen(false);

    try {
      const result = await previewSalaryAdjustments(payload);

      /*
       * Ignore this response if the form changed while
       * the preview request was still running.
       */
      if (requestId !== previewRequestIdRef.current) {
        return;
      }

      setPreviewResult(result);

      if (result?.valid) {
        /*
         * Save the exact payload that produced this
         * successful preview. The apply request must use
         * this snapshot rather than rebuilding the form.
         */
        setPreviewPayload(payload);
      } else {
        setPreviewPayload(null);
        setError("預覽驗證未通過，請依照驗證結果修正調薪內容。");
      }
    } catch (previewError) {
      if (requestId !== previewRequestIdRef.current) {
        return;
      }

      setError(getErrorMessage(previewError, "無法預覽批次調薪結果。"));
    } finally {
      setPreviewing(false);
    }
  }

  function handleOpenConfirmation() {
    if (!previewResult?.valid || !previewPayload) {
      setError("目前沒有有效的調薪預覽，請重新預覽後再套用。");
      return;
    }

    setError("");
    setConfirmOpen(true);
  }

  function handleCloseConfirmation() {
    if (applying) {
      return;
    }

    setConfirmOpen(false);
  }

  async function handleApply() {
    if (!previewResult?.valid || !previewPayload) {
      setConfirmOpen(false);
      setError("調薪內容已變更或預覽已失效，請重新預覽。");
      return;
    }

    setApplying(true);
    setError("");

    try {
      const result = await applySalaryAdjustments(previewPayload);

      if (!result?.applied) {
        throw new Error("後端未確認批次調薪已成功套用。");
      }

      previewRequestIdRef.current += 1;

      /*
       * Reset the editable form only after the complete
       * backend transaction succeeds.
       */
      setEffectiveDate("");
      setBatchRemarks("");
      setSelectedEmployeeId("");
      setRows([]);
      setPreviewResult(null);
      setPreviewPayload(null);
      setConfirmOpen(false);
      setApplyResult(result);
      setError("");
    } catch (applyError) {
      setConfirmOpen(false);

      setError(
        getErrorMessage(
          applyError,
          "無法正式套用批次薪資調整，尚未重設表單。",
        ),
      );
    } finally {
      setApplying(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "420px",
        p: {
          xs: "16px",
          sm: "22px",
        },
        border: "1px solid #dfe4e8",
        borderRadius: "5px",
        bgcolor: "#ffffff",
      }}
    >
      <Typography
        component="h1"
        sx={{
          color: "#111827",
          fontSize: {
            xs: "20px",
            sm: "22px",
          },
          fontWeight: 700,
        }}
      >
        批次薪資調整
      </Typography>

      <Typography
        sx={{
          mt: "5px",
          color: "#7b8794",
          fontSize: {
            xs: "13px",
            sm: "14px",
          },
          lineHeight: 1.7,
        }}
      >
        以同一生效日批次調整多位員工的薪資科目，並在正式套用前預覽與驗證所有變更。
      </Typography>

      <Alert
        severity="info"
        sx={{
          mt: "20px",
          "& .MuiAlert-message": {
            fontSize: {
              xs: "13px",
              sm: "14px",
            },
            lineHeight: 1.65,
          },
        }}
      >
        正式套用後，系統會建立新的員工薪資生效紀錄。原薪資紀錄與完整調整歷程都會保留。
      </Alert>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "repeat(3, minmax(0, 1fr))",
          },
          gap: {
            xs: "12px",
            sm: "16px",
          },
          mt: "22px",
        }}
      >
        {WORKFLOW_STEPS.map((step) => (
          <Paper
            key={step.number}
            variant="outlined"
            sx={{
              p: {
                xs: "16px",
                sm: "18px",
              },
              borderColor: "#dfe4e8",
              borderRadius: "5px",
              boxShadow: "none",
            }}
          >
            <Typography
              sx={{
                color: "#1f9bd1",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              STEP {step.number}
            </Typography>

            <Typography
              sx={{
                mt: "6px",
                color: "#1f2937",
                fontSize: {
                  xs: "16px",
                  sm: "17px",
                },
                fontWeight: 700,
              }}
            >
              {step.title}
            </Typography>

            <Typography
              sx={{
                mt: "7px",
                color: "#64748b",
                fontSize: {
                  xs: "13px",
                  sm: "14px",
                },
                lineHeight: 1.65,
              }}
            >
              {step.description}
            </Typography>
          </Paper>
        ))}
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mt: "18px" }}>
          {error}
        </Alert>
      ) : null}

      {applyResult ? (
        <Paper
          variant="outlined"
          sx={{
            mt: "18px",
            overflow: "hidden",
            borderColor: "#86c995",
            borderRadius: "5px",
            boxShadow: "none",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              justifyContent: "space-between",
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              gap: "12px",
              p: {
                xs: "16px",
                sm: "18px",
              },
              bgcolor: "#f0fdf4",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#166534",
                  fontSize: {
                    xs: "17px",
                    sm: "18px",
                  },
                  fontWeight: 700,
                }}
              >
                批次薪資調整已成功套用
              </Typography>

              <Typography
                sx={{
                  mt: "4px",
                  color: "#64748b",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                批次編號：
                {applyResult.batch_code || "--"}
              </Typography>
            </Box>

            <Chip
              label={applyResult.status || "已套用"}
              color="success"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <Divider />

          <Box
            sx={{
              p: {
                xs: "16px",
                sm: "18px",
              },
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(3, minmax(0, 1fr))",
                },
                gap: "10px",
              }}
            >
              {[
                {
                  label: "生效日",
                  value: applyResult.effective_date || "--",
                },
                {
                  label: "已套用員工",
                  value: `${
                    applyResult.summary?.employee_count || 0
                  } 位`,
                },
                {
                  label: "已變更科目",
                  value: `${
                    applyResult.summary?.changed_item_count || 0
                  } 個`,
                },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    p: "13px",
                    border: "1px solid #dbe7dd",
                    borderRadius: "5px",
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    {item.label}
                  </Typography>

                  <Typography
                    sx={{
                      mt: "4px",
                      color: "#1f2937",
                      fontSize: "16px",
                      fontWeight: 700,
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>

            {Array.isArray(applyResult.rows) &&
            applyResult.rows.length > 0 ? (
              <Box
                sx={{
                  display: "grid",
                  gap: "10px",
                  mt: "16px",
                }}
              >
                {applyResult.rows.map(
                  (appliedRow, rowIndex) => (
                    <Box
                      key={
                        appliedRow.salary_adjustment_employee_id ||
                        appliedRow.employee_id ||
                        rowIndex
                      }
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "minmax(0, 1fr)",
                          md: "minmax(180px, 1fr) repeat(2, minmax(130px, 0.7fr))",
                        },
                        gap: "10px",
                        alignItems: "center",
                        p: "13px",
                        border: "1px solid #dcf0e1",
                        borderRadius: "5px",
                        bgcolor: "#fbfefc",
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            color: "#1f2937",
                            fontSize: "14px",
                            fontWeight: 700,
                          }}
                        >
                          {rowIndex + 1}.{" "}
                          {getEmployeeLabel(appliedRow)}
                        </Typography>

                        <Typography
                          sx={{
                            mt: "3px",
                            color: "#64748b",
                            fontSize: "12px",
                          }}
                        >
                          新薪資主檔 #
                          {appliedRow.new_salary_record_id ||
                            "--"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            color: "#64748b",
                            fontSize: "11px",
                          }}
                        >
                          調整後薪資合計
                        </Typography>

                        <Typography
                          sx={{
                            mt: "2px",
                            color: "#0369a1",
                            fontSize: "14px",
                            fontWeight: 700,
                          }}
                        >
                          NT${" "}
                          {formatAmount(
                            appliedRow.new_salary_total,
                          )}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            color: "#64748b",
                            fontSize: "11px",
                          }}
                        >
                          薪資差額
                        </Typography>

                        <Typography
                          sx={{
                            mt: "2px",
                            color: getDifferenceColor(
                              appliedRow.difference,
                            ),
                            fontSize: "14px",
                            fontWeight: 700,
                          }}
                        >
                          {formatSignedAmount(
                            appliedRow.difference,
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  ),
                )}
              </Box>
            ) : null}

            <Alert severity="success" sx={{ mt: "16px" }}>
              所有資料已完成寫入。表單已重設，可繼續建立下一個調薪批次。
            </Alert>
          </Box>
        </Paper>
      ) : null}

      {previewResult ? (
        <Paper
          variant="outlined"
          sx={{
            mt: "18px",
            overflow: "hidden",
            borderColor: previewResult.valid ? "#86c995" : "#f0b76d",
            borderRadius: "5px",
            boxShadow: "none",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              justifyContent: "space-between",
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              gap: "12px",
              p: {
                xs: "16px",
                sm: "18px",
              },
              bgcolor: previewResult.valid ? "#f0fdf4" : "#fffbeb",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#1f2937",
                  fontSize: {
                    xs: "16px",
                    sm: "17px",
                  },
                  fontWeight: 700,
                }}
              >
                調薪預覽結果
              </Typography>

              <Typography
                sx={{
                  mt: "4px",
                  color: "#64748b",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                生效日：
                {previewResult.effective_date || effectiveDate}
              </Typography>
            </Box>

            <Chip
              label={previewResult.valid ? "驗證通過" : "驗證未通過"}
              color={previewResult.valid ? "success" : "warning"}
              size="small"
              sx={{
                fontWeight: 700,
              }}
            />
          </Box>

          <Divider />

          <Box
            sx={{
              p: {
                xs: "16px",
                sm: "18px",
              },
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: "10px",
                mb: "18px",
              }}
            >
              {[
                {
                  label: "調薪員工",
                  value: previewResult.summary?.employee_count || 0,
                  color: "#0369a1",
                },
                {
                  label: "驗證通過",
                  value: previewResult.summary?.valid_employee_count || 0,
                  color: "#15803d",
                },
                {
                  label: "驗證未通過",
                  value: previewResult.summary?.invalid_employee_count || 0,
                  color: "#dc2626",
                },
                {
                  label: "變更科目",
                  value: previewResult.summary?.changed_item_count || 0,
                  color: "#7c3aed",
                },
              ].map((summaryItem) => (
                <Box
                  key={summaryItem.label}
                  sx={{
                    p: "13px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "5px",
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    {summaryItem.label}
                  </Typography>

                  <Typography
                    sx={{
                      mt: "3px",
                      color: summaryItem.color,
                      fontSize: {
                        xs: "20px",
                        sm: "22px",
                      },
                      fontWeight: 700,
                    }}
                  >
                    {summaryItem.value}
                  </Typography>
                </Box>
              ))}
            </Box>

            {previewRows.length > 0 ? (
              previewRows.map((previewRow, rowIndex) => {
                const changedItems = Array.isArray(previewRow?.changed_items)
                  ? previewRow.changed_items
                  : [];

                const rowErrors = Array.isArray(previewRow?.errors)
                  ? previewRow.errors
                  : [];

                return (
                  <Paper
                    key={previewRow.employee_id || rowIndex}
                    variant="outlined"
                    sx={{
                      mb: rowIndex === previewRows.length - 1 ? 0 : "16px",
                      p: {
                        xs: "15px",
                        sm: "18px",
                      },
                      borderColor: previewRow.valid ? "#bbdfc5" : "#f3b6b6",
                      borderRadius: "5px",
                      boxShadow: "none",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: {
                          xs: "flex-start",
                          sm: "center",
                        },
                        justifyContent: "space-between",
                        flexDirection: {
                          xs: "column",
                          sm: "row",
                        },
                        gap: "10px",
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            color: "#1f2937",
                            fontSize: {
                              xs: "15px",
                              sm: "16px",
                            },
                            fontWeight: 700,
                          }}
                        >
                          {rowIndex + 1}. {getEmployeeLabel(previewRow)}
                        </Typography>

                        <Typography
                          sx={{
                            mt: "4px",
                            color: "#64748b",
                            fontSize: "12px",
                            lineHeight: 1.6,
                          }}
                        >
                          原薪資主檔 #{previewRow.salary_record_id || "--"}：
                          {previewRow.effective_from || "--"} ～{" "}
                          {previewRow.effective_to || "無期限"}
                        </Typography>
                      </Box>

                      <Chip
                        label={previewRow.valid ? "通過" : "未通過"}
                        color={previewRow.valid ? "success" : "error"}
                        variant="outlined"
                        size="small"
                        sx={{
                          fontWeight: 700,
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "minmax(0, 1fr)",
                          sm: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: "10px",
                        mt: "16px",
                      }}
                    >
                      <Box
                        sx={{
                          p: "13px",
                          borderRadius: "5px",
                          bgcolor: "#f8fafc",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#64748b",
                            fontSize: "12px",
                          }}
                        >
                          原薪資合計
                        </Typography>

                        <Typography
                          sx={{
                            mt: "4px",
                            color: "#1f2937",
                            fontSize: "17px",
                            fontWeight: 700,
                          }}
                        >
                          NT$ {formatAmount(previewRow.old_salary_total)}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: "13px",
                          borderRadius: "5px",
                          bgcolor: "#f0f9ff",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#64748b",
                            fontSize: "12px",
                          }}
                        >
                          調整後薪資合計
                        </Typography>

                        <Typography
                          sx={{
                            mt: "4px",
                            color: "#0369a1",
                            fontSize: "17px",
                            fontWeight: 700,
                          }}
                        >
                          NT$ {formatAmount(previewRow.new_salary_total)}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: "13px",
                          borderRadius: "5px",
                          bgcolor: "#f8fafc",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#64748b",
                            fontSize: "12px",
                          }}
                        >
                          薪資差額
                        </Typography>

                        <Typography
                          sx={{
                            mt: "4px",
                            color: getDifferenceColor(previewRow.difference),
                            fontSize: "17px",
                            fontWeight: 700,
                          }}
                        >
                          {formatSignedAmount(previewRow.difference)}
                        </Typography>
                      </Box>
                    </Box>

                    {changedItems.length > 0 ? (
                      <Box sx={{ mt: "18px" }}>
                        <Typography
                          sx={{
                            mb: "10px",
                            color: "#475569",
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          已變更薪資科目（
                          {changedItems.length}）
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",
                            gap: "10px",
                          }}
                        >
                          {changedItems.map((item, itemIndex) => (
                            <Box
                              key={item.payroll_item_id || itemIndex}
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "minmax(0, 1fr)",
                                  md: "minmax(180px, 1fr) repeat(3, minmax(120px, 0.6fr))",
                                },
                                gap: "10px",
                                alignItems: "center",
                                p: "12px",
                                border: "1px solid #dbeafe",
                                borderRadius: "5px",
                                bgcolor: "#f8fbff",
                              }}
                            >
                              <Box>
                                <Typography
                                  sx={{
                                    color: "#1f2937",
                                    fontSize: "14px",
                                    fontWeight: 700,
                                  }}
                                >
                                  {item.item_name || item.item_code}
                                </Typography>

                                <Typography
                                  sx={{
                                    mt: "2px",
                                    color: "#7b8794",
                                    fontSize: "12px",
                                  }}
                                >
                                  {item.item_code}
                                  {item.item_type ? `・${item.item_type}` : ""}
                                </Typography>
                              </Box>

                              <Box>
                                <Typography
                                  sx={{
                                    color: "#7b8794",
                                    fontSize: "11px",
                                  }}
                                >
                                  原金額
                                </Typography>

                                <Typography
                                  sx={{
                                    mt: "2px",
                                    color: "#334155",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                  }}
                                >
                                  NT$ {formatAmount(item.old_amount)}
                                </Typography>
                              </Box>

                              <Box>
                                <Typography
                                  sx={{
                                    color: "#7b8794",
                                    fontSize: "11px",
                                  }}
                                >
                                  調整後
                                </Typography>

                                <Typography
                                  sx={{
                                    mt: "2px",
                                    color: "#0369a1",
                                    fontSize: "14px",
                                    fontWeight: 700,
                                  }}
                                >
                                  NT$ {formatAmount(item.new_amount)}
                                </Typography>
                              </Box>

                              <Box>
                                <Typography
                                  sx={{
                                    color: "#7b8794",
                                    fontSize: "11px",
                                  }}
                                >
                                  差額
                                </Typography>

                                <Typography
                                  sx={{
                                    mt: "2px",
                                    color: getDifferenceColor(item.difference),
                                    fontSize: "14px",
                                    fontWeight: 700,
                                  }}
                                >
                                  {formatSignedAmount(item.difference)}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ) : null}

                    {rowErrors.length > 0 ? (
                      <Alert
                        severity="error"
                        sx={{
                          mt: "16px",
                          "& .MuiAlert-message": {
                            width: "100%",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          此員工資料未通過驗證：
                        </Typography>

                        <Box
                          component="ul"
                          sx={{
                            mt: "6px",
                            mb: 0,
                            pl: "20px",
                          }}
                        >
                          {rowErrors.map((validationError, errorIndex) => (
                            <Box
                              component="li"
                              key={`${
                                validationError.code || "validation"
                              }-${errorIndex}`}
                              sx={{
                                mb:
                                  errorIndex === rowErrors.length - 1
                                    ? 0
                                    : "4px",
                                fontSize: "13px",
                                lineHeight: 1.55,
                              }}
                            >
                              {validationError.message || "資料驗證未通過。"}
                            </Box>
                          ))}
                        </Box>
                      </Alert>
                    ) : null}

                    {previewRow.remarks ? (
                      <Typography
                        sx={{
                          mt: "14px",
                          color: "#64748b",
                          fontSize: "12px",
                          lineHeight: 1.6,
                        }}
                      >
                        員工調薪備註：
                        {previewRow.remarks}
                      </Typography>
                    ) : null}
                  </Paper>
                );
              })
            ) : (
              <Alert severity="warning">
                後端已回傳預覽結果，但沒有可顯示的員工明細。
              </Alert>
            )}

            <Alert
              severity={previewResult.valid ? "success" : "warning"}
              sx={{ mt: "16px" }}
            >
              {previewResult.valid
                ? "所有員工與薪資科目均已通過驗證。請確認上方內容；目前尚未正式套用任何薪資變更。"
                : "目前仍有資料未通過驗證，系統不允許正式套用。請修正上方錯誤後重新預覽。"}
            </Alert>
          </Box>
        </Paper>
      ) : null}

      <Paper
        variant="outlined"
        sx={{
          mt: "22px",
          p: {
            xs: "16px",
            sm: "18px",
          },
          borderColor: "#dfe4e8",
          borderRadius: "5px",
          boxShadow: "none",
        }}
      >
        <Typography
          sx={{
            color: "#1f2937",
            fontSize: {
              xs: "16px",
              sm: "17px",
            },
            fontWeight: 700,
          }}
        >
          調薪基本資料
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "minmax(220px, 0.4fr) minmax(0, 1fr)",
            },
            gap: "16px",
            mt: "16px",
          }}
        >
          <TextField
            required
            fullWidth
            type="date"
            label="調薪生效日"
            value={effectiveDate}
            onChange={handleEffectiveDateChange}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            fullWidth
            label="批次備註"
            value={batchRemarks}
            onChange={(event) => {
              setBatchRemarks(event.target.value);
              invalidatePreview();
            }}
            placeholder="例如：2026 年度批次調薪"
          />
        </Box>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          mt: "18px",
          p: {
            xs: "16px",
            sm: "18px",
          },
          borderColor: "#dfe4e8",
          borderRadius: "5px",
          boxShadow: "none",
        }}
      >
        <Typography
          sx={{
            color: "#1f2937",
            fontSize: {
              xs: "16px",
              sm: "17px",
            },
            fontWeight: 700,
          }}
        >
          加入調薪員工
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "minmax(0, 1fr) auto",
            },
            gap: "12px",
            alignItems: "center",
            mt: "16px",
          }}
        >
          <FormControl
            fullWidth
            disabled={loadingEmployees || addingEmployee || !effectiveDate}
          >
            <InputLabel id="adjustment-employee-label">選擇員工</InputLabel>

            <Select
              labelId="adjustment-employee-label"
              label="選擇員工"
              value={selectedEmployeeId}
              onChange={(event) => {
                setSelectedEmployeeId(event.target.value);
                setError("");
              }}
            >
              {employees.map((employee) => {
                const employeeId = Number(employee.employee_id);

                return (
                  <MenuItem
                    key={employeeId}
                    value={employeeId}
                    disabled={selectedEmployeeIds.has(employeeId)}
                  >
                    {getEmployeeLabel(employee)}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={
              addingEmployee ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <PersonAddAltOutlinedIcon />
              )
            }
            disabled={addingEmployee || !effectiveDate || !selectedEmployeeId}
            onClick={handleAddEmployee}
            sx={{
              minHeight: "48px",
              px: "20px",
              whiteSpace: "nowrap",
            }}
          >
            加入員工
          </Button>
        </Box>
      </Paper>

      <Box sx={{ mt: "18px" }}>
        {rows.map((row, rowIndex) => (
          <Paper
            key={row.employee_id}
            variant="outlined"
            sx={{
              mb: "16px",
              p: {
                xs: "16px",
                sm: "18px",
              },
              borderColor: "#dfe4e8",
              borderRadius: "5px",
              boxShadow: "none",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: {
                  xs: "flex-start",
                  sm: "center",
                },
                justifyContent: "space-between",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                gap: "12px",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#1f2937",
                    fontSize: {
                      xs: "16px",
                      sm: "17px",
                    },
                    fontWeight: 700,
                  }}
                >
                  {rowIndex + 1}. {getEmployeeLabel(row)}
                </Typography>

                <Typography
                  sx={{
                    mt: "4px",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  目前薪資生效期間：
                  {row.effective_from || "--"} ～ {row.effective_to || "無期限"}
                </Typography>
              </Box>

              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => handleRemoveEmployee(row.employee_id)}
              >
                移除
              </Button>
            </Box>

            <TextField
              fullWidth
              label="員工調薪備註"
              value={row.remarks}
              onChange={(event) =>
                handleRemarksChange(row.employee_id, event.target.value)
              }
              sx={{ mt: "16px" }}
            />

            <Divider sx={{ my: "18px" }} />

            <Typography
              sx={{
                mb: "10px",
                color: "#475569",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              薪資科目
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: "12px",
              }}
            >
              {row.items.map((item) => {
                const newAmount = String(item.new_amount ?? "").trim();

                const changed =
                  newAmount !== "" && Number(newAmount) !== Number(item.amount);

                return (
                  <Box
                    key={item.salary_item_id}
                    sx={{
                      p: "14px",
                      border: "1px solid",
                      borderColor: changed ? "#68bde2" : "#e2e8f0",
                      borderRadius: "5px",
                      bgcolor: changed ? "#f0f9ff" : "#ffffff",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            color: "#1f2937",
                            fontSize: "14px",
                            fontWeight: 700,
                          }}
                        >
                          {item.item_name || item.item_code}
                        </Typography>

                        <Typography
                          sx={{
                            mt: "3px",
                            color: "#7b8794",
                            fontSize: "12px",
                          }}
                        >
                          {item.item_code}
                          {item.item_type ? `・${item.item_type}` : ""}
                        </Typography>
                      </Box>

                      {changed ? (
                        <Chip label="已變更" color="info" size="small" />
                      ) : null}
                    </Box>

                    <Typography
                      sx={{
                        mt: "10px",
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      目前金額：NT$ {formatAmount(item.amount)}
                    </Typography>

                    <TextField
                      fullWidth
                      type="number"
                      label="調整後金額"
                      value={item.new_amount}
                      onChange={(event) =>
                        handleAmountChange(
                          row.employee_id,
                          item.payroll_item_id,
                          event.target.value,
                        )
                      }
                      inputProps={{
                        min: 0,
                        step: "0.01",
                      }}
                      sx={{ mt: "10px" }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: "10px",
          mt: rows.length > 0 ? "8px" : "18px",
        }}
      >
        <Button
          variant="contained"
          startIcon={
            previewing ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : (
              <PreviewOutlinedIcon />
            )
          }
          disabled={
            previewing ||
            applying ||
            addingEmployee ||
            rows.length === 0
          }
          onClick={handlePreview}
          sx={{
            minHeight: "44px",
            px: "24px",
          }}
        >
          預覽調薪結果
        </Button>

        {previewResult?.valid && previewPayload ? (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleOutlineIcon />}
            disabled={
              previewing ||
              applying ||
              addingEmployee
            }
            onClick={handleOpenConfirmation}
            sx={{
              minHeight: "44px",
              px: "24px",
            }}
          >
            確認套用
          </Button>
        ) : null}
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={handleCloseConfirmation}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            color: "#1f2937",
            fontSize: {
              xs: "18px",
              sm: "20px",
            },
            fontWeight: 700,
          }}
        >
          確認正式套用批次調薪？
        </DialogTitle>

        <DialogContent>
          <Alert severity="warning">
            正式套用後，系統會關閉原薪資主檔的生效期間、建立新的薪資主檔，並寫入完整調薪歷程。請確認預覽內容正確。
          </Alert>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "repeat(3, minmax(0, 1fr))",
              },
              gap: "10px",
              mt: "16px",
            }}
          >
            {[
              {
                label: "調薪生效日",
                value:
                  previewResult?.effective_date ||
                  previewPayload?.effective_date ||
                  "--",
              },
              {
                label: "員工人數",
                value: `${
                  previewResult?.summary
                    ?.employee_count || 0
                } 位`,
              },
              {
                label: "變更科目",
                value: `${
                  previewResult?.summary
                    ?.changed_item_count || 0
                } 個`,
              },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  p: "13px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  bgcolor: "#f8fafc",
                }}
              >
                <Typography
                  sx={{
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  {item.label}
                </Typography>

                <Typography
                  sx={{
                    mt: "4px",
                    color: "#1f2937",
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography
            sx={{
              mt: "16px",
              color: "#64748b",
              fontSize: "13px",
              lineHeight: 1.7,
            }}
          >
            套用時後端會在資料庫交易內重新驗證所有員工及薪資科目。任何一筆資料失敗時，整個批次都不會寫入。
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: {
              xs: "16px",
              sm: "24px",
            },
            pb: {
              xs: "16px",
              sm: "20px",
            },
          }}
        >
          <Button
            variant="outlined"
            disabled={applying}
            onClick={handleCloseConfirmation}
          >
            返回檢查
          </Button>

          <Button
            variant="contained"
            color="success"
            startIcon={
              applying ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <CheckCircleOutlineIcon />
              )
            }
            disabled={applying}
            onClick={handleApply}
          >
            {applying
              ? "正在套用"
              : "確認正式套用"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
