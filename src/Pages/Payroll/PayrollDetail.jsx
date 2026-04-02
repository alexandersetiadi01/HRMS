import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../../Utils/Breadcrumb";
import { formatMoney, getPayrollById } from "./PayrollMockData";

function SectionFrame({ title, children, sx = {} }) {
  return (
    <Box
      sx={{
        border: "1px solid #d1d5db",
        bgcolor: "#ffffff",
        position: "relative",
        px: { xs: "14px", md: "24px" },
        py: { xs: "28px", md: "30px" },
        ...sx,
      }}
    >
      <Typography
        sx={{
          position: "absolute",
          top: "-12px",
          left: "14px",
          px: "12px",
          bgcolor: "#1f86cc",
          fontSize: "16px",
          color: "#ffffff",
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function KeyValueRows({ rows, compact = false }) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: compact ? "420px" : "420px",
        mx: "auto",
        display: "grid",
        rowGap: "14px",
      }}
    >
      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{
            display: "grid",
            gridTemplateColumns: "120px minmax(0, 1fr)",
            columnGap: "12px",
            alignItems: "start",
          }}
        >
          <Typography
            sx={{
              fontSize: "16px",
              color: "#111827",
              textAlign: "right",
              whiteSpace: "nowrap",
            }}
          >
            {row.label}：
          </Typography>

          <Typography
            sx={{
              fontSize: "16px",
              color: "#111827",
              wordBreak: "break-word",
            }}
          >
            {row.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function PayrollAmountSection({
  title,
  items,
  totalLabel,
  totalValue,
  isMobile,
}) {
  return (
    <SectionFrame title={title}>
      {isMobile ? (
        <Box sx={{ display: "grid", gap: "18px" }}>
          <KeyValueRows
            compact
            rows={items.map((item) => ({
              label: item.label,
              value: formatMoney(item.amount),
            }))}
          />

          <Box
            sx={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              columnGap: "16px",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: "16px",
                color: "#000000",
                textAlign: "right",
              }}
            >
              {totalLabel}：
            </Typography>
            <Typography sx={{ fontSize: "16px", color: "#111827" }}>
              {formatMoney(totalValue)}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: title === "應扣項目" ? "180px" : "140px",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              width: "420px",
              ml: "auto",
              mr: "auto",
            }}
          >
            <KeyValueRows
              compact
              rows={items.map((item) => ({
                label: item.label,
                value: formatMoney(item.amount),
              }))}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Box
              sx={{
                width: "220px",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                columnGap: "16px",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: "16px",
                  color: "#000000",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {totalLabel}：
              </Typography>
              <Typography sx={{ fontSize: "16px", color: "#111827" }}>
                {formatMoney(totalValue)}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </SectionFrame>
  );
}
export default function PayrollDetail() {
  const { payrollId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const payroll = getPayrollById(payrollId);

  if (!payroll) {
    return <Navigate to="/payroll" replace />;
  }

  const earningTotal = payroll.earnings.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const deductionTotal = payroll.deductions.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return (
    <Box>
      <Breadcrumb
        currentLabel={payroll.title}
        rootLabel="Payroll"
        rootTo="/payroll"
      />

      <Box
        sx={{
          bgcolor: "#1f86cc",
          color: "#ffffff",
          px: "18px",
          py: "10px",
          fontSize: "18px",
          fontWeight: 700,
          mb: "18px",
        }}
      >
        薪資單
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          mb: "20px",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          sx={{
            borderColor: "#bdbdbd",
            color: "#4b5563",
            bgcolor: "#ffffff",
            px: "14px",
            py: "6px",
            fontSize: "15px",
          }}
        >
          下載出勤明細
        </Button>

        <Button
          variant="outlined"
          sx={{
            borderColor: "#bdbdbd",
            color: "#4b5563",
            bgcolor: "#ffffff",
            px: "14px",
            py: "6px",
            fontSize: "15px",
          }}
        >
          下載薪資單
        </Button>
      </Box>

      <Box sx={{ display: "grid", gap: "22px" }}>
        <SectionFrame title="員工資料">
          <KeyValueRows
            rows={[
              { label: "年度", value: payroll.year },
              { label: "月份/名稱", value: payroll.periodName },
              { label: "單位", value: payroll.department },
              { label: "工號/姓名", value: payroll.employeeCodeName },
              { label: "入帳日", value: payroll.depositDate },
              { label: "匯入帳號", value: payroll.payrollAccount },
            ]}
          />
        </SectionFrame>

        <PayrollAmountSection
          title="應發項目"
          items={payroll.earnings}
          totalLabel="應發合計"
          totalValue={earningTotal}
          isMobile={isMobile}
        />

        <PayrollAmountSection
          title="應扣項目"
          items={payroll.deductions}
          totalLabel="應扣合計"
          totalValue={deductionTotal}
          isMobile={isMobile}
        />

        <Box
          sx={{
            bgcolor: "#dcebf6",
            border: "1px solid #c5d7e6",
            px: { xs: "14px", md: "24px" },
            py: { xs: "16px", md: "22px" },
          }}
        >
          <Box
            sx={{
              ml: "auto",
              width: isMobile ? "100%" : "280px",
              display: "grid",
              rowGap: "12px",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                columnGap: "16px",
              }}
            >
              <Typography
                sx={{ fontSize: "16px", color: "#111827", textAlign: "right" }}
              >
                實發金額：
              </Typography>
              <Typography sx={{ fontSize: "16px", color: "#111827" }}>
                {formatMoney(payroll.summary.actualPaid)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                columnGap: "16px",
              }}
            >
              <Typography
                sx={{ fontSize: "16px", color: "#111827", textAlign: "right" }}
              >
                應稅金額：
              </Typography>
              <Typography sx={{ fontSize: "16px", color: "#111827" }}>
                {formatMoney(payroll.summary.taxableTotal)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                columnGap: "16px",
              }}
            >
              <Typography
                sx={{ fontSize: "16px", color: "#111827", textAlign: "right" }}
              >
                年度應稅總計：
              </Typography>
              <Typography sx={{ fontSize: "16px", color: "#111827" }}>
                {formatMoney(payroll.summary.yearlyTaxableTotal)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <SectionFrame title="備註">
          <Box sx={{ px: { xs: 0, md: "10px" } }}>
            {payroll.noteLines.map((line, index) => (
              <Typography
                key={`${line}-${index}`}
                sx={{
                  fontSize: "16px",
                  color: "#111827",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {line}
              </Typography>
            ))}
          </Box>
        </SectionFrame>

        <SectionFrame title="剩餘假別/時數">
          <Box
            onClick={() => navigate("/attendance/leave-balance")}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "4px",
              color: "#0c93d4",
              mb: "12px",
              cursor: "pointer",
              "&:hover": {
                opacity: 0.8,
              },
            }}
          >
            <SearchIcon sx={{ fontSize: "20px" }} />
            <Typography sx={{ fontSize: "15px", color: "#0c93d4" }}>
              剩餘假別
            </Typography>
          </Box>

          {isMobile ? (
            <Box sx={{ display: "grid", gap: "12px" }}>
              {payroll.leaveBalanceRows.map((row) => (
                <Paper
                  key={row.leaveType}
                  elevation={0}
                  sx={{
                    border: "1px solid #d1d5db",
                    borderRadius: 0,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "#d1d1d1",
                      px: "14px",
                      py: "10px",
                      fontWeight: 700,
                    }}
                  >
                    {row.leaveType}
                  </Box>
                  <Box
                    sx={{
                      px: "14px",
                      py: "12px",
                      display: "grid",
                      rowGap: "8px",
                    }}
                  >
                    <Typography sx={{ fontSize: "15px" }}>
                      可用：{row.available}
                    </Typography>
                    <Typography sx={{ fontSize: "15px" }}>
                      已用：{row.used}
                    </Typography>
                    <Typography sx={{ fontSize: "15px" }}>
                      剩餘：{row.remaining}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Table
              sx={{
                "& .MuiTableCell-root": {
                  borderBottom: "1px solid #cfcfcf",
                  px: "18px",
                },
              }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: "#d1d1d1" }}>
                  <TableCell sx={{ fontSize: "16px", fontWeight: 700 }}>
                    假別
                  </TableCell>
                  <TableCell sx={{ fontSize: "16px", fontWeight: 700 }}>
                    可用
                  </TableCell>
                  <TableCell sx={{ fontSize: "16px", fontWeight: 700 }}>
                    已用
                  </TableCell>
                  <TableCell sx={{ fontSize: "16px", fontWeight: 700 }}>
                    剩餘
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {payroll.leaveBalanceRows.map((row) => (
                  <TableRow key={row.leaveType}>
                    <TableCell sx={{ fontSize: "16px" }}>
                      {row.leaveType}
                    </TableCell>
                    <TableCell sx={{ fontSize: "16px" }}>
                      {row.available}
                    </TableCell>
                    <TableCell sx={{ fontSize: "16px" }}>{row.used}</TableCell>
                    <TableCell sx={{ fontSize: "16px" }}>
                      {row.remaining}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Typography
            sx={{
              mt: "12px",
              fontSize: "15px",
              color: "#111827",
              lineHeight: 1.7,
            }}
          >
            {payroll.leaveBalanceNote}
          </Typography>
        </SectionFrame>
      </Box>
    </Box>
  );
}
