import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
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
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../../Utils/Breadcrumb";
import {
  downloadMyPayslipAttendance,
  downloadMyPayslipExcel,
  getMyPayslipDetail,
} from "../../API/payroll";
import PayrollPasswordDialog, {
  PAYROLL_VERIFICATION_STORAGE_KEY,
} from "./PayrollPasswordDialog";

function formatMoney(value) {
  const number = Number(value || 0);

  return number.toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}

function formatLineName(line) {
  const name = String(line?.item_name || line?.label || "").trim();
  const description = String(line?.description || "").trim();

  if (description && description !== name) return `${name}（${description}）`;

  return name || description || "-";
}

function formatEmployeeCodeName(employee) {
  const employeeNo = String(employee?.employee_no || "").trim();
  const displayName = String(employee?.display_name || "").trim();

  if (employeeNo && displayName) return `${employeeNo}/${displayName}`;

  return employeeNo || displayName || "-";
}

function buildNoteLines(notes) {
  const commonNotes = Array.isArray(notes?.common) ? notes.common : [];
  const personalNotes = Array.isArray(notes?.personal) ? notes.personal : [];
  const lines = [];

  commonNotes.forEach((note) => {
    const content = String(note?.note_content || "").trim();
    if (content) lines.push(content);
  });

  personalNotes.forEach((note) => {
    const content = String(note?.note_content || "").trim();
    if (content) lines.push(content);
  });

  return lines.length > 0 ? lines : ["無"];
}

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
            {row.value || "-"}
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
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <SectionFrame title={title}>
      {safeItems.length === 0 ? (
        <Typography sx={{ fontSize: "16px", color: "#6b7280" }}>
          無資料
        </Typography>
      ) : isMobile ? (
        <Box sx={{ display: "grid", gap: "18px" }}>
          <KeyValueRows
            compact
            rows={safeItems.map((item, index) => ({
              label: formatLineName(item) || `項目 ${index + 1}`,
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
              sx={{ fontSize: "16px", color: "#000000", textAlign: "right" }}
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
          <Box sx={{ width: "420px", ml: "auto", mr: "auto" }}>
            <KeyValueRows
              compact
              rows={safeItems.map((item, index) => ({
                label: formatLineName(item) || `項目 ${index + 1}`,
                value: formatMoney(item.amount),
              }))}
            />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [payroll, setPayroll] = useState(location.state?.payrollDetail || null);
  const [loading, setLoading] = useState(!location.state?.payrollDetail);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState("view");
  const [downloading, setDownloading] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showSnackbar = (severity, message) => {
    setSnackbar({ open: true, severity, message });
  };

  const getStoredVerificationToken = useCallback(() => {
    return (
      location.state?.payrollVerificationToken ||
      sessionStorage.getItem(PAYROLL_VERIFICATION_STORAGE_KEY) ||
      ""
    );
  }, [location.state?.payrollVerificationToken]);

  const fetchPayrollDetail = useCallback(
    async (token) => {
      if (!payrollId || !token) {
        setLoading(false);
        setPasswordAction("view");
        setPasswordDialogOpen(true);
        return;
      }

      setLoading(true);

      try {
        const detail = await getMyPayslipDetail(payrollId, token);

        if (!detail || !detail.payroll_result_id) {
          setPayroll(null);
          setPasswordAction("view");
          setPasswordDialogOpen(true);
          return;
        }

        setPayroll(detail);
      } catch (error) {
        const status = error?.response?.status;

        if (status === 401 || status === 403) {
          sessionStorage.removeItem(PAYROLL_VERIFICATION_STORAGE_KEY);
          setPasswordAction("view");
          setPasswordDialogOpen(true);
          return;
        }

        const message =
          error?.response?.data?.message ||
          error?.response?.data?.data?.message ||
          "讀取薪資單失敗，請稍後再試。";

        showSnackbar("error", message);
      } finally {
        setLoading(false);
      }
    },
    [payrollId],
  );

  useEffect(() => {
    if (location.state?.payrollDetail) {
      return;
    }

    fetchPayrollDetail(getStoredVerificationToken());
  }, [fetchPayrollDetail, getStoredVerificationToken, location.state?.payrollDetail]);

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);

    if (!payroll && passwordAction === "view") {
      navigate("/payroll");
    }
  };

  const handlePasswordVerified = async (token) => {
    if (passwordAction === "attendance") {
      await downloadMyPayslipAttendance(payrollId, token);
      showSnackbar("success", "出勤明細下載完成。");
      return;
    }

    if (passwordAction === "payslip") {
      await downloadMyPayslipExcel(payrollId, token);
      showSnackbar("success", "薪資單下載完成。");
      return;
    }

    const detail = await getMyPayslipDetail(payrollId, token);

    if (!detail || !detail.payroll_result_id) {
      throw new Error("薪資單明細資料格式不正確，請聯絡管理人員確認後端資料。");
    }

    setPayroll(detail);
  };

  const requirePasswordForAction = (action) => {
    setPasswordAction(action);
    setPasswordDialogOpen(true);
  };

  const handleDownloadAttendance = async () => {
    requirePasswordForAction("attendance");
  };

  const handleDownloadPayslip = async () => {
    requirePasswordForAction("payslip");
  };

  const noteLines = useMemo(() => buildNoteLines(payroll?.notes), [payroll]);

  if (loading) {
    return (
      <Box>
        <Breadcrumb currentLabel="薪資單" rootLabel="Payroll" rootTo="/payroll" />

        <Box
          sx={{
            minHeight: "260px",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress size={28} />
            <Typography sx={{ mt: "12px", fontSize: "15px", color: "#6b7280" }}>
              薪資單讀取中...
            </Typography>
          </Box>
        </Box>

        <PayrollPasswordDialog
          open={passwordDialogOpen}
          onClose={handleClosePasswordDialog}
          onVerified={handlePasswordVerified}
        />
      </Box>
    );
  }

  if (!payroll) {
    return (
      <Box>
        <Breadcrumb currentLabel="薪資單" rootLabel="Payroll" rootTo="/payroll" />

        <Alert severity="warning" sx={{ mb: "16px" }}>
          尚未完成薪資單驗證，或找不到可查看的薪資單。
        </Alert>

        <Button
          variant="contained"
          onClick={() => requirePasswordForAction("view")}
          sx={{
            bgcolor: "#1f86cc",
            "&:hover": { bgcolor: "#1976b8" },
          }}
        >
          重新驗證
        </Button>

        <PayrollPasswordDialog
          open={passwordDialogOpen}
          onClose={handleClosePasswordDialog}
          onVerified={handlePasswordVerified}
        />
      </Box>
    );
  }

  const employee = payroll.employee || {};
  const summary = payroll.summary || {};
  const earningTotal = Number(summary.gross_pay || 0);
  const deductionTotal = Number(summary.total_deduction || 0);

  return (
    <Box>
      <Breadcrumb
        currentLabel={payroll.title || "薪資單"}
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
          onClick={handleDownloadAttendance}
          disabled={downloading === "attendance"}
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
          {downloading === "attendance" ? "下載中..." : "下載出勤明細"}
        </Button>

        <Button
          onClick={handleDownloadPayslip}
          disabled={downloading === "payslip"}
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
          {downloading === "payslip" ? "下載中..." : "下載薪資單"}
        </Button>
      </Box>

      <Box sx={{ display: "grid", gap: "22px" }}>
        <SectionFrame title="員工資料">
          <KeyValueRows
            rows={[
              { label: "年度", value: payroll.year },
              { label: "月份/名稱", value: payroll.run_name || payroll.title },
              { label: "單位", value: employee.unit_name },
              { label: "工號/姓名", value: formatEmployeeCodeName(employee) },
              { label: "入帳日", value: formatDate(payroll.pay_date) },
              { label: "匯入帳號", value: employee.bank_account_no },
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
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", columnGap: "16px" }}>
              <Typography sx={{ fontSize: "16px", color: "#111827", textAlign: "right" }}>
                實發金額：
              </Typography>
              <Typography sx={{ fontSize: "16px", color: "#111827" }}>
                {formatMoney(summary.net_pay)}
              </Typography>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", columnGap: "16px" }}>
              <Typography sx={{ fontSize: "16px", color: "#111827", textAlign: "right" }}>
                應稅金額：
              </Typography>
              <Typography sx={{ fontSize: "16px", color: "#111827" }}>
                {formatMoney(summary.taxable_income)}
              </Typography>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", columnGap: "16px" }}>
              <Typography sx={{ fontSize: "16px", color: "#111827", textAlign: "right" }}>
                年度應稅總計：
              </Typography>
              <Typography sx={{ fontSize: "16px", color: "#111827" }}>
                {formatMoney(summary.yearly_taxable_income || summary.taxable_income)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <SectionFrame title="備註">
          <Box sx={{ px: { xs: 0, md: "10px" } }}>
            {noteLines.map((line, index) => (
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
              "&:hover": { opacity: 0.8 },
            }}
          >
            <SearchIcon sx={{ fontSize: "20px" }} />
            <Typography sx={{ fontSize: "15px", color: "#0c93d4" }}>
              剩餘假別
            </Typography>
          </Box>

          {isMobile ? (
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #d1d5db",
                borderRadius: 0,
                overflow: "hidden",
              }}
            >
              <Box sx={{ bgcolor: "#d1d1d1", px: "14px", py: "10px", fontWeight: 700 }}>
                提醒
              </Box>
              <Box sx={{ px: "14px", py: "12px" }}>
                <Typography sx={{ fontSize: "15px", lineHeight: 1.7 }}>
                  剩餘假別/時數請以請假模組中的最新資料為準。
                </Typography>
              </Box>
            </Paper>
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
                    說明
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: "16px" }}>
                    剩餘假別/時數請以請假模組中的最新資料為準。
                  </TableCell>
                </TableRow>
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
            若薪資單顯示剩餘假別，後續可再接入後端薪資單假別快照資料。
          </Typography>
        </SectionFrame>
      </Box>

      <PayrollPasswordDialog
        open={passwordDialogOpen}
        onClose={handleClosePasswordDialog}
        onVerified={handlePasswordVerified}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}