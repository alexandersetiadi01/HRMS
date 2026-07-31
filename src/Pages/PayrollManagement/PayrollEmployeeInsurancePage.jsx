import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  getEmployeeLaborInsuranceRecords,
  getEmployeeOccupationalInsuranceRecords,
  getPayrollEmployees,
} from "../../API/payroll";

import InsuranceRecordOperationDialog from "./InsuranceRecordOperationDialog";
import InsuranceRecordManagementDialog from "./InsuranceRecordManagementDialog";

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function getEmployeeName(employee) {
  return (
    employee?.display_name ||
    employee?.employee_name ||
    employee?.english_name ||
    employee?.employee_english_name ||
    employee?.email ||
    `員工 #${employee?.employee_id || "--"}`
  );
}

function getEmployeeLabel(employee) {
  const employeeNo = String(employee?.employee_no || "").trim();

  const employeeName = getEmployeeName(employee);

  return employeeNo ? `${employeeNo}｜${employeeName}` : employeeName;
}

function formatDate(value) {
  if (!value || value === "0000-00-00") {
    return "--";
  }

  return String(value).slice(0, 10).replaceAll("-", "/");
}

function formatAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "--";
  }

  return new Intl.NumberFormat("zh-TW").format(amount);
}

function isDeletedRecord(record) {
  return (
    record?.is_deleted === true ||
    Number(record?.is_deleted || 0) === 1 ||
    record?.status === "已刪除"
  );
}

function getRecordId(record, type) {
  return type === "labor"
    ? record?.labor_insurance_record_id
    : record?.occupational_insurance_record_id;
}

function sortRecords(records, type) {
  return [...records].sort((left, right) => {
    const dateComparison = String(right?.effective_date || "").localeCompare(
      String(left?.effective_date || ""),
    );

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return (
      Number(getRecordId(right, type) || 0) -
      Number(getRecordId(left, type) || 0)
    );
  });
}

function getCurrentRecord(records, type) {
  return (
    sortRecords(
      records.filter((record) => !isDeletedRecord(record)),
      type,
    )[0] || null
  );
}

function getInsuranceStatus(record) {
  if (!record) {
    return {
      label: "尚無資料",
      color: "default",
    };
  }

  if (record.action_type === "退保") {
    return {
      label: "已退保",
      color: "default",
    };
  }

  return {
    label: "投保中",
    color: "success",
  };
}

function SummaryField({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color: "#7b8794",
          fontSize: "12px",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: "3px",
          color: "#1f2937",
          fontSize: {
            xs: "14px",
            sm: "15px",
          },
          fontWeight: 600,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function InsuranceSummaryCard({ title, type, record, onOperation }) {
  const status = getInsuranceStatus(record);

  const hasActiveInsurance = record?.action_type === "加保";

  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: "15px",
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
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Typography
          component="h2"
          sx={{
            color: "#111827",
            fontSize: {
              xs: "16px",
              sm: "18px",
            },
            fontWeight: 700,
          }}
        >
          {title}
        </Typography>

        <Chip
          label={status.label}
          color={status.color}
          size="small"
          variant={status.color === "success" ? "filled" : "outlined"}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: {
            xs: "14px 12px",
            sm: "17px 20px",
          },
          mt: "18px",
        }}
      >
        <SummaryField
          label="投保單位"
          value={
            record
              ? [record.insurance_unit_code, record.insurance_unit_name]
                  .filter(Boolean)
                  .join("｜") || "--"
              : "--"
          }
        />

        <SummaryField
          label="投保身分"
          value={record?.insurance_identity_name || "--"}
        />

        <SummaryField
          label="投保薪資"
          value={record ? `NT$ ${formatAmount(record.insured_salary)}` : "--"}
        />

        <SummaryField
          label="最近生效日"
          value={formatDate(record?.effective_date)}
        />
      </Box>

      {record?.action_type === "退保" && (
        <Alert severity="warning" sx={{ mt: "16px" }}>
          此員工最近一筆紀錄為退保，目前沒有有效投保。
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          mt: "18px",
          pt: "15px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        {!hasActiveInsurance ? (
          <Button
            type="button"
            size="small"
            variant="contained"
            onClick={() => onOperation(type, "enroll")}
            sx={{ fontWeight: 700 }}
          >
            新增加保
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="small"
              variant="outlined"
              color="error"
              onClick={() => onOperation(type, "withdraw")}
              sx={{ fontWeight: 700 }}
            >
              退保
            </Button>

            <Button
              type="button"
              size="small"
              variant="outlined"
              onClick={() => onOperation(type, "adjust")}
              sx={{ fontWeight: 700 }}
            >
              調整投保薪資
            </Button>

            <Button
              type="button"
              size="small"
              variant="outlined"
              onClick={() => onOperation(type, "transfer")}
              sx={{ fontWeight: 700 }}
            >
              跨單位轉保
            </Button>
          </>
        )}
      </Box>
    </Paper>
  );
}

