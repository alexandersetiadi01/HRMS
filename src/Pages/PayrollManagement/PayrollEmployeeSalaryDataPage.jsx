import { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
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
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
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
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PriceChangeOutlinedIcon from "@mui/icons-material/PriceChangeOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";

import {
  getEmployeeSalaryRecords,
  getPayrollEmployeeSalaryData,
  getSalaryAdjustmentHistory,
  getSalaryRecordItems,
  saveEmployeeSalaryRecord,
} from "../../API/payroll";

import PayrollAdjustmentHistoryDialog from "./PayrollAdjustmentHistoryDialog";
import SalaryRecordFormDialog from "./SalaryRecordFormDialog";

const PER_PAGE = 20;

const EMPTY_FILTERS = {
  search: "",
  employee_status: "",
  salary_data_status: "",
};

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function getApiErrorCode(error) {
  return (
    error?.response?.data?.code ||
    error?.response?.data?.data?.code ||
    error?.code ||
    ""
  );
}

function isSalaryRecordLockError(error) {
  return (
    getApiErrorCode(error) === "hrms_salary_record_payroll_used" ||
    Number(error?.response?.status || 0) === 409 ||
    error?.response?.data?.data?.is_payroll_used === true
  );
}

function getEmployeeName(employee) {
  return (
    employee?.display_name ||
    employee?.english_name ||
    employee?.email ||
    `員工 #${employee?.employee_id || "--"}`
  );
}

function formatDate(value) {
  if (!value || value === "0000-00-00") {
    return "--";
  }

  return String(value).slice(0, 10).replaceAll("-", "/");
}

function getEffectivePeriod(employee) {
  if (!employee?.has_salary_data) {
    return "--";
  }

  return `${formatDate(
    employee.effective_from,
  )} ～ ${formatDate(employee.effective_to)}`;
}

function normalizeComparableDate(value) {
  if (!value || value === "0000-00-00") {
    return "";
  }

  return String(value).slice(0, 10);
}

function isPayrollUsedRecord(record) {
  return (
    record?.is_payroll_used === true ||
    Number(record?.is_payroll_used || 0) === 1 ||
    Number(record?.payroll_result_count || 0) > 0
  );
}

function findEditableSalaryRecord(employee, records) {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const employeeRecordId = Number(employee?.salary_record_id || 0);

  if (employeeRecordId > 0) {
    const matchingRecord = records.find(
      (record) => Number(record.salary_record_id) === employeeRecordId,
    );

    if (matchingRecord) {
      return matchingRecord;
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  const currentlyEffectiveRecords = records.filter((record) => {
    const effectiveFrom = normalizeComparableDate(record.effective_from);

    const effectiveTo = normalizeComparableDate(record.effective_to);

    return (
      record.status === "啟用" &&
      (!effectiveFrom || effectiveFrom <= today) &&
      (!effectiveTo || effectiveTo >= today)
    );
  });

  const candidateRecords =
    currentlyEffectiveRecords.length > 0
      ? currentlyEffectiveRecords
      : records.filter((record) => record.status === "啟用");

  return (
    [...candidateRecords].sort((left, right) =>
      normalizeComparableDate(right.effective_from).localeCompare(
        normalizeComparableDate(left.effective_from),
      ),
    )[0] || null
  );
}

function getSalaryTypeLabel(value) {
  const labels = {
    monthly: "月薪",
    hourly: "時薪",
    月薪: "月薪",
    時薪: "時薪",
  };

  return labels[value] || value || "--";
}

function SalaryDataChip({ hasSalaryData }) {
  return (
    <Chip
      label={hasSalaryData ? "已設定" : "未設定"}
      size="small"
      color={hasSalaryData ? "success" : "warning"}
      variant={hasSalaryData ? "filled" : "outlined"}
      sx={{ fontWeight: 700 }}
    />
  );
}

function SummaryItem({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color: "#94a3b8",
          fontSize: "11px",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: "2px",
          color: "#334155",
          fontSize: "14px",
          fontWeight: 600,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function getSalaryItemTypeLabel(value) {
  const labels = {
    earning: "加項",
    allowance: "加項",
    income: "加項",
    deduction: "扣項",
    加項: "加項",
    扣項: "扣項",
  };

  return labels[value] || value || "--";
}

function getSalaryItemColor(value) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();

  if (normalizedValue === "deduction" || normalizedValue === "扣項") {
    return "error";
  }

  if (
    normalizedValue === "earning" ||
    normalizedValue === "allowance" ||
    normalizedValue === "income" ||
    normalizedValue === "加項"
  ) {
    return "success";
  }

  return "default";
}

function formatAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "--";
  }

  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 2,
  }).format(amount);
}

