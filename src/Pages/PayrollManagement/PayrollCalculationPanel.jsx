import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Typography,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import {
  approvePayrollRun,
  calculatePayrollRun,
  getPayrollRunResults,
} from "../../API/payroll";

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 0,
  }).format(Math.abs(Number(value || 0)));
}

function formatSignedNumber(value) {
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatHours(value) {
  return new Intl.NumberFormat("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(Number(value || 0)));
}

function formatDateTime(value) {
  if (!value) return "--";

  const normalized = String(value).replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getWithholdingMethodLabel(result) {
  const deductions = Array.isArray(result?.deductions)
    ? result.deductions
    : [];

  const withholdingLine = deductions.find(
    (line) =>
      String(line?.source_type || "") ===
      "tax_profile",
  );

  return (
    String(
      withholdingLine?.description || "",
    ).trim() || "依員工稅務設定"
  );
}

function getCalculationErrorEmployee(
  item,
  data,
) {
  const employeeId = Number(item?.employee_id || 0);

  const employees = [
    ...(Array.isArray(data?.results)
      ? data.results
      : []),
    ...(Array.isArray(data?.missing_employees)
      ? data.missing_employees
      : []),
  ];

  return employees.find(
    (employee) =>
      Number(employee?.employee_id || 0) ===
      employeeId,
  );
}

function getCalculationErrorAmounts(item) {
  const errorData =
    item?.data &&
    typeof item.data === "object" &&
    !Array.isArray(item.data)
      ? item.data
      : {};

  return [
    ["應發總額", errorData.gross_pay],
    ["扣款總額", errorData.total_deduction],
    ["實發金額", errorData.net_pay],
    ["應稅所得", errorData.taxable_income],
  ].filter(([, value]) => {
    return value !== undefined && value !== null;
  });
}

function CalculationErrorItem({
  item,
  data,
  index,
}) {
  const employee = getCalculationErrorEmployee(
    item,
    data,
  );

  const employeeName =
    employee?.display_name ||
    employee?.english_name ||
    `員工 #${item.employee_id || "--"}`;

  const amountItems =
    getCalculationErrorAmounts(item);

  return (
    <Box
      component="li"
      key={`${
        item.employee_id || "employee"
      }-${index}`}
      sx={{ mb: "8px" }}
    >
      <Typography
        sx={{
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        {employeeName}
        {employee?.employee_no
          ? `（${employee.employee_no}）`
          : ""}
      </Typography>

      <Typography
        sx={{
          mt: "2px",
          fontSize: "12px",
          lineHeight: 1.55,
        }}
      >
        {item.message || "計算失敗"}
      </Typography>

      {item.code ? (
        <Typography
          sx={{
            mt: "2px",
            color: "#7b8794",
            fontSize: "11px",
          }}
        >
          錯誤代碼：{item.code}
        </Typography>
      ) : null}

      {amountItems.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 12px",
            mt: "3px",
          }}
        >
          {amountItems.map(([label, value]) => (
            <Typography
              key={label}
              sx={{
                color: "#7b8794",
                fontSize: "11px",
              }}
            >
              {label}：NT${" "}
              {formatSignedNumber(value)}
            </Typography>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

function getAllowanceModeLabel(value) {
  if (value === "quarterly_138") {
    return "每月上限＋季度 138 小時";
  }

  if (value === "monthly") {
    return "每月上限";
  }

  return "依薪資項目設定";
}

function OvertimeConsumptionGroup({
  title,
  consumption,
}) {
  const entries = Object.entries(consumption || {});

  if (entries.length === 0) return null;

  return (
    <Box sx={{ mt: "12px" }}>
      <Typography
        sx={{
          mb: "7px",
          color: "#475569",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
          },
          gap: "8px",
        }}
      >
        {entries.map(([periodKey, usage]) => (
          <Box
            key={periodKey}
            sx={{
              p: "10px",
              bgcolor: "#ffffff",
              border: "1px solid #dbe7ef",
              borderRadius: "5px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <Typography
                sx={{
                  color: "#334155",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {periodKey}
              </Typography>

              <Typography
                sx={{
                  color: "#168dc5",
                  fontSize: "12px",
                  fontWeight: 700,
                  textAlign: "right",
                }}
              >
                剩餘{" "}
                {formatHours(
                  usage?.remaining_hours,
                )}{" "}
                小時
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "5px 10px",
                mt: "7px",
              }}
            >
              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: "11px",
                }}
              >
                上限{" "}
                {formatHours(
                  usage?.limit_hours,
                )}{" "}
                小時
              </Typography>

              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: "11px",
                }}
              >
                已使用{" "}
                {formatHours(
                  usage?.used_hours,
                )}{" "}
                小時
              </Typography>

              <Typography
                sx={{
                  color: "#15803d",
                  fontSize: "11px",
                }}
              >
                免稅{" "}
                {formatHours(
                  usage?.tax_free_hours,
                )}{" "}
                小時
              </Typography>

              <Typography
                sx={{
                  color: "#c2410c",
                  fontSize: "11px",
                }}
              >
                應稅{" "}
                {formatHours(
                  usage?.taxable_hours,
                )}{" "}
                小時
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function OvertimeAuditPanel({ audit }) {
  if (!audit) return null;

  return (
    <Box
      sx={{
        mb: "14px",
        p: {
          xs: "12px",
          sm: "14px",
        },
        borderRadius: "5px",
        bgcolor: audit.verified
          ? "#f2fbf5"
          : "#fff8f1",
        border: audit.verified
          ? "1px solid #cce8d5"
          : "1px solid #fed7aa",
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
        <Box>
          <Typography
            sx={{
              color: audit.verified
                ? "#15803d"
                : "#c2410c",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            加班免稅額度驗證
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#64748b",
              fontSize: "11px",
            }}
          >
            {getAllowanceModeLabel(
              audit.allowance_mode,
            )}
          </Typography>
        </Box>

        <Chip
          size="small"
          icon={
            audit.verified ? (
              <CheckCircleOutlineIcon />
            ) : undefined
          }
          label={
            audit.verified
              ? "驗證通過"
              : "驗證失敗"
          }
          sx={{
            bgcolor: audit.verified
              ? "#eaf8ef"
              : "#fff1e6",
            color: audit.verified
              ? "#15803d"
              : "#c2410c",
            border: audit.verified
              ? "1px solid #b9e5c8"
              : "1px solid #fed7aa",
            fontWeight: 700,
            "& .MuiChip-icon": {
              color: "inherit",
              fontSize: "16px",
            },
          }}
        />
      </Box>

      <OvertimeConsumptionGroup
        title="每月額度使用狀況"
        consumption={
          audit.monthly_consumption
        }
      />

      <OvertimeConsumptionGroup
        title="季度額度使用狀況"
        consumption={
          audit.quarterly_consumption
        }
      />
    </Box>
  );
}

function PayrollTotalCard({
  label,
  value,
  color,
  background,
  icon,
  preserveSign = false,
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: {
          xs: "13px",
          sm: "16px",
        },
        border: "1px solid #e5e7eb",
        borderRadius: "5px",
        bgcolor: background,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          mb: "6px",
          color,
        }}
      >
        {icon}

        <Typography
          sx={{
            color: "#64748b",
            fontSize: {
              xs: "12px",
              sm: "13px",
            },
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
      </Box>

      <Typography
        sx={{
          color,
          fontSize: {
            xs: "19px",
            sm: "24px",
          },
          fontWeight: 700,
          lineHeight: 1.2,
          overflowWrap: "anywhere",
        }}
      >
        NT${" "}
        {preserveSign
          ? formatSignedNumber(value)
          : formatNumber(value)}
      </Typography>
    </Box>
  );
}
function ResultLine({
  line,
  deduction = false,
}) {
  const itemName =
    line.description ||
    line.item_name ||
    line.item_name_en ||
    line.item_code ||
    "薪資項目";

  const taxableType = String(
    line.taxable_type_snapshot || "",
  ).trim();

  const isTaxFree = taxableType === "免稅";
  const isTaxable = taxableType === "應稅";

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr) auto",
          sm: "minmax(0, 1fr) 110px 120px",
        },
        alignItems: "center",
        gap: {
          xs: "8px",
          sm: "12px",
        },
        py: "9px",
        borderBottom: "1px solid #edf0f3",
        "&:last-child": {
          borderBottom: 0,
        },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "6px",
          }}
        >
          <Typography
            sx={{
              color: "#334155",
              fontSize: "13px",
              fontWeight: 600,
              overflowWrap: "anywhere",
            }}
          >
            {itemName}
          </Typography>

          {taxableType ? (
            <Chip
              size="small"
              label={taxableType}
              sx={{
                height: "20px",
                bgcolor: isTaxFree
                  ? "#eaf8ef"
                  : isTaxable
                    ? "#fff3e8"
                    : "#f1f5f9",
                color: isTaxFree
                  ? "#15803d"
                  : isTaxable
                    ? "#c2410c"
                    : "#64748b",
                border: isTaxFree
                  ? "1px solid #b9e5c8"
                  : isTaxable
                    ? "1px solid #fed7aa"
                    : "1px solid #dbe2ea",
                fontSize: "10px",
                fontWeight: 700,
                "& .MuiChip-label": {
                  px: "7px",
                },
              }}
            />
          ) : null}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 10px",
            mt: "3px",
          }}
        >
          {line.item_code ? (
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              {line.item_code}
            </Typography>
          ) : null}

          <Typography
            sx={{
              display: {
                xs: "block",
                sm: "none",
              },
              color: "#64748b",
              fontSize: "11px",
            }}
          >
            數量 {formatHours(line.quantity)}
            {line.unit === "hour" ? " 小時" : ""}
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{
          display: {
            xs: "none",
            sm: "block",
          },
          color: "#64748b",
          fontSize: "12px",
          textAlign: "right",
        }}
      >
        {formatHours(line.quantity)}
        {line.unit === "hour" ? " 小時" : ""}
      </Typography>

      <Typography
        sx={{
          color: deduction ? "#c62828" : "#15803d",
          fontSize: "13px",
          fontWeight: 700,
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {deduction ? "−" : "+"} NT${" "}
        {formatNumber(line.amount)}
      </Typography>
    </Box>
  );
}

function EmployeeResultCard({ result }) {
  const [expanded, setExpanded] = useState(false);

  const employeeName =
    result.display_name ||
    result.english_name ||
    `員工 #${result.employee_id}`;

  const earnings = Array.isArray(result.earnings)
    ? result.earnings
    : [];

  const deductions = Array.isArray(result.deductions)
    ? result.deductions
    : [];

  const overtimeLines = Array.isArray(
    result.overtime_lines,
  )
    ? result.overtime_lines
    : earnings.filter(
        (line) =>
          line.source_type === "overtime_request",
      );

  const regularEarnings = earnings.filter(
    (line) =>
      line.source_type !== "overtime_request",
  );

  const overtimeSummary =
    result.overtime_tax_summary || {};

  const overtimeAudit =
    result.overtime_tax_audit || null;

  const withholdingMethod =
    getWithholdingMethodLabel(result);

  return (
    <Box
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: "5px",
        bgcolor: "#ffffff",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: {
            xs: "13px",
            sm: "16px",
          },
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
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "#1f2937",
                fontSize: {
                  xs: "14px",
                  sm: "15px",
                },
                fontWeight: 700,
                overflowWrap: "anywhere",
              }}
            >
              {employeeName}
            </Typography>

            <Typography
              sx={{
                mt: "2px",
                color: "#7b8794",
                fontSize: "12px",
              }}
            >
              員工編號：{result.employee_no || "--"}
            </Typography>
          </Box>

          <Chip
            size="small"
            icon={<CheckCircleOutlineIcon />}
            label={result.status || "已計算"}
            sx={{
              flexShrink: 0,
              bgcolor:
                result.status === "已核准"
                  ? "#eaf8ef"
                  : "#edf8fd",
              color:
                result.status === "已核准"
                  ? "#15803d"
                  : "#168dc5",
              border:
                result.status === "已核准"
                  ? "1px solid #b9e5c8"
                  : "1px solid #b8def0",
              fontWeight: 700,
              "& .MuiChip-icon": {
                color: "inherit",
                fontSize: "16px",
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(4, minmax(0, 1fr))",
            },
            gap: "10px",
            mt: "14px",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              應發總額
            </Typography>

            <Typography
              sx={{
                mt: "3px",
                color: "#15803d",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              NT$ {formatNumber(result.gross_pay)}
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              扣款總額
            </Typography>

            <Typography
              sx={{
                mt: "3px",
                color: "#c62828",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              NT$ {formatNumber(result.total_deduction)}
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              實發金額
            </Typography>

            <Typography
              sx={{
                mt: "3px",
                color: "#168dc5",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              NT${" "}
              {formatSignedNumber(result.net_pay)}
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: "11px",
              }}
            >
              所得稅扣繳
            </Typography>

            <Typography
              sx={{
                mt: "3px",
                color: "#c2410c",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              NT${" "}
              {formatNumber(result.withholding_tax)}
            </Typography>

            <Typography
              sx={{
                mt: "2px",
                color: "#64748b",
                fontSize: "11px",
                lineHeight: 1.45,
                overflowWrap: "anywhere",
              }}
            >
              {withholdingMethod}
            </Typography>
          </Box>
        </Box>

        <Button
          size="small"
          onClick={() => setExpanded((value) => !value)}
          endIcon={
            expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
          }
          sx={{
            mt: "12px",
            px: 0,
            minWidth: 0,
            color: "#168dc5",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {expanded ? "收合薪資明細" : "查看薪資明細"}
        </Button>
      </Box>

      <Collapse in={expanded}>
        <Box
          sx={{
            px: {
              xs: "13px",
              sm: "16px",
            },
            pb: {
              xs: "13px",
              sm: "16px",
            },
          }}
        >
          <Divider sx={{ mb: "12px" }} />

          <OvertimeAuditPanel
            audit={overtimeAudit}
          />

          {overtimeLines.length > 0 ? (
            <Box
              sx={{
                mb: "14px",
                p: {
                  xs: "12px",
                  sm: "14px",
                },
                borderRadius: "5px",
                bgcolor: "#f8fbff",
                border: "1px solid #cfe4f2",
              }}
            >
              <Typography
                sx={{
                  color: "#168dc5",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                加班費所得稅判定
              </Typography>

              <Typography
                sx={{
                  mt: "3px",
                  color: "#64748b",
                  fontSize: "11px",
                }}
              >
                顯示本期加班費依設定規則拆分後的免稅及應稅結果。
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: "8px",
                  my: "12px",
                }}
              >
                <Box
                  sx={{
                    p: "10px",
                    bgcolor: "#ffffff",
                    border: "1px solid #dbe7ef",
                    borderRadius: "5px",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#94a3b8",
                      fontSize: "11px",
                    }}
                  >
                    加班總計
                  </Typography>

                  <Typography
                    sx={{
                      mt: "3px",
                      color: "#334155",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {formatHours(
                      overtimeSummary.total_hours,
                    )}{" "}
                    小時
                  </Typography>

                  <Typography
                    sx={{
                      mt: "2px",
                      color: "#334155",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    NT${" "}
                    {formatNumber(
                      overtimeSummary.total_amount,
                    )}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: "10px",
                    bgcolor: "#f2fbf5",
                    border: "1px solid #cce8d5",
                    borderRadius: "5px",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#15803d",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    免稅加班費
                  </Typography>

                  <Typography
                    sx={{
                      mt: "3px",
                      color: "#15803d",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {formatHours(
                      overtimeSummary.tax_free_hours,
                    )}{" "}
                    小時
                  </Typography>

                  <Typography
                    sx={{
                      mt: "2px",
                      color: "#15803d",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    NT${" "}
                    {formatNumber(
                      overtimeSummary.tax_free_amount,
                    )}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    gridColumn: {
                      xs: "1 / -1",
                      sm: "auto",
                    },
                    p: "10px",
                    bgcolor: "#fff8f1",
                    border: "1px solid #fed7aa",
                    borderRadius: "5px",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#c2410c",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    應稅加班費
                  </Typography>

                  <Typography
                    sx={{
                      mt: "3px",
                      color: "#c2410c",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {formatHours(
                      overtimeSummary.taxable_hours,
                    )}{" "}
                    小時
                  </Typography>

                  <Typography
                    sx={{
                      mt: "2px",
                      color: "#c2410c",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    NT${" "}
                    {formatNumber(
                      overtimeSummary.taxable_amount,
                    )}
                  </Typography>
                </Box>
              </Box>

              <Box>
                {overtimeLines.map((line) => (
                  <ResultLine
                    key={line.result_line_id}
                    line={line}
                  />
                ))}
              </Box>

              {Number(
                overtimeSummary.unclassified_hours ||
                  0,
              ) > 0 ? (
                <Alert
                  severity="warning"
                  sx={{ mt: "10px" }}
                >
                  有{" "}
                  {formatHours(
                    overtimeSummary
                      .unclassified_hours,
                  )}{" "}
                  小時未套用加班費所得稅類型，將保留薪資項目的原始所得稅設定。
                </Alert>
              ) : null}
            </Box>
          ) : null}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <Box
              sx={{
                p: "12px",
                borderRadius: "5px",
                bgcolor: "#f6fcf8",
                border: "1px solid #d8eee0",
              }}
            >
              <Typography
                sx={{
                  mb: "5px",
                  color: "#15803d",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                加項明細
              </Typography>

              {regularEarnings.length > 0 ? (
                regularEarnings.map((line) => (
                  <ResultLine
                    key={line.result_line_id}
                    line={line}
                  />
                ))
              ) : (
                <Typography
                  sx={{
                    py: "8px",
                    color: "#94a3b8",
                    fontSize: "12px",
                  }}
                >
                  沒有其他加項資料
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                p: "12px",
                borderRadius: "5px",
                bgcolor: "#fff8f8",
                border: "1px solid #f0d8d8",
              }}
            >
              <Typography
                sx={{
                  mb: "5px",
                  color: "#c62828",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                扣項明細
              </Typography>

              {deductions.length > 0 ? (
                deductions.map((line) => (
                  <ResultLine
                    key={line.result_line_id}
                    line={line}
                    deduction
                  />
                ))
              ) : (
                <Typography
                  sx={{
                    py: "8px",
                    color: "#94a3b8",
                    fontSize: "12px",
                  }}
                >
                  沒有扣項資料
                </Typography>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(4, minmax(0, 1fr))",
              },
              gap: "10px",
              mt: "12px",
              p: "12px",
              bgcolor: "#f8fafc",
              borderRadius: "5px",
            }}
          >
            <Box>
              <Typography
                sx={{ color: "#94a3b8", fontSize: "11px" }}
              >
                應稅所得
              </Typography>
              <Typography
                sx={{
                  mt: "3px",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                NT$ {formatNumber(result.taxable_income)}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{ color: "#94a3b8", fontSize: "11px" }}
              >
                扣繳稅額
              </Typography>
              <Typography
                sx={{
                  mt: "3px",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                NT$ {formatNumber(result.withholding_tax)}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{ color: "#94a3b8", fontSize: "11px" }}
              >
                員工保險費
              </Typography>
              <Typography
                sx={{
                  mt: "3px",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                NT${" "}
                {formatNumber(
                  result.employee_insurance_fee,
                )}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{ color: "#94a3b8", fontSize: "11px" }}
              >
                銀行轉帳
              </Typography>
              <Typography
                sx={{
                  mt: "3px",
                  color: "#168dc5",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                NT${" "}
                {formatSignedNumber(
                  result.bank_transfer_amount,
                )}
              </Typography>
            </Box>
          </Box>

          {result.approved_at ? (
            <Typography
              sx={{
                mt: "10px",
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              核准時間：{formatDateTime(result.approved_at)}
            </Typography>
          ) : null}
        </Box>
      </Collapse>
    </Box>
  );
}

export default function PayrollCalculationPanel({
  payrollRunId,
  onReload,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] =
    useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageSeverity, setMessageSeverity] =
    useState("success");
  const [calculationErrors, setCalculationErrors] =
    useState([]);

  const loadResults = useCallback(
    async (auditMap = {}) => {
    if (!payrollRunId) return;

    setLoading(true);
    setError("");

    try {
      const result = await getPayrollRunResults(
        payrollRunId,
      );

      setData({
        ...result,
        summary: result?.summary || {},
        missing_employees: Array.isArray(
          result?.missing_employees,
        )
          ? result.missing_employees
          : [],
        results: Array.isArray(result?.results)
          ? result.results.map(
              (employeeResult) => ({
                ...employeeResult,
                overtime_tax_audit:
                  auditMap[
                    String(
                      employeeResult.employee_id,
                    )
                  ] ||
                  employeeResult
                    .overtime_tax_audit ||
                  null,
              }),
            )
          : [],
      });
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          "無法載入薪資計算結果。",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [payrollRunId]);

  useEffect(() => {
    setData(null);
    setError("");
    setMessage("");
    setCalculationErrors([]);
    loadResults();
  }, [loadResults]);

  async function handleRecalculate() {
    const employeeIds = (data?.results || [])
      .map((item) => Number(item.employee_id))
      .filter((employeeId) => employeeId > 0);

    if (employeeIds.length === 0) {
      setError(
        "此薪資批次目前沒有可重新計算的已選員工。",
      );
      return;
    }

    const confirmed = window.confirm(
      `確定要重新計算此薪資批次嗎？系統將重新計算 ${employeeIds.length} 位已選員工，目前的計算結果將被更新。`,
    );

    if (!confirmed) return;

    setRecalculating(true);
    setError("");
    setMessage("");
    setCalculationErrors([]);

    try {
      const result = await calculatePayrollRun(
        payrollRunId,
        employeeIds,
      );

      const calculatedCount = Number(
        result?.calculated_count || 0,
      );
      const errors = Array.isArray(result?.errors)
        ? result.errors
        : [];

      const calculated = Array.isArray(
        result?.calculated,
      )
        ? result.calculated
        : [];

      const auditMap = Object.fromEntries([
        ...calculated
          .filter(
            (item) =>
              item?.overtime_tax_audit,
          )
          .map((item) => [
            String(item.employee_id),
            item.overtime_tax_audit,
          ]),
        ...errors
          .filter(
            (item) => item?.data?.audit,
          )
          .map((item) => [
            String(item.employee_id),
            item.data.audit,
          ]),
      ]);

      setCalculationErrors(errors);

      if (errors.length > 0) {
        setMessageSeverity("warning");
        setMessage(
          `已計算 ${calculatedCount} 位員工，但有 ${errors.length} 位員工計算失敗。批次將返回資料確認階段。`,
        );
      } else {
        setMessageSeverity("success");
        setMessage(
          `重新計算完成，共計算 ${calculatedCount} 位員工。`,
        );
      }

      await loadResults(auditMap);
      await onReload?.();
    } catch (recalculateError) {
      setError(
        getErrorMessage(
          recalculateError,
          "重新計算薪資失敗。",
        ),
      );
    } finally {
      setRecalculating(false);
    }
  }

  async function handleApprove() {
    const confirmed = window.confirm(
      "確定要核准此薪資批次嗎？核准後將無法重新計算。",
    );

    if (!confirmed) return;

    setApproving(true);
    setError("");
    setMessage("");

    try {
      const result = await approvePayrollRun(
        payrollRunId,
      );

      setMessageSeverity("success");
      setMessage(
        `薪資批次核准完成，共核准 ${
          Number(result?.approved_count || 0)
        } 位員工。`,
      );

      await onReload?.();
    } catch (approveError) {
      setError(
        getErrorMessage(
          approveError,
          "核准薪資批次失敗。",
        ),
      );
    } finally {
      setApproving(false);
    }
  }

  const summary = data?.summary || {};
  const results = data?.results || [];
  const missingEmployees =
    data?.missing_employees || [];

  const readyToApprove =
    summary.ready_to_approve === true ||
    Number(summary.ready_to_approve) === 1;

  const hasApprovedResults =
    Number(summary.approved_count || 0) > 0;

  return (
    <Box
      sx={{
        mt: "20px",
        pt: "18px",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <Typography
        sx={{
          mb: "14px",
          color: "#334155",
          fontSize: {
            xs: "15px",
            sm: "16px",
          },
          fontWeight: 700,
        }}
      >
        薪資計算結果
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: "14px" }}>
          {error}
        </Alert>
      ) : null}

      {message ? (
        <Alert
          severity={messageSeverity}
          sx={{ mb: "14px" }}
        >
          {message}
        </Alert>
      ) : null}

      {calculationErrors.length > 0 ? (
        <Alert
          severity="warning"
          sx={{ mb: "14px" }}
        >
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            薪資計算失敗明細
          </Typography>

          <Box
            component="ul"
            sx={{
              my: "6px",
              pl: "20px",
            }}
          >
            {calculationErrors.map(
              (item, index) => (
                <CalculationErrorItem
                  key={`${
                    item.employee_id ||
                    "employee"
                  }-${index}`}
                  item={item}
                  data={data}
                  index={index}
                />
              ),
            )}
          </Box>
        </Alert>
      ) : null}

      {loading ? (
        <Box
          sx={{
            minHeight: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={30} />
        </Box>
      ) : data ? (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, minmax(0, 1fr))",
              },
              gap: "10px",
            }}
          >
            <PayrollTotalCard
              label="應發總額"
              value={summary.gross_pay_total}
              color="#15803d"
              background="#f2fbf5"
              icon={
                <PaymentsOutlinedIcon fontSize="small" />
              }
            />

            <PayrollTotalCard
              label="扣款總額"
              value={summary.deduction_total}
              color="#c62828"
              background="#fff7f7"
              icon={
                <AccountBalanceWalletOutlinedIcon fontSize="small" />
              }
            />

            <PayrollTotalCard
              label="實發總額"
              value={summary.net_pay_total}
              color="#168dc5"
              background="#f2fbff"
              icon={<TaskAltIcon fontSize="small" />}
              preserveSign
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              mt: "12px",
            }}
          >
            <Chip
              size="small"
              label={`應計算 ${summary.expected_count || 0} 人`}
            />

            <Chip
              size="small"
              label={`已產生 ${summary.result_count || 0} 人`}
            />

            <Chip
              size="small"
              label={`已計算 ${summary.calculated_count || 0} 人`}
              sx={{
                bgcolor: "#edf8fd",
                color: "#168dc5",
              }}
            />

            <Chip
              size="small"
              label={`已核准 ${summary.approved_count || 0} 人`}
              sx={{
                bgcolor: "#eaf8ef",
                color: "#15803d",
              }}
            />

            {calculationErrors.length > 0 ? (
              <Chip
                size="small"
                label={`計算失敗 ${calculationErrors.length} 人`}
                sx={{
                  bgcolor: "#feecec",
                  color: "#c62828",
                }}
              />
            ) : null}
          </Box>

          {missingEmployees.length > 0 ? (
            <Alert severity="error" sx={{ mt: "14px" }}>
              <Typography
                sx={{
                  mb: "5px",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                有 {missingEmployees.length} 位員工尚未產生薪資結果：
              </Typography>

              {missingEmployees.map((employee) => (
                <Typography
                  key={employee.employee_id}
                  sx={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  •{" "}
                  {employee.display_name ||
                    employee.english_name ||
                    `員工 #${employee.employee_id}`}
                  {employee.employee_no
                    ? `（${employee.employee_no}）`
                    : ""}
                </Typography>
              ))}
            </Alert>
          ) : readyToApprove ? (
            <Alert severity="success" sx={{ mt: "14px" }}>
              所有員工的薪資結果均已完成，可以核准此薪資批次。
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mt: "14px" }}>
              薪資結果尚未符合核准條件，請重新確認計算結果。
            </Alert>
          )}

          <Divider sx={{ my: "16px" }} />

          <Typography
            sx={{
              mb: "10px",
              color: "#334155",
              fontSize: {
                xs: "14px",
                sm: "15px",
              },
              fontWeight: 700,
            }}
          >
            員工薪資結果
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: "10px",
            }}
          >
            {results.map((result) => (
              <EmployeeResultCard
                key={result.payroll_result_id}
                result={result}
              />
            ))}
          </Box>

          {results.length === 0 ? (
            <Alert severity="warning">
              此薪資批次目前沒有計算結果。
            </Alert>
          ) : null}

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              gap: "8px",
              mt: "16px",
            }}
          >
            <Button
              variant="outlined"
              startIcon={
                recalculating ? (
                  <CircularProgress
                    size={17}
                    color="inherit"
                  />
                ) : (
                  <RefreshIcon />
                )
              }
              onClick={handleRecalculate}
              disabled={
                hasApprovedResults ||
                recalculating ||
                approving
              }
              title={
                hasApprovedResults
                  ? "此薪資批次已有核准結果，無法重新計算"
                  : undefined
              }
              sx={{
                color: "#475569",
                borderColor: "#cbd5e1",
              }}
            >
              {recalculating
                ? "重新計算中..."
                : "重新計算"}
            </Button>

            <Button
              variant="contained"
              startIcon={
                approving ? (
                  <CircularProgress
                    size={17}
                    color="inherit"
                  />
                ) : (
                  <TaskAltIcon />
                )
              }
              onClick={handleApprove}
              disabled={
                !readyToApprove ||
                recalculating ||
                approving
              }
              sx={{
                bgcolor: "#1f9bd1",
                "&:hover": {
                  bgcolor: "#168dc5",
                },
              }}
            >
              {approving ? "核准中..." : "核准薪資結果"}
            </Button>
          </Box>
        </>
      ) : null}
    </Box>
  );
}