function InsuranceTimeline({
  title,
  type,
  records,
  latestRecordId,
  onManageRecord,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: "#dfe4e8",
        borderRadius: "5px",
        boxShadow: "none",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          px: {
            xs: "14px",
            sm: "18px",
          },
          py: "13px",
          borderBottom: "1px solid #e5e7eb",
          bgcolor: "#f8fafc",
        }}
      >
        <Typography
          component="h2"
          sx={{
            color: "#111827",
            fontSize: {
              xs: "15px",
              sm: "17px",
            },
            fontWeight: 700,
          }}
        >
          {title}
        </Typography>

        <Chip label={`${records.length} 筆`} size="small" variant="outlined" />
      </Box>

      {records.length === 0 ? (
        <Box
          sx={{
            px: "18px",
            py: "32px",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: "#7b8794",
              fontSize: "13px",
            }}
          >
            尚無異動紀錄
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small" sx={{ minWidth: 940 }}>
            <TableHead>
              <TableRow>
                <TableCell>生效日</TableCell>
                <TableCell>異動</TableCell>
                <TableCell>投保單位</TableCell>
                <TableCell>投保身分</TableCell>
                <TableCell align="right">投保薪資</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>備註</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {records.map((record) => {
                const deleted = isDeletedRecord(record);

                const recordId = getRecordId(record, type);

                const isLatest =
                  !deleted && Number(recordId) === Number(latestRecordId);

                return (
                  <TableRow
                    key={`${type}-${getRecordId(record, type)}`}
                    sx={{
                      opacity: deleted ? 0.62 : 1,
                      bgcolor: deleted ? "#fafafa" : "#ffffff",
                    }}
                  >
                    <TableCell>{formatDate(record.effective_date)}</TableCell>

                    <TableCell>
                      <Chip
                        label={record.action_type || "--"}
                        size="small"
                        color={
                          record.action_type === "加保"
                            ? "success"
                            : record.action_type === "退保"
                              ? "default"
                              : "primary"
                        }
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>
                      {[record.insurance_unit_code, record.insurance_unit_name]
                        .filter(Boolean)
                        .join("｜") || "--"}
                    </TableCell>

                    <TableCell>
                      {record.insurance_identity_name || "--"}
                    </TableCell>

                    <TableCell align="right">
                      {formatAmount(record.insured_salary)}
                    </TableCell>

                    <TableCell>
                      {deleted ? (
                        <Chip
                          label="已刪除"
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      ) : (
                        record.status || "啟用"
                      )}
                    </TableCell>

                    <TableCell
                      sx={{
                        maxWidth: "260px",
                        whiteSpace: "normal",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {record.remarks || "--"}
                    </TableCell>

                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          flexWrap: "wrap",
                          gap: "6px",
                          minWidth: "188px",
                        }}
                      >
                        <Button
                          type="button"
                          size="small"
                          variant="text"
                          onClick={() =>
                            onManageRecord(type, "history", record, isLatest)
                          }
                        >
                          查看歷程
                        </Button>

                        {isLatest && (
                          <>
                            <Button
                              type="button"
                              size="small"
                              variant="text"
                              onClick={() =>
                                onManageRecord(type, "remarks", record, true)
                              }
                            >
                              修改備註
                            </Button>

                            <Button
                              type="button"
                              size="small"
                              variant="text"
                              color="error"
                              onClick={() =>
                                onManageRecord(type, "delete", record, true)
                              }
                            >
                              刪除
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

export default function PayrollEmployeeInsurancePage() {
  const [employees, setEmployees] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [laborRecords, setLaborRecords] = useState([]);

  const [occupationalRecords, setOccupationalRecords] = useState([]);

  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [loadingRecords, setLoadingRecords] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [operationDialog, setOperationDialog] = useState(null);

  const [managementDialog, setManagementDialog] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      setLoadingEmployees(true);
      setError("");

      try {
        const result = await getPayrollEmployees({
          page: 1,
          per_page: 100,
        });

        if (!active) {
          return;
        }

        const employeeList = Array.isArray(result)
          ? [...result].sort((left, right) =>
              getEmployeeLabel(left).localeCompare(
                getEmployeeLabel(right),
                "zh-Hant",
              ),
            )
          : [];

        setEmployees(employeeList);

        setSelectedEmployee(
          (currentEmployee) => currentEmployee || employeeList[0] || null,
        );
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError, "無法載入員工資料。"));
        }
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

  const loadRecords = useCallback(async () => {
    const employeeId = Number(selectedEmployee?.employee_id || 0);

    if (!employeeId) {
      setLaborRecords([]);
      setOccupationalRecords([]);
      return;
    }

    setLoadingRecords(true);
    setError("");

    try {
      const [laborResult, occupationalResult] = await Promise.all([
        getEmployeeLaborInsuranceRecords({
          employee_id: employeeId,
          include_deleted: includeDeleted,
          per_page: 100,
        }),
        getEmployeeOccupationalInsuranceRecords({
          employee_id: employeeId,
          include_deleted: includeDeleted,
          per_page: 100,
        }),
      ]);

      setLaborRecords(
        sortRecords(Array.isArray(laborResult) ? laborResult : [], "labor"),
      );

      setOccupationalRecords(
        sortRecords(
          Array.isArray(occupationalResult) ? occupationalResult : [],
          "occupational",
        ),
      );
    } catch (requestError) {
      setLaborRecords([]);
      setOccupationalRecords([]);
      setError(getErrorMessage(requestError, "無法載入員工保險資料。"));
    } finally {
      setLoadingRecords(false);
    }
  }, [includeDeleted, selectedEmployee]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const currentLaborRecord = useMemo(
    () => getCurrentRecord(laborRecords, "labor"),
    [laborRecords],
  );

  const currentOccupationalRecord = useMemo(
    () => getCurrentRecord(occupationalRecords, "occupational"),
    [occupationalRecords],
  );

  function handleOpenOperation(type, operation) {
    setSuccess("");
    setError("");

    setOperationDialog({
      type,
      operation,
    });
  }

  async function handleOperationSuccess(message) {
    setOperationDialog(null);
    setSuccess(message);

    await loadRecords();
  }

  function handleOpenManagement(type, mode, record, isLatest) {
    setSuccess("");
    setError("");

    setManagementDialog({
      type,
      mode,
      record,
      isLatest,
    });
  }

  async function handleManagementSuccess(message) {
    setManagementDialog(null);
    setSuccess(message);

    await loadRecords();
  }

  return (
    <Box
      sx={{
        minHeight: "280px",
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
            xs: "18px",
            sm: "20px",
          },
          fontWeight: 700,
        }}
      >
        員工勞保／職保資料
      </Typography>

      <Typography
        sx={{
          mt: "5px",
          color: "#7b8794",
          fontSize: "13px",
        }}
      >
        查詢員工目前的投保單位、投保身分、投保薪資及異動歷程
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mt: "18px" }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mt: "18px" }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "minmax(0, 1fr) auto auto",
          },
          alignItems: {
            xs: "stretch",
            md: "center",
          },
          gap: {
            xs: "12px",
            md: "18px",
          },
          mt: "20px",
          p: {
            xs: "14px",
            sm: "18px",
          },
          borderColor: "#dfe4e8",
          borderRadius: "5px",
          boxShadow: "none",
        }}
      >
        <Autocomplete
          options={employees}
          value={selectedEmployee}
          loading={loadingEmployees}
          disabled={loadingEmployees}
          isOptionEqualToValue={(option, value) =>
            Number(option.employee_id) === Number(value.employee_id)
          }
          getOptionLabel={getEmployeeLabel}
          noOptionsText="找不到員工"
          loadingText="載入員工中..."
          onChange={(_, nextEmployee) => {
            setSelectedEmployee(nextEmployee);
            setError("");
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="搜尋並選擇員工"
              placeholder="輸入工號或姓名"
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingEmployees && (
                      <CircularProgress color="inherit" size={18} />
                    )}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <FormControlLabel
          control={
            <Switch
              checked={includeDeleted}
              onChange={(event) => setIncludeDeleted(event.target.checked)}
            />
          }
          label="顯示已刪除紀錄"
          sx={{
            m: 0,
            "& .MuiFormControlLabel-label": {
              fontSize: "13px",
            },
          }}
        />

        <Button
          type="button"
          variant="outlined"
          startIcon={<RefreshIcon />}
          disabled={loadingRecords || !selectedEmployee}
          onClick={loadRecords}
          sx={{
            minWidth: {
              xs: "100%",
              md: "96px",
            },
            fontWeight: 700,
          }}
        >
          重新整理
        </Button>
      </Paper>

      {!selectedEmployee && !loadingEmployees && (
        <Alert severity="info" sx={{ mt: "20px" }}>
          請先選擇需要查看的員工。
        </Alert>
      )}

      {selectedEmployee && (
        <>
          <Box
            sx={{
              mt: "20px",
              p: {
                xs: "14px",
                sm: "18px",
              },
              borderRadius: "5px",
              bgcolor: "#f8fafc",
            }}
          >
            <Typography
              sx={{
                color: "#111827",
                fontSize: {
                  xs: "16px",
                  sm: "18px",
                },
                fontWeight: 700,
              }}
            >
              {getEmployeeName(selectedEmployee)}
            </Typography>

            <Typography
              sx={{
                mt: "3px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              工號：
              {selectedEmployee.employee_no || "--"}
              {"　"}員工狀態：
              {selectedEmployee.employee_status || "--"}
            </Typography>
          </Box>

          {loadingRecords ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                minHeight: "260px",
              }}
            >
              <CircularProgress size={24} />

              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                載入保險資料中...
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: "16px",
                  mt: "18px",
                }}
              >
                <InsuranceSummaryCard
                  title="勞保目前狀態"
                  type="labor"
                  record={currentLaborRecord}
                  onOperation={handleOpenOperation}
                />

                <InsuranceSummaryCard
                  title="職保目前狀態"
                  type="occupational"
                  record={currentOccupationalRecord}
                  onOperation={handleOpenOperation}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr)",
                  gap: "18px",
                  mt: "18px",
                }}
              >
                <InsuranceTimeline
                  title="勞保異動時間軸"
                  type="labor"
                  records={laborRecords}
                  latestRecordId={getRecordId(currentLaborRecord, "labor")}
                  onManageRecord={handleOpenManagement}
                />

                <InsuranceTimeline
                  title="職保異動時間軸"
                  type="occupational"
                  records={occupationalRecords}
                  latestRecordId={getRecordId(
                    currentOccupationalRecord,
                    "occupational",
                  )}
                  onManageRecord={handleOpenManagement}
                />
              </Box>
            </>
          )}
        </>
      )}

      {operationDialog && (
        <InsuranceRecordOperationDialog
          open
          type={operationDialog.type}
          operation={operationDialog.operation}
          employee={selectedEmployee}
          currentRecord={
            operationDialog.type === "labor"
              ? currentLaborRecord
              : currentOccupationalRecord
          }
          onClose={() => setOperationDialog(null)}
          onSuccess={handleOperationSuccess}
        />
      )}

      {managementDialog && (
        <InsuranceRecordManagementDialog
          open
          type={managementDialog.type}
          mode={managementDialog.mode}
          record={managementDialog.record}
          isLatest={managementDialog.isLatest}
          onClose={() => setManagementDialog(null)}
          onSuccess={handleManagementSuccess}
        />
      )}
    </Box>
  );
}
