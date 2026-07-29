import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getSalaryAdjustmentHistoryDetail } from "../../API/payroll";

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatDate(value) {
  if (!value) {
    return "--";
  }

  return String(value)
    .slice(0, 10)
    .replaceAll("-", "/");
}

function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  return String(value)
    .replace("T", " ")
    .slice(0, 16)
    .replaceAll("-", "/");
}

function formatMoney(value) {
  return new Intl.NumberFormat("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getPersonLabel(person) {
  const employeeNo = String(
    person?.employee_no || "",
  ).trim();

  const employeeName = String(
    person?.employee_name ||
      person?.english_name ||
      "",
  ).trim();

  if (employeeNo && employeeName) {
    return `${employeeNo}／${employeeName}`;
  }

  return employeeNo || employeeName || "--";
}

function getEmployeeLabel(employee) {
  const employeeNo = String(
    employee?.employee_no || "",
  ).trim();

  const employeeName = String(
    employee?.employee_name ||
      employee?.english_name ||
      "",
  ).trim();

  if (employeeNo && employeeName) {
    return `${employeeNo}／${employeeName}`;
  }

  return (
    employeeNo ||
    employeeName ||
    `員工 #${employee?.employee_id || "--"}`
  );
}

function DetailField({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color: "#7b8794",
          fontSize: "11px",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: "3px",
          color: "#1f2937",
          fontSize: "14px",
          fontWeight: 700,
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
        }}
      >
        {value || "--"}
      </Typography>
    </Box>
  );
}

function AmountChange({ difference }) {
  const amount = Number(difference || 0);

  const color =
    amount > 0
      ? "#15803d"
      : amount < 0
        ? "#b91c1c"
        : "#64748b";

  return (
    <Typography
      component="span"
      sx={{
        color,
        fontSize: "13px",
        fontWeight: 700,
      }}
    >
      {amount > 0 ? "+" : ""}
      {formatMoney(amount)}
    </Typography>
  );
}

function ChangeTypeChip({ value }) {
  const color =
    value === "新增"
      ? "success"
      : value === "移除"
        ? "error"
        : "primary";

  return (
    <Chip
      label={value || "修改"}
      size="small"
      color={color}
      variant="outlined"
      sx={{ fontWeight: 700 }}
    />
  );
}

function ItemMobileCard({ item }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: "12px",
        borderColor: "#e2e8f0",
        borderRadius: "5px",
        boxShadow: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#1f2937",
              fontSize: "14px",
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {item.item_name ||
              item.item_code ||
              "--"}
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: "#64748b",
              fontSize: "11px",
            }}
          >
            {item.item_code || "--"}
          </Typography>
        </Box>

        <ChangeTypeChip
          value={item.change_type}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "8px",
          mt: "12px",
          p: "10px",
          borderRadius: "5px",
          bgcolor: "#f8fafc",
        }}
      >
        <DetailField
          label="調整前"
          value={formatMoney(
            item.old_amount,
          )}
        />

        <DetailField
          label="調整後"
          value={formatMoney(
            item.new_amount,
          )}
        />

        <Box>
          <Typography
            sx={{
              color: "#7b8794",
              fontSize: "11px",
            }}
          >
            差額
          </Typography>

          <Box sx={{ mt: "3px" }}>
            <AmountChange
              difference={item.difference}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

