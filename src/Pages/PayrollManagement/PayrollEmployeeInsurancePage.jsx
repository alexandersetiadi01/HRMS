import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditNoteIcon from "@mui/icons-material/EditNote";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  getEmployeeLaborInsuranceRecords,
  getEmployeeOccupationalInsuranceRecords,
  getEmployeePensionInsuranceRecords,
  getPayrollEmployees,
} from "../../API/payroll";

import InsuranceRecordManagementDialog from "./InsuranceRecordManagementDialog";
import InsuranceRecordOperationDialog from "./InsuranceRecordOperationDialog";
import PensionRecordOperationDialog from "./PensionRecordOperationDialog";

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
  if (type === "labor") {
    return record?.labor_insurance_record_id;
  }

  if (type === "occupational") {
    return record?.occupational_insurance_record_id;
  }

  return record?.pension_insurance_record_id;
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

function getPensionStatus(record) {
  if (!record) {
    return {
      label: "尚無資料",
      color: "default",
    };
  }

  if (record.action_type === "停繳") {
    return {
      label: "已停繳",
      color: "default",
    };
  }

  return {
    label: "提繳中",
    color: "success",
  };
}

function formatRate(value) {
  if (value === "" || value === null || value === undefined) {
    return "--";
  }

  const rate = Number(value);

  if (!Number.isFinite(rate)) {
    return "--";
  }

  return `${rate}%`;
}

function DetailField({ label, value }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: "12px",
        border: "1px solid #e5e7eb",
        borderRadius: "5px",
        bgcolor: "#f8fafc",
      }}
    >
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
          mt: "4px",
          color: "#1f2937",
          fontSize: "14px",
          fontWeight: 600,
          whiteSpace: "normal",
          overflowWrap: "anywhere",
        }}
      >
        {value || "--"}
      </Typography>
    </Box>
  );
}

