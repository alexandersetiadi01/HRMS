import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
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
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../Utils/Breadcrumb";
import { getMyPayslipDetail, getMyPayslips } from "../../API/payroll";
import PayrollPasswordDialog, {
  PAYROLL_VERIFICATION_STORAGE_KEY,
} from "./PayrollPasswordDialog";
import useNotifications from "../../Contexts/UseNotification";
import useNotificationHighlight from "../../Utils/Notifications/UseNotificationHighlight";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}

export default function PayrollPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(
    theme.breakpoints.down("md"),
  );

  const navigate = useNavigate();

  const {
    isSourceUnread,
    markSourceAsRead,
  } = useNotifications();

  const {
    highlightedId: highlightedPayrollId,
  } = useNotificationHighlight();

  const [payrollList, setPayrollList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showSnackbar = (severity, message) => {
    setSnackbar({
      open: true,
      severity,
      message,
    });
  };

  const fetchPayrollList = async () => {
    setLoading(true);

    try {
      const rows = await getMyPayslips();
      setPayrollList(Array.isArray(rows) ? rows : []);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.data?.message ||
        "讀取薪資單失敗，請稍後再試。";

      showSnackbar("error", message);
      setPayrollList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollList();
  }, []);

  const handleOpenPasswordDialog = (payrollId) => {
    setSelectedPayrollId(payrollId);
    setOpenPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setSelectedPayrollId("");
  };

  const handlePasswordVerified = async (token) => {
    if (!selectedPayrollId) {
      throw new Error("找不到要查看的薪資單。");
    }

    const detail = await getMyPayslipDetail(selectedPayrollId, token);

    if (!detail || !detail.payroll_result_id) {
      throw new Error("薪資單明細資料格式不正確，請聯絡管理人員確認後端資料。");
    }

    sessionStorage.setItem(
      PAYROLL_VERIFICATION_STORAGE_KEY,
      token,
    );

    try {
      await markSourceAsRead(
        "payroll_result",
        selectedPayrollId,
      );
    } catch {
      /*
       * The payroll detail must still open if notification
       * synchronization temporarily fails.
       */
    }

    navigate(`/payroll/${selectedPayrollId}`, {
      state: {
        payrollVerificationToken: token,
        payrollDetail: detail,
      },
    });
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={2} align="center" sx={{ py: "30px" }}>
            <CircularProgress size={24} />
            <Typography sx={{ mt: "10px", fontSize: "14px", color: "#6b7280" }}>
              薪資單讀取中...
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    if (payrollList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={2} align="center" sx={{ py: "30px" }}>
            <Typography sx={{ fontSize: "15px", color: "#6b7280" }}>
              目前沒有可查看的薪資單。
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    return payrollList.map((item) => {
      const payrollId = Number(
        item.payroll_result_id || 0,
      );

      const isUnread = isSourceUnread(
        "payroll_result",
        payrollId,
      );

      const isHighlighted = (
        payrollId > 0
        && payrollId === highlightedPayrollId
      );

      return (
        <TableRow
          key={item.payroll_result_id}
          hover={!isMobile}
          onClick={() => {
            handleOpenPasswordDialog(
              item.payroll_result_id,
            );
          }}
          sx={{
            cursor: "pointer",
            transition: "background-color 0.2s ease",
            bgcolor: isHighlighted
              ? "#fff7cc"
              : "transparent",
            "&:hover": {
              bgcolor: isHighlighted
                ? "#fff1a8"
                : isMobile
                  ? "transparent"
                  : "#eaf4fb",
            },
          }}
        >
          <TableCell
            sx={{
              minWidth: 0,
              px: isMobile ? "8px" : "10px",
              py: isMobile ? "12px" : "16px",
              fontSize: isMobile ? "15px" : "16px",
              color: isMobile
                ? "#0c93d4"
                : "#1f2937",
              fontWeight: isMobile ? 700 : 400,
              wordBreak: "break-word",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isUnread ? (
                <Box
                  component="span"
                  aria-label="未讀薪資單"
                  sx={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    bgcolor: "#ef4444",
                    flexShrink: 0,
                  }}
                />
              ) : null}

              <Box component="span">
                {item.title || (
                  `${item.year}/`
                  + `${String(item.month).padStart(2, "0")}`
                  + " 薪資單"
                )}
              </Box>
            </Box>
          </TableCell>

          <TableCell
            sx={{
              px: isMobile ? "8px" : "10px",
              py: isMobile ? "12px" : "16px",
              fontSize: isMobile ? "15px" : "16px",
              color: "#1f2937",
              whiteSpace: "nowrap",
            }}
          >
            {formatDate(item.pay_date)}
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Box>
      <Breadcrumb
        currentLabel="我的薪資單"
        rootLabel="Payroll"
        rootTo="/payroll"
      />

      {!isMobile && (
        <Box
          sx={{
            borderTop: "1px solid #d1d5db",
            pt: "16px",
          }}
        >
          <Box
            sx={{
              bgcolor: "#1f86cc",
              color: "#ffffff",
              px: "18px",
              py: "10px",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            我的薪資單
          </Box>
        </Box>
      )}

      {isMobile ? (
        <Box>
          <Typography
            sx={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#1f2937",
              mb: "14px",
            }}
          >
            我的薪資單
          </Typography>

          <Table
            sx={{
              tableLayout: "fixed",
              "& .MuiTableCell-root": {
                borderBottom: "1px solid #cfcfcf",
                px: "8px",
                py: "12px",
              },
            }}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: "#d1d1d1" }}>
                <TableCell
                  sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}
                >
                  項目
                </TableCell>
                <TableCell
                  sx={{
                    width: "118px",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  入帳日
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>{renderTableBody()}</TableBody>
          </Table>
        </Box>
      ) : (
        <Table
          sx={{
            "& .MuiTableCell-root": {
              borderBottom: "1px solid #cfcfcf",
              px: "10px",
            },
          }}
        >
          <TableHead>
            <TableRow sx={{ bgcolor: "#d1d1d1" }}>
              <TableCell
                sx={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}
              >
                項目
              </TableCell>
              <TableCell
                align="left"
                sx={{
                  width: "260px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                入帳日
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>{renderTableBody()}</TableBody>
        </Table>
      )}

      <PayrollPasswordDialog
        open={openPasswordDialog}
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