function EmployeeAdjustmentHistoryDialog({
  open,
  employee,
  batches,
  loading,
  error,
  onSelectBatch,
  onClose,
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          width: {
            xs: "calc(100% - 24px)",
            sm: "calc(100% - 48px)",
          },
          maxHeight: "calc(100% - 48px)",
          m: {
            xs: "12px",
            sm: "24px",
          },
          borderRadius: "6px",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: {
            xs: "16px",
            sm: "22px",
          },
          py: "16px",
        }}
      >
        <Typography
          component="div"
          sx={{
            color: "#111827",
            fontSize: {
              xs: "17px",
              sm: "20px",
            },
            fontWeight: 700,
          }}
        >
          調薪異動歷程
        </Typography>

        <Typography
          component="div"
          sx={{
            mt: "3px",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          {getEmployeeName(employee)}
          {employee?.employee_no ? `（${employee.employee_no}）` : ""}
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          px: {
            xs: "14px",
            sm: "22px",
          },
          py: "18px",
          bgcolor: "#f8fafc",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: "48px",
            }}
          >
            <CircularProgress size={34} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : batches.length === 0 ? (
          <Alert severity="info">此員工目前沒有調薪異動紀錄。</Alert>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: "12px",
            }}
          >
            {batches.map((batch, index) => (
              <Paper
                key={
                  batch.salary_adjustment_batch_id ||
                  `${batch.batch_code}-${index}`
                }
                variant="outlined"
                sx={{
                  p: {
                    xs: "14px",
                    sm: "17px",
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
                    gap: "8px",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: "#1f2937",
                        fontSize: {
                          xs: "15px",
                          sm: "16px",
                        },
                        fontWeight: 700,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {batch.batch_code || "--"}
                    </Typography>

                    <Typography
                      sx={{
                        mt: "3px",
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      生效日：
                      {formatDate(batch.effective_date)}
                    </Typography>
                  </Box>

                  <Chip
                    label={batch.status || "--"}
                    size="small"
                    color={batch.status === "已套用" ? "success" : "default"}
                    variant={batch.status === "已套用" ? "filled" : "outlined"}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, minmax(0, 1fr))",
                      sm: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: {
                      xs: "12px",
                      sm: "16px",
                    },
                    mt: "14px",
                    p: "12px",
                    borderRadius: "5px",
                    bgcolor: "#f8fafc",
                  }}
                >
                  <SummaryItem
                    label="變更科目"
                    value={`${Number(batch.changed_item_count || 0)} 個`}
                  />

                  <SummaryItem
                    label="套用日期"
                    value={formatDate(batch.applied_at || batch.created_at)}
                  />

                  <SummaryItem
                    label="批次編號"
                    value={
                      batch.salary_adjustment_batch_id
                        ? `#${batch.salary_adjustment_batch_id}`
                        : "--"
                    }
                  />
                </Box>

                {batch.remarks ? (
                  <Box
                    sx={{
                      mt: "12px",
                      pt: "12px",
                      borderTop: "1px solid #edf0f3",
                    }}
                  >
                    <SummaryItem label="批次備註" value={batch.remarks} />
                  </Box>
                ) : null}

                <Button
                  type="button"
                  variant="outlined"
                  fullWidth
                  onClick={() =>
                    onSelectBatch(batch.salary_adjustment_batch_id)
                  }
                  sx={{
                    mt: "14px",
                    fontWeight: 700,
                  }}
                >
                  查看本次異動明細
                </Button>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: {
            xs: "16px",
            sm: "22px",
          },
          py: "12px",
        }}
      >
        <Button
          type="button"
          variant="outlined"
          onClick={onClose}
          disabled={loading}
        >
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SalaryHistoryDialog({
  open,
  employee,
  records,
  loading,
  error,
  onClose,
}) {
  const [expandedRecordId, setExpandedRecordId] = useState(null);
  const [itemsByRecord, setItemsByRecord] = useState({});
  const [loadingRecordId, setLoadingRecordId] = useState(null);
  const [itemErrors, setItemErrors] = useState({});

  useEffect(() => {
    setExpandedRecordId(null);
    setItemsByRecord({});
    setLoadingRecordId(null);
    setItemErrors({});
  }, [employee?.employee_id, open]);

  async function handleRecordExpansion(recordId, expanded) {
    if (!expanded) {
      setExpandedRecordId(null);
      return;
    }

    setExpandedRecordId(recordId);

    if (Object.prototype.hasOwnProperty.call(itemsByRecord, recordId)) {
      return;
    }

    setLoadingRecordId(recordId);

    setItemErrors((current) => ({
      ...current,
      [recordId]: "",
    }));

    try {
      const result = await getSalaryRecordItems(recordId);

      setItemsByRecord((current) => ({
        ...current,
        [recordId]: Array.isArray(result) ? result : [],
      }));
    } catch (requestError) {
      setItemErrors((current) => ({
        ...current,
        [recordId]: getErrorMessage(
          requestError,
          "無法讀取此薪資資料的薪資科目。",
        ),
      }));
    } finally {
      setLoadingRecordId((current) => (current === recordId ? null : current));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          width: {
            xs: "calc(100% - 24px)",
            sm: "calc(100% - 48px)",
          },
          maxHeight: "calc(100% - 48px)",
          m: {
            xs: "12px",
            sm: "24px",
          },
          borderRadius: "6px",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: {
            xs: "16px",
            sm: "22px",
          },
          py: "16px",
        }}
      >
        <Typography
          component="div"
          sx={{
            color: "#111827",
            fontSize: {
              xs: "17px",
              sm: "20px",
            },
            fontWeight: 700,
          }}
        >
          薪資資料歷程
        </Typography>

        <Typography
          component="div"
          sx={{
            mt: "3px",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          {getEmployeeName(employee)}
          {employee?.employee_no ? `（${employee.employee_no}）` : ""}
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          px: {
            xs: "14px",
            sm: "22px",
          },
          py: "18px",
          bgcolor: "#f8fafc",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: "48px",
            }}
          >
            <CircularProgress size={34} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : records.length === 0 ? (
          <Alert severity="info">此員工目前沒有薪資資料歷程。</Alert>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: "12px",
            }}
          >
            {records.map((record, index) => (
              <Paper
                key={
                  record.salary_record_id || `${record.effective_from}-${index}`
                }
                variant="outlined"
                sx={{
                  p: {
                    xs: "14px",
                    sm: "17px",
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
                    gap: "8px",
                  }}
                >
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
                    {formatDate(record.effective_from)}
                    {" ～ "}
                    {formatDate(record.effective_to)}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "7px",
                    }}
                  >
                    {isPayrollUsedRecord(record) ? (
                      <Tooltip
                        title="此薪資資料已用於計薪結果，只能查看。薪資變更請使用「調薪異動」。"
                        arrow
                      >
                        <Chip
                          icon={<LockOutlinedIcon />}
                          label={`已用於計薪・唯讀${
                            Number(record.payroll_result_count || 0) > 0
                              ? `（${Number(record.payroll_result_count)} 筆）`
                              : ""
                          }`}
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                      </Tooltip>
                    ) : null}

                    <Chip
                      label={record.status || "未設定"}
                      size="small"
                      color={record.status === "啟用" ? "success" : "default"}
                      variant={record.status === "啟用" ? "filled" : "outlined"}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, minmax(0, 1fr))",
                      sm: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: {
                      xs: "13px",
                      sm: "16px",
                    },
                    mt: "14px",
                    p: {
                      xs: "12px",
                      sm: "14px",
                    },
                    borderRadius: "5px",
                    bgcolor: "#f8fafc",
                  }}
                >
                  <SummaryItem
                    label="薪資類型"
                    value={getSalaryTypeLabel(record.salary_type)}
                  />

                  <SummaryItem
                    label="薪資範圍"
                    value={record.range_name || record.range_code || "--"}
                  />

                  <SummaryItem
                    label="薪轉銀行"
                    value={record.bank_name || record.bank_code || "--"}
                  />

                  <SummaryItem
                    label="資料編號"
                    value={
                      record.salary_record_id
                        ? `#${record.salary_record_id}`
                        : "--"
                    }
                  />

                  {record.remark || record.remarks || record.note ? (
                    <Box
                      sx={{
                        gridColumn: "1 / -1",
                      }}
                    >
                      <SummaryItem
                        label="備註"
                        value={record.remark || record.remarks || record.note}
                      />
                    </Box>
                  ) : null}
                </Box>

                <Accordion
                  expanded={expandedRecordId === record.salary_record_id}
                  onChange={(_event, expanded) =>
                    handleRecordExpansion(record.salary_record_id, expanded)
                  }
                  disableGutters
                  elevation={0}
                  sx={{
                    mt: "12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "5px",
                    overflow: "hidden",
                    "&::before": {
                      display: "none",
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: "46px",
                      bgcolor: "#f8fafc",
                      "&.Mui-expanded": {
                        minHeight: "46px",
                      },
                      "& .MuiAccordionSummary-content": {
                        my: "10px",
                      },
                      "& .MuiAccordionSummary-content.Mui-expanded": {
                        my: "10px",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#334155",
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    >
                      查看薪資科目明細
                    </Typography>
                  </AccordionSummary>

                  <AccordionDetails
                    sx={{
                      p: {
                        xs: "12px",
                        sm: "14px",
                      },
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    {loadingRecordId === record.salary_record_id ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          py: "28px",
                        }}
                      >
                        <CircularProgress size={28} />
                      </Box>
                    ) : itemErrors[record.salary_record_id] ? (
                      <Alert severity="error">
                        {itemErrors[record.salary_record_id]}
                      </Alert>
                    ) : (
                      (() => {
                        const salaryItems =
                          itemsByRecord[record.salary_record_id] || [];

                        if (salaryItems.length === 0) {
                          return (
                            <Alert severity="info">
                              此薪資資料沒有薪資科目明細。
                            </Alert>
                          );
                        }

                        return (
                          <Box
                            sx={{
                              display: "grid",
                              gap: "8px",
                            }}
                          >
                            {salaryItems.map((item, itemIndex) => (
                              <Box
                                key={
                                  item.salary_item_id ||
                                  `${item.item_code}-${itemIndex}`
                                }
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: {
                                    xs: "minmax(0, 1fr) auto",
                                    sm: "120px minmax(0, 1fr) 90px 130px",
                                  },
                                  alignItems: "center",
                                  gap: {
                                    xs: "8px",
                                    sm: "12px",
                                  },
                                  p: {
                                    xs: "11px",
                                    sm: "12px",
                                  },
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "5px",
                                  bgcolor: "#ffffff",
                                }}
                              >
                                <Box
                                  sx={{
                                    minWidth: 0,
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      color: "#94a3b8",
                                      fontSize: "11px",
                                    }}
                                  >
                                    科目代碼
                                  </Typography>

                                  <Typography
                                    sx={{
                                      mt: "2px",
                                      color: "#475569",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    {item.item_code || "--"}
                                  </Typography>
                                </Box>

                                <Box
                                  sx={{
                                    minWidth: 0,
                                    gridColumn: {
                                      xs: "1 / -1",
                                      sm: "auto",
                                    },
                                    gridRow: {
                                      xs: 1,
                                      sm: "auto",
                                    },
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      color: "#94a3b8",
                                      fontSize: "11px",
                                    }}
                                  >
                                    薪資科目
                                  </Typography>

                                  <Typography
                                    sx={{
                                      mt: "2px",
                                      color: "#1f2937",
                                      fontSize: "14px",
                                      fontWeight: 700,
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    {item.item_name || "--"}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Typography
                                    sx={{
                                      mb: "3px",
                                      color: "#94a3b8",
                                      fontSize: "11px",
                                    }}
                                  >
                                    類型
                                  </Typography>

                                  <Chip
                                    label={getSalaryItemTypeLabel(
                                      item.item_type,
                                    )}
                                    size="small"
                                    color={getSalaryItemColor(item.item_type)}
                                    variant="outlined"
                                    sx={{
                                      fontWeight: 700,
                                    }}
                                  />
                                </Box>

                                <Box
                                  sx={{
                                    textAlign: {
                                      xs: "right",
                                      sm: "right",
                                    },
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      color: "#94a3b8",
                                      fontSize: "11px",
                                    }}
                                  >
                                    金額
                                  </Typography>

                                  <Typography
                                    sx={{
                                      mt: "2px",
                                      color: "#0f172a",
                                      fontSize: "15px",
                                      fontWeight: 700,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    NT$ {formatAmount(item.amount)}
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        );
                      })()
                    )}
                  </AccordionDetails>
                </Accordion>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: {
            xs: "16px",
            sm: "22px",
          },
          py: "12px",
        }}
      >
        <Button
          type="button"
          variant="outlined"
          onClick={onClose}
          disabled={loading}
        >
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EmployeeMobileCard({
  employee,
  onManageSalaryData,
  onViewHistory,
  onViewAdjustments,
  managing,
  salaryDataLocked,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: "14px",
          sm: "17px",
        },
        borderColor: "#dfe4e8",
        borderRadius: "5px",
        boxShadow: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#1f2937",
              fontSize: {
                xs: "15px",
                sm: "17px",
              },
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {getEmployeeName(employee)}
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            {employee.employee_no || "--"}
          </Typography>
        </Box>

        <SalaryDataChip hasSalaryData={Boolean(employee.has_salary_data)} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: {
            xs: "12px",
            sm: "16px",
          },
          mt: "15px",
          p: "12px",
          borderRadius: "5px",
          bgcolor: "#f8fafc",
        }}
      >
        <SummaryItem
          label="員工狀態"
          value={employee.employee_status || "--"}
        />

        <SummaryItem
          label="薪資類型"
          value={getSalaryTypeLabel(employee.salary_type)}
        />

        <Box sx={{ gridColumn: "1 / -1" }}>
          <SummaryItem
            label="目前生效期間"
            value={getEffectivePeriod(employee)}
          />
        </Box>

        <SummaryItem
          label="薪資範圍"
          value={employee.range_name || employee.range_code || "--"}
        />

        <SummaryItem
          label="歷程筆數"
          value={`${Number(employee.salary_record_count || 0)} 筆`}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
          },
          gap: "10px",
          mt: "12px",
        }}
      >
        <Tooltip
          title={
            salaryDataLocked
              ? "此薪資資料已用於計薪，只能查看。薪資變更請使用「調薪異動」。"
              : employee.has_salary_data
                ? "編輯薪資資料"
                : "新增薪資資料"
          }
          arrow
        >
          <span
            style={{
              gridColumn: "1 / -1",
              width: "100%",
            }}
          >
            <Button
              type="button"
              variant={employee.has_salary_data ? "outlined" : "contained"}
              fullWidth
              disabled={managing || salaryDataLocked}
              startIcon={salaryDataLocked ? <LockOutlinedIcon /> : null}
              onClick={() => onManageSalaryData(employee)}
              sx={{ fontWeight: 700 }}
            >
              {managing
                ? "讀取中..."
                : salaryDataLocked
                  ? "薪資資料唯讀"
                  : employee.has_salary_data
                    ? "編輯薪資資料"
                    : "新增薪資資料"}
            </Button>
          </span>
        </Tooltip>

        <Button
          type="button"
          variant="outlined"
          fullWidth
          disabled={managing || Number(employee.salary_record_count || 0) === 0}
          onClick={() => onViewHistory(employee)}
          sx={{ fontWeight: 700 }}
        >
          查看薪資歷程
        </Button>

        <Button
          type="button"
          variant="outlined"
          fullWidth
          disabled={managing}
          onClick={() => onViewAdjustments(employee)}
          sx={{ fontWeight: 700 }}
        >
          調薪異動
        </Button>
      </Box>
    </Paper>
  );
}

export default function PayrollEmployeeSalaryDataPage() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: PER_PAGE,
    total: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formEmployee, setFormEmployee] = useState(null);
  const [formRecord, setFormRecord] = useState(null);
  const [formRecordItems, setFormRecordItems] = useState([]);
  const [formLoadingEmployeeId, setFormLoadingEmployeeId] = useState(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formSaveError, setFormSaveError] = useState("");
  const [lockedSalaryEmployees, setLockedSalaryEmployees] = useState({});

  const [historyEmployee, setHistoryEmployee] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [adjustmentEmployee, setAdjustmentEmployee] = useState(null);

  const [adjustmentBatches, setAdjustmentBatches] = useState([]);

  const [adjustmentLoading, setAdjustmentLoading] = useState(false);

  const [adjustmentError, setAdjustmentError] = useState("");

  const [selectedAdjustmentBatchId, setSelectedAdjustmentBatchId] =
    useState(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getPayrollEmployeeSalaryData({
        page,
        per_page: PER_PAGE,
        ...appliedFilters,
      });

      const nextPagination = result?.pagination || {};

      setRows(Array.isArray(result?.rows) ? result.rows : []);

      setPagination({
        page: Number(nextPagination.page || page),
        per_page: Number(nextPagination.per_page || PER_PAGE),
        total: Number(nextPagination.total || 0),
        total_pages: Number(nextPagination.total_pages || 0),
      });
    } catch (requestError) {
      setRows([]);

      setPagination({
        page,
        per_page: PER_PAGE,
        total: 0,
        total_pages: 0,
      });

      setError(getErrorMessage(requestError, "無法讀取員工薪資保險資料。"));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSuccessMessage("");
    setAppliedFilters({ ...filters });
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
    setError("");
    setSuccessMessage("");
  }

  async function handleManageSalaryData(employee) {
    if (!employee?.employee_id) {
      setError("找不到要設定薪資資料的員工。");
      return;
    }

    if (lockedSalaryEmployees[Number(employee.employee_id)]) {
      setError(
        "此員工目前的薪資資料已用於計薪結果，不能直接編輯。請使用「調薪異動」建立新的薪資設定。",
      );
      return;
    }

    setFormLoadingEmployeeId(employee.employee_id);
    setFormSaveError("");
    setError("");
    setSuccessMessage("");

    try {
      if (!employee.has_salary_data) {
        setFormEmployee(employee);
        setFormRecord(null);
        setFormRecordItems([]);
        return;
      }

      const records = await getEmployeeSalaryRecords(employee.employee_id);

      const normalizedRecords = Array.isArray(records) ? records : [];

      const editableRecord = findEditableSalaryRecord(
        employee,
        normalizedRecords,
      );

      if (!editableRecord?.salary_record_id) {
        throw new Error("找不到此員工目前可編輯的薪資資料。");
      }

      if (isPayrollUsedRecord(editableRecord)) {
        setLockedSalaryEmployees((current) => ({
          ...current,
          [Number(employee.employee_id)]: true,
        }));

        setError(
          "此員工目前的薪資資料已用於計薪結果，不能直接編輯。請使用「調薪異動」建立新的薪資設定。",
        );
        return;
      }

      setLockedSalaryEmployees((current) => {
        const next = { ...current };

        delete next[Number(employee.employee_id)];

        return next;
      });

      const recordItems = await getSalaryRecordItems(
        editableRecord.salary_record_id,
      );

      setFormEmployee(employee);
      setFormRecord(editableRecord);
      setFormRecordItems(Array.isArray(recordItems) ? recordItems : []);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          employee.has_salary_data
            ? "無法讀取此員工目前的薪資資料。"
            : "無法開啟新增薪資資料表單。",
        ),
      );
    } finally {
      setFormLoadingEmployeeId(null);
    }
  }

  function handleCloseSalaryForm() {
    if (formSaving) {
      return;
    }

    setFormEmployee(null);
    setFormRecord(null);
    setFormRecordItems([]);
    setFormSaveError("");
  }

  async function handleSaveSalaryData(values) {
    if (!formEmployee?.employee_id) {
      setFormSaveError("找不到要儲存薪資資料的員工。");
      return;
    }

    setFormSaving(true);
    setFormSaveError("");
    setError("");
    setSuccessMessage("");

    try {
      await saveEmployeeSalaryRecord({
        employeeId: formEmployee.employee_id,
        record: formRecord,
        originalItems: formRecordItems,
        values,
      });

      const savedEmployeeName = getEmployeeName(formEmployee);

      const wasEditing = Boolean(formRecord?.salary_record_id);

      setFormEmployee(null);
      setFormRecord(null);
      setFormRecordItems([]);

      await loadEmployees();

      setSuccessMessage(
        wasEditing
          ? `已更新 ${savedEmployeeName} 的薪資資料。`
          : `已新增 ${savedEmployeeName} 的薪資資料。`,
      );
    } catch (requestError) {
      const salaryRecordLocked = isSalaryRecordLockError(requestError);

      if (salaryRecordLocked) {
        const lockedEmployeeId = Number(formEmployee.employee_id);

        setLockedSalaryEmployees((current) => ({
          ...current,
          [lockedEmployeeId]: true,
        }));

        setFormEmployee(null);
        setFormRecord(null);
        setFormRecordItems([]);
        setFormSaveError("");

        try {
          await loadEmployees();
        } catch {
          // loadEmployees already displays its own error.
        }

        setError(
          getErrorMessage(
            requestError,
            "此薪資資料已用於計薪結果，不能直接修改。請使用「調薪異動」建立新的薪資設定。",
          ),
        );

        return;
      }

      const partialSave = Boolean(requestError?.partialSave);

      if (partialSave) {
        try {
          const refreshedRecords = await getEmployeeSalaryRecords(
            formEmployee.employee_id,
          );

          const refreshedRecord = findEditableSalaryRecord(
            formEmployee,
            Array.isArray(refreshedRecords) ? refreshedRecords : [],
          );

          if (refreshedRecord?.salary_record_id) {
            if (isPayrollUsedRecord(refreshedRecord)) {
              setLockedSalaryEmployees((current) => ({
                ...current,
                [Number(formEmployee.employee_id)]: true,
              }));

              setFormEmployee(null);
              setFormRecord(null);
              setFormRecordItems([]);
            } else {
              const refreshedItems = await getSalaryRecordItems(
                refreshedRecord.salary_record_id,
              );

              setFormRecord(refreshedRecord);
              setFormRecordItems(
                Array.isArray(refreshedItems) ? refreshedItems : [],
              );
            }
          }

          await loadEmployees();    
        } catch {
          // Preserve the original save error.
        }
      }

      setFormSaveError(
        getErrorMessage(
          requestError,
          partialSave
            ? "部分資料可能已儲存。系統已重新讀取目前資料，請確認後再儲存。"
            : "無法儲存此員工的薪資資料。",
        ),
      );
    } finally {
      setFormSaving(false);
    }
  }

  async function handleOpenHistory(employee) {
    setHistoryEmployee(employee);
    setHistoryRecords([]);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const result = await getEmployeeSalaryRecords(employee.employee_id);

      setHistoryRecords(Array.isArray(result) ? result : []);
    } catch (requestError) {
      setHistoryError(
        getErrorMessage(requestError, "無法讀取此員工的薪資資料歷程。"),
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  function handleCloseHistory() {
    if (historyLoading) {
      return;
    }

    setHistoryEmployee(null);
    setHistoryRecords([]);
    setHistoryError("");
  }

  async function handleOpenAdjustments(employee) {
    setAdjustmentEmployee(employee);
    setAdjustmentBatches([]);
    setAdjustmentError("");
    setAdjustmentLoading(true);

    try {
      const result = await getSalaryAdjustmentHistory({
        page: 1,
        per_page: 100,
        employee_id: employee.employee_id,
      });

      setAdjustmentBatches(Array.isArray(result?.rows) ? result.rows : []);
    } catch (requestError) {
      setAdjustmentError(
        getErrorMessage(requestError, "無法讀取此員工的調薪異動紀錄。"),
      );
    } finally {
      setAdjustmentLoading(false);
    }
  }

  function handleCloseAdjustments() {
    if (adjustmentLoading) {
      return;
    }

    setAdjustmentEmployee(null);
    setAdjustmentBatches([]);
    setAdjustmentError("");
    setSelectedAdjustmentBatchId(null);
  }

  function handleOpenAdjustmentDetail(batchId) {
    if (!batchId) {
      return;
    }

    setSelectedAdjustmentBatchId(batchId);
  }

  function handleCloseAdjustmentDetail() {
    setSelectedAdjustmentBatchId(null);
  }

  return (
    <Box
      sx={{
        minHeight: "360px",
        p: {
          xs: "14px",
          sm: "18px",
          md: "22px",
        },
        border: "1px solid #dfe4e8",
        borderRadius: "5px",
        bgcolor: "#ffffff",
      }}
    >
      <Box sx={{ mb: "18px" }}>
        <Typography
          sx={{
            color: "#111827",
            fontSize: {
              xs: "18px",
              sm: "20px",
            },
            fontWeight: 700,
          }}
        >
          員工薪資保險資料
        </Typography>

        <Typography
          sx={{
            mt: "3px",
            color: "#7b8794",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          查詢所有員工目前的薪資設定與薪資主檔歷程筆數
        </Typography>
      </Box>

      {error ? (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: "14px" }}
        >
          {error}
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage("")}
          sx={{ mb: "14px" }}
        >
          {successMessage}
        </Alert>
      ) : null}

      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            md:
              "minmax(0, 1.4fr) " +
              "repeat(2, minmax(0, 0.9fr)) " +
              "minmax(200px, 1fr)",
          },
          gap: "10px",
          mb: "16px",
          p: {
            xs: "13px",
            sm: "15px",
          },
          border: "1px solid #e2e8f0",
          borderRadius: "5px",
          bgcolor: "#f8fafc",
        }}
      >
        <TextField
          size="small"
          label="搜尋員工編號、姓名或 Email"
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{
                    color: "#94a3b8",
                    fontSize: "20px",
                  }}
                />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 0 }}
        />

        <FormControl size="small" sx={{ minWidth: 0 }}>
          <InputLabel id="employee-salary-status-label">員工狀態</InputLabel>

          <Select
            labelId="employee-salary-status-label"
            label="員工狀態"
            value={filters.employee_status}
            onChange={(event) =>
              updateFilter("employee_status", event.target.value)
            }
          >
            <MenuItem value="">全部狀態</MenuItem>
            <MenuItem value="啟用">啟用</MenuItem>
            <MenuItem value="停用">停用</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 0 }}>
          <InputLabel id="employee-salary-data-status-label">
            薪資資料
          </InputLabel>

          <Select
            labelId="employee-salary-data-status-label"
            label="薪資資料"
            value={filters.salary_data_status}
            onChange={(event) =>
              updateFilter("salary_data_status", event.target.value)
            }
          >
            <MenuItem value="">全部</MenuItem>
            <MenuItem value="configured">已設定</MenuItem>
            <MenuItem value="unconfigured">未設定</MenuItem>
          </Select>
        </FormControl>

        <Box
          sx={{
            display: "flex",
            gap: "8px",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gridColumn: {
              xs: "auto",
              sm: "1 / -1",
              md: "auto",
            },
            justifyContent: {
              sm: "flex-end",
              md: "stretch",
            },
            minWidth: 0,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            startIcon={<SearchIcon />}
            disabled={loading}
            sx={{
              flex: {
                xs: 1,
                sm: "0 0 112px",
                md: 1,
              },
              minWidth: 0,
              whiteSpace: "nowrap",
            }}
          >
            查詢
          </Button>

          <Button
            type="button"
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={loading}
            onClick={handleReset}
            sx={{
              flex: {
                xs: 1,
                sm: "0 0 112px",
                md: 1,
              },
              minWidth: 0,
              whiteSpace: "nowrap",
            }}
          >
            重設
          </Button>
        </Box>
      </Box>

      {!loading ? (
        <Typography
          sx={{
            mb: "10px",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          共 {pagination.total} 位員工
        </Typography>
      ) : null}

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: "56px",
          }}
        >
          <CircularProgress size={34} />
        </Box>
      ) : rows.length === 0 ? (
        <Alert severity="info">沒有符合條件的員工薪資保險資料。</Alert>
      ) : (
        <>
          <Box
            sx={{
              display: {
                xs: "grid",
                md: "none",
              },
              gap: "12px",
            }}
          >
            {rows.map((employee) => (
              <EmployeeMobileCard
                key={employee.employee_id}
                employee={employee}
                onManageSalaryData={handleManageSalaryData}
                onViewHistory={handleOpenHistory}
                onViewAdjustments={handleOpenAdjustments}
                managing={
                  Number(formLoadingEmployeeId) === Number(employee.employee_id)
                }
                salaryDataLocked={Boolean(
                  lockedSalaryEmployees[Number(employee.employee_id)],
                )}
              />
            ))}
          </Box>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              display: {
                xs: "none",
                md: "block",
              },
              borderColor: "#dfe4e8",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: "#f8fafc",
                  }}
                >
                  <TableCell sx={{ fontWeight: 700 }}>員工編號</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>員工姓名</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>員工狀態</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>薪資類型</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>薪資範圍</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>目前生效期間</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    薪資資料
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      width: "164px",
                      minWidth: "164px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((employee) => (
                  <TableRow
                    key={employee.employee_id}
                    hover
                    sx={{
                      "&:last-child td": {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <TableCell>{employee.employee_no || "--"}</TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: "#1f2937",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        {getEmployeeName(employee)}
                      </Typography>
                    </TableCell>

                    <TableCell>{employee.employee_status || "--"}</TableCell>

                    <TableCell>
                      {getSalaryTypeLabel(employee.salary_type)}
                    </TableCell>

                    <TableCell>
                      {employee.range_name || employee.range_code || "--"}
                    </TableCell>

                    <TableCell>{getEffectivePeriod(employee)}</TableCell>

                    <TableCell align="center">
                      <SalaryDataChip
                        hasSalaryData={Boolean(employee.has_salary_data)}
                      />
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{
                        width: "164px",
                        minWidth: "164px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <Tooltip
                          title={
                            lockedSalaryEmployees[Number(employee.employee_id)]
                              ? "此薪資資料已用於計薪，只能查看。薪資變更請使用「調薪異動」。"
                              : Number(formLoadingEmployeeId) ===
                                  Number(employee.employee_id)
                                ? "讀取中..."
                                : employee.has_salary_data
                                  ? "編輯"
                                  : "新增資料"
                          }
                          arrow
                        >
                          <span>
                            <IconButton
                              type="button"
                              aria-label={
                                lockedSalaryEmployees[
                                  Number(employee.employee_id)
                                ]
                                  ? "薪資資料唯讀"
                                  : employee.has_salary_data
                                    ? "編輯"
                                    : "新增資料"
                              }
                              disabled={
                                formLoadingEmployeeId !== null ||
                                Boolean(
                                  lockedSalaryEmployees[
                                    Number(employee.employee_id)
                                  ],
                                )
                              }
                              onClick={() => handleManageSalaryData(employee)}
                              sx={{
                                width: "40px",
                                height: "40px",
                                color: employee.has_salary_data
                                  ? "#1976d2"
                                  : "#ffffff",
                                bgcolor: employee.has_salary_data
                                  ? "#eff6ff"
                                  : "#1976d2",
                                border: "1px solid",
                                borderColor: "#93c5fd",
                                borderRadius: "6px",
                                "&:hover": {
                                  bgcolor: employee.has_salary_data
                                    ? "#dbeafe"
                                    : "#1565c0",
                                },
                                "&.Mui-disabled": {
                                  bgcolor: "#f1f5f9",
                                  borderColor: "#cbd5e1",
                                },
                              }}
                            >
                              {Number(formLoadingEmployeeId) ===
                              Number(employee.employee_id) ? (
                                <CircularProgress size={19} />
                              ) : lockedSalaryEmployees[
                                  Number(employee.employee_id)
                                ] ? (
                                <LockOutlinedIcon fontSize="small" />
                              ) : employee.has_salary_data ? (
                                <EditOutlinedIcon fontSize="small" />
                              ) : (
                                <AddIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="薪資歷程" arrow>
                          <span>
                            <Badge
                              badgeContent={Number(
                                employee.salary_record_count || 0,
                              )}
                              color="success"
                              invisible={
                                Number(employee.salary_record_count || 0) === 0
                              }
                              max={99}
                              sx={{
                                "& .MuiBadge-badge": {
                                  top: "2px",
                                  right: "2px",
                                  minWidth: "18px",
                                  height: "18px",
                                  px: "4px",
                                  borderRadius: "9px",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                },
                              }}
                            >
                              <IconButton
                                type="button"
                                aria-label="薪資歷程"
                                disabled={
                                  Number(employee.salary_record_count || 0) ===
                                  0
                                }
                                onClick={() => handleOpenHistory(employee)}
                                sx={{
                                  width: "40px",
                                  height: "40px",
                                  color: "#15803d",
                                  bgcolor: "#f0fdf4",
                                  border: "1px solid #86efac",
                                  borderRadius: "6px",
                                  "&:hover": {
                                    bgcolor: "#dcfce7",
                                  },
                                }}
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Badge>
                          </span>
                        </Tooltip>

                        <Tooltip title="調薪異動" arrow>
                          <IconButton
                            type="button"
                            aria-label="調薪異動"
                            onClick={() => handleOpenAdjustments(employee)}
                            sx={{
                              width: "40px",
                              height: "40px",
                              color: "#7c3aed",
                              bgcolor: "#f5f3ff",
                              border: "1px solid #c4b5fd",
                              borderRadius: "6px",
                              "&:hover": {
                                bgcolor: "#ede9fe",
                              },
                            }}
                          >
                            <PriceChangeOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {pagination.total_pages > 1 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: "20px",
              }}
            >
              <Pagination
                page={page}
                count={pagination.total_pages}
                onChange={(_event, nextPage) => setPage(nextPage)}
                disabled={loading}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          ) : null}
        </>
      )}

      <SalaryRecordFormDialog
        open={Boolean(formEmployee)}
        employee={formEmployee}
        record={formRecord}
        recordItems={formRecordItems}
        saving={formSaving}
        saveError={formSaveError}
        onSubmit={handleSaveSalaryData}
        onClose={handleCloseSalaryForm}
      />

      <SalaryHistoryDialog
        open={Boolean(historyEmployee)}
        employee={historyEmployee}
        records={historyRecords}
        loading={historyLoading}
        error={historyError}
        onClose={handleCloseHistory}
      />

      <EmployeeAdjustmentHistoryDialog
        open={Boolean(adjustmentEmployee)}
        employee={adjustmentEmployee}
        batches={adjustmentBatches}
        loading={adjustmentLoading}
        error={adjustmentError}
        onSelectBatch={handleOpenAdjustmentDetail}
        onClose={handleCloseAdjustments}
      />

      <PayrollAdjustmentHistoryDialog
        open={Boolean(selectedAdjustmentBatchId)}
        batchId={selectedAdjustmentBatchId}
        employeeId={adjustmentEmployee?.employee_id || null}
        onClose={handleCloseAdjustmentDetail}
      />
    </Box>
  );
}