function InsuranceRecordDetailDialog({ open, type, record, onClose }) {
  if (!record) {
    return null;
  }

  const isPension = type === "pension";

  const unitLabel =
    [record.insurance_unit_code, record.insurance_unit_name]
      .filter(Boolean)
      .join("｜") || "--";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isPension
          ? "勞退異動詳細資料"
          : type === "labor"
            ? "勞保異動詳細資料"
            : "職保異動詳細資料"}
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
            },
            gap: "12px",
          }}
        >
          <DetailField
            label="生效日"
            value={formatDate(record.effective_date)}
          />

          <DetailField label="異動" value={record.action_type || "--"} />

          <DetailField
            label={isPension ? "提繳單位" : "投保單位"}
            value={unitLabel}
          />

          {isPension ? (
            <>
              <DetailField
                label="籍別"
                value={record.nationality_type || "--"}
              />

              <DetailField
                label="月提繳工資"
                value={`NT$ ${formatAmount(record.insured_salary)}`}
              />

              <DetailField
                label="雇主提繳率"
                value={formatRate(record.employer_contribution_rate)}
              />

              <DetailField
                label="個人提繳率"
                value={formatRate(record.employee_contribution_rate)}
              />
            </>
          ) : (
            <>
              <DetailField
                label="投保身分"
                value={record.insurance_identity_name || "--"}
              />

              <DetailField
                label="投保薪資"
                value={`NT$ ${formatAmount(record.insured_salary)}`}
              />
            </>
          )}

          <DetailField
            label="狀態"
            value={isDeletedRecord(record) ? "已刪除" : record.status || "啟用"}
          />

          <Box
            sx={{
              gridColumn: {
                xs: "auto",
                sm: "1 / -1",
              },
            }}
          >
            <DetailField label="備註" value={record.remarks || "--"} />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: "12px 18px" }}>
        <Button type="button" variant="contained" onClick={onClose}>
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
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
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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
            sx={{
              width: "100%",
              minWidth: 0,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
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
              sx={{
                width: "100%",
                minWidth: 0,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              退保
            </Button>

            <Button
              type="button"
              size="small"
              variant="outlined"
              onClick={() => onOperation(type, "adjust")}
              sx={{
                width: "100%",
                minWidth: 0,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              調整薪資
            </Button>

            <Button
              type="button"
              size="small"
              variant="outlined"
              onClick={() => onOperation(type, "transfer")}
              sx={{
                width: "100%",
                minWidth: 0,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              轉換單位
            </Button>
          </>
        )}
      </Box>
    </Paper>
  );
}

function PensionSummaryCard({ record, onOperation }) {
  const status = getPensionStatus(record);

  const hasActivePension = Boolean(record) && record.action_type !== "停繳";

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
          勞退目前狀態
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
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
          },
          gap: {
            xs: "14px 12px",
            sm: "17px 20px",
          },
          mt: "18px",
        }}
      >
        <SummaryField
          label="提繳單位"
          value={
            record
              ? [record.insurance_unit_code, record.insurance_unit_name]
                  .filter(Boolean)
                  .join("｜") || "--"
              : "--"
          }
        />

        <SummaryField label="籍別" value={record?.nationality_type || "--"} />

        <SummaryField
          label="月提繳工資"
          value={record ? `NT$ ${formatAmount(record.insured_salary)}` : "--"}
        />

        <SummaryField
          label="雇主提繳率"
          value={formatRate(record?.employer_contribution_rate)}
        />

        <SummaryField
          label="個人提繳率"
          value={formatRate(record?.employee_contribution_rate)}
        />

        <SummaryField
          label="最近生效日"
          value={formatDate(record?.effective_date)}
        />
      </Box>

      {record?.action_type === "停繳" && (
        <Alert severity="warning" sx={{ mt: "16px" }}>
          此員工最近一筆紀錄為停繳，目前沒有有效勞退提繳。
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: hasActivePension
              ? "repeat(3, minmax(0, 1fr))"
              : "minmax(0, 1fr)",
            md: hasActivePension
              ? "repeat(3, minmax(0, 1fr))"
              : "minmax(0, 1fr)",
          },
          gap: "8px",
          mt: "18px",
          pt: "15px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        {!hasActivePension ? (
          <Button
            type="button"
            size="small"
            variant="contained"
            onClick={() => onOperation("pension", "enroll")}
            sx={{
              width: "100%",
              minWidth: 0,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            新增提繳
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="small"
              variant="outlined"
              color="error"
              onClick={() => onOperation("pension", "withdraw")}
              sx={{
                width: "100%",
                minWidth: 0,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              停繳
            </Button>

            <Button
              type="button"
              size="small"
              variant="outlined"
              onClick={() => onOperation("pension", "adjust")}
              sx={{
                width: "100%",
                minWidth: 0,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              調整提繳資料
            </Button>

            <Button
              type="button"
              size="small"
              variant="outlined"
              onClick={() => onOperation("pension", "transfer")}
              sx={{
                width: "100%",
                minWidth: 0,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              轉換單位
            </Button>
          </>
        )}
      </Box>
    </Paper>
  );
}

function getUnitLabel(record) {
  return (
    [record?.insurance_unit_code, record?.insurance_unit_name]
      .filter(Boolean)
      .join("｜") || "--"
  );
}

function TimelineUnitCell({ record }) {
  return (
    <Box
      sx={{
        whiteSpace: "normal",
        overflowWrap: "anywhere",
      }}
    >
      {getUnitLabel(record)}
    </Box>
  );
}

function TimelineActionChip({ actionType, pension = false }) {
  const positiveAction = pension ? "提繳" : "加保";

  const negativeAction = pension ? "停繳" : "退保";

  return (
    <Chip
      label={actionType || "--"}
      size="small"
      color={
        actionType === positiveAction
          ? "success"
          : actionType === negativeAction
            ? "default"
            : "primary"
      }
      variant="outlined"
    />
  );
}

function TimelineStatusCell({ record, isLatest, pension = false }) {
  if (isDeletedRecord(record)) {
    return (
      <Chip label="已刪除" size="small" color="error" variant="outlined" />
    );
  }

  if (pension && isLatest) {
    return (
      <Chip label="目前紀錄" size="small" color="success" variant="outlined" />
    );
  }

  return record.status || (pension ? "歷史紀錄" : "啟用");
}

function TimelineTable({
  title,
  type,
  records,
  latestRecordId,
  columns,
  renderActions,
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
        <TableContainer
          sx={{
            width: "100%",
            overflowX: "hidden",
          }}
        >
          <Table
            size="small"
            sx={{
              width: "100%",
              tableLayout: "auto",

              "& th, & td": {
                px: {
                  xs: "4px",
                  sm: "7px",
                  md: "10px",
                },
                py: "10px",
                fontSize: {
                  xs: "10px",
                  sm: "12px",
                  md: "13px",
                },
                lineHeight: 1.45,
                verticalAlign: "middle",
              },

              "& th": {
                fontWeight: 700,
              },
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || "left"}
                    sx={{
                      whiteSpace: column.wrap === true ? "normal" : "nowrap",
                      ...column.headerSx,
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}

                {renderActions && (
                  <TableCell
                    align="center"
                    sx={{
                      whiteSpace: "nowrap",
                    }}
                  >
                    操作
                  </TableCell>
                )}
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
                    key={`${type}-${recordId}`}
                    sx={{
                      opacity: deleted ? 0.62 : 1,

                      bgcolor: deleted
                        ? "#fafafa"
                        : type === "pension" && isLatest
                          ? "#f8fff9"
                          : "#ffffff",
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        align={column.align || "left"}
                        sx={{
                          whiteSpace:
                            column.wrap === true ? "normal" : "nowrap",

                          overflowWrap:
                            column.wrap === true ? "anywhere" : "normal",

                          ...column.cellSx,
                        }}
                      >
                        {column.render(record, {
                          deleted,
                          isLatest,
                          recordId,
                        })}
                      </TableCell>
                    ))}

                    {renderActions && (
                      <TableCell align="center">
                        {renderActions(record, {
                          deleted,
                          isLatest,
                          recordId,
                        })}
                      </TableCell>
                    )}
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

function getInsuranceTimelineColumns() {
  return [
    {
      key: "effective_date",
      label: "生效日",
      render: (record) => formatDate(record.effective_date),
    },
    {
      key: "action_type",
      label: "異動",
      render: (record) => (
        <TimelineActionChip actionType={record.action_type} />
      ),
    },
    {
      key: "insurance_unit",
      label: "投保單位",
      wrap: true,
      render: (record) => <TimelineUnitCell record={record} />,
    },
    {
      key: "insurance_identity",
      label: "投保身分",
      render: (record) => record.insurance_identity_name || "--",
    },
    {
      key: "insured_salary",
      label: "投保薪資",
      align: "right",
      render: (record) => formatAmount(record.insured_salary),
    },
    {
      key: "status",
      label: "狀態",
      render: (record, context) => (
        <TimelineStatusCell record={record} isLatest={context.isLatest} />
      ),
    },
  ];
}

function getPensionTimelineColumns() {
  return [
    {
      key: "effective_date",
      label: "生效日",
      render: (record) => formatDate(record.effective_date),
    },
    {
      key: "action_type",
      label: "異動",
      render: (record) => (
        <TimelineActionChip actionType={record.action_type} pension />
      ),
    },
    {
      key: "insurance_unit",
      label: "提繳單位",
      wrap: true,
      render: (record) => <TimelineUnitCell record={record} />,
    },
    {
      key: "nationality_type",
      label: "籍別",
      render: (record) => record.nationality_type || "--",
    },
    {
      key: "insured_salary",
      label: "月提繳工資",
      align: "right",
      render: (record) => formatAmount(record.insured_salary),
    },
    {
      key: "status",
      label: "狀態",
      render: (record, context) => (
        <TimelineStatusCell
          record={record}
          isLatest={context.isLatest}
          pension
        />
      ),
    },
  ];
}

export default function PayrollEmployeeInsurancePage() {
  const [employees, setEmployees] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [laborRecords, setLaborRecords] = useState([]);

  const [occupationalRecords, setOccupationalRecords] = useState([]);

  const [pensionRecords, setPensionRecords] = useState([]);

  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [loadingRecords, setLoadingRecords] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [operationDialog, setOperationDialog] = useState(null);

  const [operationDialogOpen, setOperationDialogOpen] = useState(false);

  const [managementDialog, setManagementDialog] = useState(null);

  const [detailDialog, setDetailDialog] = useState(null);

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
      setPensionRecords([]);
      return;
    }

    setLoadingRecords(true);
    setError("");

    try {
      const [laborResult, occupationalResult, pensionResult] =
        await Promise.all([
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
          getEmployeePensionInsuranceRecords({
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

      setPensionRecords(
        sortRecords(
          Array.isArray(pensionResult) ? pensionResult : [],
          "pension",
        ),
      );
    } catch (requestError) {
      setLaborRecords([]);
      setOccupationalRecords([]);
      setPensionRecords([]);

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

  const currentPensionRecord = useMemo(
    () => getCurrentRecord(pensionRecords, "pension"),
    [pensionRecords],
  );

  function handleOpenOperation(type, operation) {
    setSuccess("");
    setError("");

    setOperationDialog({
      type,
      operation,
    });

    setOperationDialogOpen(true);
  }

  async function handleOperationSuccess(message) {
    setSuccess(message);

    await loadRecords();

    setOperationDialogOpen(false);
  }

  function handleCloseOperationDialog() {
    setOperationDialogOpen(false);
  }

  function handleOperationDialogExited() {
    setOperationDialog(null);
  }

  function handleOpenDetail(type, record) {
    setDetailDialog({
      type,
      record,
    });
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

  function renderInsuranceTimelineActions(type, record, { isLatest }) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "nowrap",
          gap: {
            xs: 0,
            sm: "2px",
          },
        }}
      >
        <Tooltip title="查看詳細資料" arrow>
          <IconButton
            type="button"
            size="small"
            aria-label="查看詳細資料"
            onClick={() => handleOpenDetail(type, record)}
          >
            <VisibilityOutlinedIcon
              sx={{
                fontSize: {
                  xs: "17px",
                  sm: "20px",
                },
              }}
            />
          </IconButton>
        </Tooltip>

        <Tooltip title="查看歷程" arrow>
          <IconButton
            type="button"
            size="small"
            aria-label="查看歷程"
            onClick={() =>
              handleOpenManagement(type, "history", record, isLatest)
            }
          >
            <HistoryIcon
              sx={{
                fontSize: {
                  xs: "17px",
                  sm: "20px",
                },
              }}
            />
          </IconButton>
        </Tooltip>

        {isLatest && (
          <>
            <Tooltip title="修改備註" arrow>
              <IconButton
                type="button"
                size="small"
                aria-label="修改備註"
                onClick={() =>
                  handleOpenManagement(type, "remarks", record, true)
                }
              >
                <EditNoteIcon
                  sx={{
                    fontSize: {
                      xs: "18px",
                      sm: "21px",
                    },
                  }}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="刪除" arrow>
              <IconButton
                type="button"
                size="small"
                color="error"
                aria-label="刪除"
                onClick={() =>
                  handleOpenManagement(type, "delete", record, true)
                }
              >
                <DeleteOutlineIcon
                  sx={{
                    fontSize: {
                      xs: "17px",
                      sm: "20px",
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    );
  }

  function renderPensionTimelineActions(record, { isLatest }) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "nowrap",
          gap: {
            xs: 0,
            sm: "2px",
          },
        }}
      >
        <Tooltip title="查看詳細資料" arrow>
          <IconButton
            type="button"
            size="small"
            aria-label="查看詳細資料"
            onClick={() => handleOpenDetail("pension", record)}
          >
            <VisibilityOutlinedIcon
              sx={{
                fontSize: {
                  xs: "17px",
                  sm: "20px",
                },
              }}
            />
          </IconButton>
        </Tooltip>

        <Tooltip title="查看歷程" arrow>
          <IconButton
            type="button"
            size="small"
            aria-label="查看歷程"
            onClick={() =>
              handleOpenManagement("pension", "history", record, isLatest)
            }
          >
            <HistoryIcon
              sx={{
                fontSize: {
                  xs: "17px",
                  sm: "20px",
                },
              }}
            />
          </IconButton>
        </Tooltip>

        {isLatest && (
          <>
            <Tooltip title="修改備註" arrow>
              <IconButton
                type="button"
                size="small"
                aria-label="修改備註"
                onClick={() =>
                  handleOpenManagement("pension", "remarks", record, true)
                }
              >
                <EditNoteIcon
                  sx={{
                    fontSize: {
                      xs: "18px",
                      sm: "21px",
                    },
                  }}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="刪除" arrow>
              <IconButton
                type="button"
                size="small"
                color="error"
                aria-label="刪除"
                onClick={() =>
                  handleOpenManagement("pension", "delete", record, true)
                }
              >
                <DeleteOutlineIcon
                  sx={{
                    fontSize: {
                      xs: "17px",
                      sm: "20px",
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    );
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
        員工勞保／職保／勞退資料
      </Typography>

      <Typography
        sx={{
          mt: "5px",
          color: "#7b8794",
          fontSize: "13px",
        }}
      >
        查詢員工目前的勞保、職保與勞退狀態，以及各項異動歷程
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

                <Box
                  sx={{
                    gridColumn: {
                      xs: "auto",
                      md: "1 / -1",
                    },
                  }}
                >
                  <PensionSummaryCard
                    record={currentPensionRecord}
                    onOperation={handleOpenOperation}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr)",
                  gap: "18px",
                  mt: "18px",
                }}
              >
                <TimelineTable
                  title="勞保異動時間軸"
                  type="labor"
                  records={laborRecords}
                  latestRecordId={getRecordId(currentLaborRecord, "labor")}
                  columns={getInsuranceTimelineColumns()}
                  renderActions={(record, context) =>
                    renderInsuranceTimelineActions("labor", record, context)
                  }
                />

                <TimelineTable
                  title="職保異動時間軸"
                  type="occupational"
                  records={occupationalRecords}
                  latestRecordId={getRecordId(
                    currentOccupationalRecord,
                    "occupational",
                  )}
                  columns={getInsuranceTimelineColumns()}
                  renderActions={(record, context) =>
                    renderInsuranceTimelineActions(
                      "occupational",
                      record,
                      context,
                    )
                  }
                />

                <TimelineTable
                  title="勞退異動時間軸"
                  type="pension"
                  records={pensionRecords}
                  latestRecordId={getRecordId(currentPensionRecord, "pension")}
                  columns={getPensionTimelineColumns()}
                  renderActions={(record, context) =>
                    renderPensionTimelineActions(record, context)
                  }
                />
              </Box>
            </>
          )}
        </>
      )}

      {operationDialog && operationDialog.type !== "pension" && (
        <InsuranceRecordOperationDialog
          open={operationDialogOpen}
          type={operationDialog.type}
          operation={operationDialog.operation}
          employee={selectedEmployee}
          currentRecord={
            operationDialog.type === "labor"
              ? currentLaborRecord
              : currentOccupationalRecord
          }
          onClose={handleCloseOperationDialog}
          onSuccess={handleOperationSuccess}
        />
      )}

      {operationDialog?.type === "pension" && (
        <PensionRecordOperationDialog
          open={operationDialogOpen}
          operation={operationDialog.operation}
          employee={selectedEmployee}
          currentRecord={currentPensionRecord}
          onClose={handleCloseOperationDialog}
          onExited={handleOperationDialogExited}
          onSuccess={handleOperationSuccess}
        />
      )}

      {detailDialog && (
        <InsuranceRecordDetailDialog
          open
          type={detailDialog.type}
          record={detailDialog.record}
          onClose={() => setDetailDialog(null)}
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
