import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../Utils/Breadcrumb";
import { payrollList } from "./PayrollMockData";

function PasswordConfirmDialog({
  open,
  onClose,
  password,
  onPasswordChange,
  onConfirm,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "404px",
          maxWidth: "95vw",
          borderRadius: "6px",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          height: "36px",
          px: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#1f86cc",
          color: "#ffffff",
        }}
      >
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          請再次輸入密碼
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            p: 0,
            color: "#ffffff",
          }}
        >
          <CloseIcon sx={{ fontSize: "18px" }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: "30px",
          pt: "26px",
          pb: "10px",
          bgcolor: "#ffffff",
        }}
      >
        <Typography
          sx={{
            fontSize: "14px",
            color: "#4b5563",
            lineHeight: 1.7,
            mb: "18px",
          }}
        >
          為了保障資料隱私安全，輸入密碼時，請留意身旁是否有人或監視器。
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "72px minmax(0, 1fr)",
            columnGap: "10px",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: "14px",
              color: "#374151",
              whiteSpace: "nowrap",
            }}
          >
            輸入密碼
          </Typography>

          <TextField
            type="password"
            value={password}
            onChange={onPasswordChange}
            placeholder="請輸入您的密碼"
            fullWidth
            sx={{
              "& .MuiInputBase-root": {
                height: "32px",
                fontSize: "14px",
                bgcolor: "#ffffff",
              },
              "& .MuiOutlinedInput-input": {
                px: "10px",
                py: "6px",
              },
            }}
          />
        </Box>

        <Box
          sx={{
            mt: "18px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Link
            component="button"
            type="button"
            underline="none"
            sx={{
              fontSize: "14px",
              color: "#1f86cc",
              cursor: "pointer",
            }}
          >
            忘記HR系統密碼
          </Link>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: "12px",
          py: "8px",
          bgcolor: "#ffffff",
          borderTop: "1px solid #d1d5db",
          justifyContent: "flex-end",
          gap: "2px",
        }}
      >
        <Button
          onClick={onConfirm}
          variant="outlined"
          sx={{
            minWidth: "52px",
            height: "34px",
            fontSize: "14px",
            color: "#fff",
            border: "none",
            bgcolor: "#1f86cc",
          }}
        >
          確定
        </Button>

        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            minWidth: "52px",
            height: "34px",
            fontSize: "14px",
            color: "#ffffff",
            border: "none",
            bgcolor: "#ff0000",
          }}
        >
          取消
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PayrollPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState("");
  const [password, setPassword] = useState("");

  const handleOpenPasswordDialog = (payrollId) => {
    setSelectedPayrollId(payrollId);
    setPassword("");
    setOpenPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setSelectedPayrollId("");
    setPassword("");
  };

  const handleConfirmPassword = () => {
    if (!selectedPayrollId) return;
    navigate(`/payroll/${selectedPayrollId}`);
    handleClosePasswordDialog();
  };

  return (
    <Box>
      <Breadcrumb currentLabel="我的薪資單" rootLabel="Payroll" rootTo="/payroll" />

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
                <TableCell sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
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

            <TableBody>
              {payrollList.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={() => handleOpenPasswordDialog(item.id)}
                  sx={{
                    cursor: "pointer",
                  }}
                >
                  <TableCell sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        display: "block",
                        fontSize: "15px",
                        color: "#0c93d4",
                        fontWeight: 700,
                        wordBreak: "break-word",
                      }}
                    >
                      {item.title}
                    </Typography>
                  </TableCell>

                  <TableCell
                    sx={{
                      fontSize: "15px",
                      color: "#111827",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.depositDate}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
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
              <TableCell sx={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                項目
              </TableCell>
              <TableCell
                align="left"
                sx={{ width: "260px", fontSize: "16px", fontWeight: 700, color: "#111827" }}
              >
                入帳日
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {payrollList.map((item) => (
              <TableRow
                key={item.id}
                hover
                onClick={() => handleOpenPasswordDialog(item.id)}
                sx={{
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                  "&:hover": {
                    bgcolor: "#eaf4fb",
                  },
                }}
              >
                <TableCell
                  sx={{
                    px: "10px",
                    py: "16px",
                    fontSize: "16px",
                    color: "#1f2937",
                  }}
                >
                  {item.title}
                </TableCell>

                <TableCell
                  sx={{
                    px: "10px",
                    py: "16px",
                    fontSize: "16px",
                    color: "#1f2937",
                  }}
                >
                  {item.depositDate}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <PasswordConfirmDialog
        open={openPasswordDialog}
        onClose={handleClosePasswordDialog}
        password={password}
        onPasswordChange={(event) => setPassword(event.target.value)}
        onConfirm={handleConfirmPassword}
      />
    </Box>
  );
}