function ChangedItems({ items }) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return (
      <Alert
        severity="info"
        sx={{ mt: "12px" }}
      >
        此員工沒有薪資科目異動明細。
      </Alert>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: {
            xs: "grid",
            md: "none",
          },
          gap: "10px",
          mt: "12px",
        }}
      >
        {items.map((item) => (
          <ItemMobileCard
            key={
              item.salary_adjustment_item_id ||
              `${item.payroll_item_id}-${item.item_code}`
            }
            item={item}
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
          mt: "12px",
          borderColor: "#e2e8f0",
          boxShadow: "none",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{ bgcolor: "#f8fafc" }}
            >
              <TableCell
                sx={{ fontWeight: 700 }}
              >
                薪資科目
              </TableCell>

              <TableCell
                sx={{ fontWeight: 700 }}
              >
                科目代碼
              </TableCell>

              <TableCell
                align="right"
                sx={{ fontWeight: 700 }}
              >
                調整前
              </TableCell>

              <TableCell
                align="right"
                sx={{ fontWeight: 700 }}
              >
                調整後
              </TableCell>

              <TableCell
                align="right"
                sx={{ fontWeight: 700 }}
              >
                差額
              </TableCell>

              <TableCell
                align="center"
                sx={{ fontWeight: 700 }}
              >
                類型
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((item) => (
              <TableRow
                key={
                  item.salary_adjustment_item_id ||
                  `${item.payroll_item_id}-${item.item_code}`
                }
              >
                <TableCell>
                  {item.item_name ||
                    item.item_name_en ||
                    "--"}
                </TableCell>

                <TableCell>
                  {item.item_code || "--"}
                </TableCell>

                <TableCell align="right">
                  {formatMoney(
                    item.old_amount,
                  )}
                </TableCell>

                <TableCell align="right">
                  {formatMoney(
                    item.new_amount,
                  )}
                </TableCell>

                <TableCell align="right">
                  <AmountChange
                    difference={
                      item.difference
                    }
                  />
                </TableCell>

                <TableCell align="center">
                  <ChangeTypeChip
                    value={item.change_type}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function EmployeeAdjustment({
  employee,
  defaultExpanded,
}) {
  const itemCount = Array.isArray(
    employee.items,
  )
    ? employee.items.length
    : 0;

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      sx={{
        border: "1px solid #dfe4e8",
        borderRadius: "5px !important",
        boxShadow: "none",
        "&::before": {
          display: "none",
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: {
            xs: "12px",
            sm: "16px",
          },
          bgcolor: "#f8fafc",
          borderRadius: "5px",
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            justifyContent:
              "space-between",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: "8px",
            pr: "8px",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "#1f2937",
                fontSize: "14px",
                fontWeight: 700,
                overflowWrap:
                  "anywhere",
              }}
            >
              {getEmployeeLabel(
                employee,
              )}
            </Typography>

            <Typography
              sx={{
                mt: "2px",
                color: "#64748b",
                fontSize: "11px",
              }}
            >
              {itemCount} 個異動科目
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AmountChange
              difference={
                employee.difference
              }
            />

            <Chip
              label={
                employee.status || "--"
              }
              size="small"
              color={
                employee.status ===
                "已套用"
                  ? "success"
                  : "default"
              }
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          p: {
            xs: "12px",
            sm: "16px",
          },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs:
                "repeat(2, minmax(0, 1fr))",
              md:
                "repeat(4, minmax(0, 1fr))",
            },
            gap: "12px",
            p: "12px",
            borderRadius: "5px",
            bgcolor: "#f8fafc",
          }}
        >
          <DetailField
            label="調整前總額"
            value={formatMoney(
              employee.old_salary_total,
            )}
          />

          <DetailField
            label="調整後總額"
            value={formatMoney(
              employee.new_salary_total,
            )}
          />

          <Box>
            <Typography
              sx={{
                color: "#7b8794",
                fontSize: "11px",
              }}
            >
              總差額
            </Typography>

            <Box sx={{ mt: "3px" }}>
              <AmountChange
                difference={
                  employee.difference
                }
              />
            </Box>
          </Box>

          <DetailField
            label="異動科目"
            value={`${itemCount} 個`}
          />

          <DetailField
            label="原薪資紀錄"
            value={`#${
              employee
                .previous_salary_record
                ?.salary_record_id ||
              "--"
            }・${formatDate(
              employee
                .previous_salary_record
                ?.effective_from,
            )} 至 ${formatDate(
              employee
                .previous_salary_record
                ?.effective_to,
            )}`}
          />

          <DetailField
            label="新薪資紀錄"
            value={`#${
              employee
                .new_salary_record
                ?.salary_record_id ||
              "--"
            }・${formatDate(
              employee
                .new_salary_record
                ?.effective_from,
            )} 起`}
          />
        </Box>

        {employee.remarks ? (
          <Box
            sx={{
              mt: "12px",
              p: "12px",
              border:
                "1px solid #e2e8f0",
              borderRadius: "5px",
            }}
          >
            <DetailField
              label="員工備註"
              value={employee.remarks}
            />
          </Box>
        ) : null}

        {employee.error_message ? (
          <Alert
            severity="error"
            sx={{ mt: "12px" }}
          >
            {employee.error_message}
          </Alert>
        ) : null}

        <Typography
          sx={{
            mt: "16px",
            color: "#334155",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          薪資科目異動
        </Typography>

        <ChangedItems
          items={employee.items}
        />
      </AccordionDetails>
    </Accordion>
  );
}

export default function PayrollAdjustmentHistoryDialog({
  open,
  batchId,
  onClose,
}) {
  const theme = useTheme();

  const fullScreen = useMediaQuery(
    theme.breakpoints.down("sm"),
  );

  const [detail, setDetail] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    if (!open || !batchId) {
      setDetail(null);
      setError("");
      setLoading(false);

      return () => {
        active = false;
      };
    }

    async function loadDetail() {
      setLoading(true);
      setError("");
      setDetail(null);

      try {
        const result =
          await getSalaryAdjustmentHistoryDetail(
            batchId,
          );

        if (active) {
          setDetail(result);
        }
      } catch (requestError) {
        if (active) {
          setError(
            getErrorMessage(
              requestError,
              "無法讀取薪資異動批次明細。",
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [batchId, open]);

  const batch =
    detail?.batch || null;

  const employees = Array.isArray(
    detail?.employees,
  )
    ? detail.employees
    : [];

  return (
    <Dialog
      open={open}
      onClose={
        loading ? undefined : onClose
      }
      fullWidth
      fullScreen={fullScreen}
      maxWidth="lg"
      slotProps={{
        paper: {
          sx: {
            borderRadius: {
              xs: 0,
              sm: "6px",
            },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent:
            "space-between",
          gap: "12px",
          py: "14px",
          pr: "10px",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="div"
            sx={{
              color: "#111827",
              fontSize: {
                xs: "17px",
                sm: "19px",
              },
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            薪資異動批次明細
          </Typography>

          <Typography
            component="div"
            sx={{
              mt: "2px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            {batch?.batch_code ||
              "載入中"}
          </Typography>
        </Box>

        <IconButton
          aria-label="關閉"
          onClick={onClose}
          disabled={loading}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          p: {
            xs: "14px",
            sm: "18px",
          },
          bgcolor: "#ffffff",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: "72px",
            }}
          >
            <CircularProgress size={36} />
          </Box>
        ) : error ? (
          <Alert severity="error">
            {error}
          </Alert>
        ) : !batch ? (
          <Alert severity="info">
            找不到薪資異動批次明細。
          </Alert>
        ) : (
          <>
            <Paper
              variant="outlined"
              sx={{
                p: {
                  xs: "13px",
                  sm: "16px",
                },
                borderColor: "#dfe4e8",
                borderRadius: "5px",
                boxShadow: "none",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems:
                    "flex-start",
                  justifyContent:
                    "space-between",
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
                        xs: "16px",
                        sm: "18px",
                      },
                      fontWeight: 700,
                    }}
                  >
                    {batch.batch_code ||
                      "--"}
                  </Typography>

                  <Typography
                    sx={{
                      mt: "2px",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    生效日：
                    {formatDate(
                      batch.effective_date,
                    )}
                  </Typography>
                </Box>

                <Chip
                  label={
                    batch.status || "--"
                  }
                  size="small"
                  color={
                    batch.status ===
                    "已套用"
                      ? "success"
                      : "default"
                  }
                  sx={{ fontWeight: 700 }}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs:
                      "repeat(2, minmax(0, 1fr))",
                    md:
                      "repeat(4, minmax(0, 1fr))",
                  },
                  gap: "14px",
                  mt: "15px",
                  p: "12px",
                  borderRadius: "5px",
                  bgcolor: "#f8fafc",
                }}
              >
                <DetailField
                  label="員工人數"
                  value={`${Number(
                    batch.employee_count ||
                      0,
                  )} 位`}
                />

                <DetailField
                  label="變更科目"
                  value={`${Number(
                    batch.changed_item_count ||
                      0,
                  )} 個`}
                />

                <DetailField
                  label="建立人員"
                  value={getPersonLabel(
                    batch.created_by,
                  )}
                />

                <DetailField
                  label="套用人員"
                  value={getPersonLabel(
                    batch.applied_by,
                  )}
                />

                <DetailField
                  label="建立時間"
                  value={formatDateTime(
                    batch.created_at,
                  )}
                />

                <DetailField
                  label="套用時間"
                  value={formatDateTime(
                    batch.applied_at,
                  )}
                />

                <DetailField
                  label="來源"
                  value={
                    batch.source_file_name
                      ? `${
                          batch.source_type ||
                          "--"
                        }／${
                          batch.source_file_name
                        }`
                      : batch.source_type ||
                        "--"
                  }
                />

                <DetailField
                  label="最後更新"
                  value={formatDateTime(
                    batch.updated_at,
                  )}
                />
              </Box>

              {batch.remarks ? (
                <Box
                  sx={{
                    mt: "14px",
                    pt: "14px",
                    borderTop:
                      "1px solid #edf0f3",
                  }}
                >
                  <DetailField
                    label="批次備註"
                    value={batch.remarks}
                  />
                </Box>
              ) : null}
            </Paper>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "10px",
                mt: "18px",
                mb: "10px",
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
                員工異動明細
              </Typography>

              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                共 {employees.length} 位
              </Typography>
            </Box>

            {employees.length === 0 ? (
              <Alert severity="info">
                此批次沒有員工異動明細。
              </Alert>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: "10px",
                }}
              >
                {employees.map(
                  (
                    employee,
                    index,
                  ) => (
                    <EmployeeAdjustment
                      key={
                        employee.salary_adjustment_employee_id ||
                        employee.employee_id
                      }
                      employee={
                        employee
                      }
                      defaultExpanded={
                        index === 0
                      }
                    />
                  ),
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: {
            xs: "14px",
            sm: "18px",
          },
          py: "12px",
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}