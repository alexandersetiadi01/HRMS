import { useEffect, useMemo, useState } from "react";
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
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import {
  createPayrollSalaryBank,
  deletePayrollSalaryBank,
  getPayrollSalaryBanks,
  updatePayrollSalaryBank,
} from "../../API/payroll";

const EMPTY_FORM = {
  bank_code: "",
  bank_name: "",
  transfer_file_type: "標準",
  account_length_check_enabled: false,
  account_length: "",
  branch_length_check_enabled: false,
  branch_length: "",
  status: "啟用",
};

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function toBoolean(value) {
  return value === true || value === 1 || value === "1";
}

function bankToForm(bank) {
  return {
    bank_code: String(bank?.bank_code || ""),
    bank_name: String(bank?.bank_name || ""),
    transfer_file_type: String(bank?.transfer_file_type || "標準"),
    account_length_check_enabled: toBoolean(bank?.account_length_check_enabled),
    account_length:
      bank?.account_length === null || bank?.account_length === undefined
        ? ""
        : String(bank.account_length),
    branch_length_check_enabled: toBoolean(bank?.branch_length_check_enabled),
    branch_length:
      bank?.branch_length === null || bank?.branch_length === undefined
        ? ""
        : String(bank.branch_length),
    status: String(bank?.status || "啟用"),
  };
}

function buildPayload(form) {
  return {
    bank_code: form.bank_code.trim(),
    bank_name: form.bank_name.trim(),
    transfer_file_type: form.transfer_file_type,
    account_length_check_enabled: form.account_length_check_enabled ? 1 : 0,
    account_length: form.account_length_check_enabled
      ? Number(form.account_length)
      : null,
    branch_length_check_enabled: form.branch_length_check_enabled ? 1 : 0,
    branch_length: form.branch_length_check_enabled
      ? Number(form.branch_length)
      : null,
    status: form.status,
  };
}

function StatusChip({ value }) {
  const enabled = value === "啟用";

  return (
    <Chip
      label={enabled ? "啟用" : "停用"}
      size="small"
      color={enabled ? "success" : "default"}
      variant="outlined"
    />
  );
}

function CheckStatus({ enabled, length }) {
  if (!toBoolean(enabled)) {
    return (
      <Typography
        component="span"
        sx={{
          color: "#64748b",
          fontSize: "13px",
        }}
      >
        不檢查
      </Typography>
    );
  }

  return (
    <Typography
      component="span"
      sx={{
        color: "#334155",
        fontSize: "13px",
      }}
    >
      檢查，共 {length || "-"} 碼
    </Typography>
  );
}

function InfoBlock({ label, children }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color: "#94a3b8",
          fontSize: "12px",
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          mt: "3px",
          color: "#334155",
          fontSize: "13px",
          overflowWrap: "anywhere",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel>{label}</InputLabel>

      <Select label={label} value={value} onChange={onChange}>
        {options.map((option) => (
          <MenuItem key={`${label}-${option}`} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function BankFormDialog({ open, bank, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(bank ? bankToForm(bank) : { ...EMPTY_FORM });
    setSubmitting(false);
    setError("");
  }, [open, bank]);

  function setField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!form.bank_code.trim() || !form.bank_name.trim()) {
      return "請填寫銀行代碼與銀行名稱。";
    }

    if (
      form.account_length_check_enabled &&
      (!Number.isInteger(Number(form.account_length)) ||
        Number(form.account_length) < 1 ||
        Number(form.account_length) > 100)
    ) {
      return "帳號長度必須為 1 至 100 的整數。";
    }

    if (
      form.branch_length_check_enabled &&
      (!Number.isInteger(Number(form.branch_length)) ||
        Number(form.branch_length) < 1 ||
        Number(form.branch_length) > 100)
    ) {
      return "分行代碼長度必須為 1 至 100 的整數。";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (bank?.salary_bank_id) {
        await updatePayrollSalaryBank(bank.salary_bank_id, buildPayload(form));
      } else {
        await createPayrollSalaryBank(buildPayload(form));
      }

      onSaved(bank ? "薪資帳戶銀行已更新。" : "薪資帳戶銀行已新增。");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          bank ? "更新薪資帳戶銀行失敗。" : "新增薪資帳戶銀行失敗。",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        {bank ? "編輯薪資帳戶銀行" : "新增薪資帳戶銀行"}
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: "16px",
          }}
        >
          {error ? (
            <Alert
              severity="error"
              sx={{
                gridColumn: "1 / -1",
              }}
            >
              {error}
            </Alert>
          ) : null}

          <TextField
            label="銀行代碼"
            size="small"
            required
            value={form.bank_code}
            onChange={(event) => setField("bank_code", event.target.value)}
            helperText="例如：004"
            inputProps={{
              maxLength: 20,
            }}
          />

          <TextField
            label="銀行名稱"
            size="small"
            required
            value={form.bank_name}
            onChange={(event) => setField("bank_name", event.target.value)}
          />

          <SelectField
            label="轉帳檔版本"
            value={form.transfer_file_type}
            onChange={(event) =>
              setField("transfer_file_type", event.target.value)
            }
            options={["標準", "客製"]}
          />

          <SelectField
            label="狀態"
            value={form.status}
            onChange={(event) => setField("status", event.target.value)}
            options={["啟用", "停用"]}
          />

          <Box
            sx={{
              gridColumn: "1 / -1",
              p: "14px",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={form.account_length_check_enabled}
                  onChange={(event) =>
                    setField(
                      "account_length_check_enabled",
                      event.target.checked,
                    )
                  }
                />
              }
              label="檢查銀行帳號長度"
              sx={{ m: 0 }}
            />

            {form.account_length_check_enabled ? (
              <TextField
                label="銀行帳號長度"
                type="number"
                size="small"
                required
                fullWidth
                value={form.account_length}
                onChange={(event) =>
                  setField("account_length", event.target.value)
                }
                inputProps={{
                  min: 1,
                  max: 100,
                  step: 1,
                }}
                helperText="允許範圍：1 至 100 碼"
                sx={{ mt: "12px" }}
              />
            ) : null}
          </Box>

          <Box
            sx={{
              gridColumn: "1 / -1",
              p: "14px",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={form.branch_length_check_enabled}
                  onChange={(event) =>
                    setField(
                      "branch_length_check_enabled",
                      event.target.checked,
                    )
                  }
                />
              }
              label="檢查分行代碼長度"
              sx={{ m: 0 }}
            />

            {form.branch_length_check_enabled ? (
              <TextField
                label="分行代碼長度"
                type="number"
                size="small"
                required
                fullWidth
                value={form.branch_length}
                onChange={(event) =>
                  setField("branch_length", event.target.value)
                }
                inputProps={{
                  min: 1,
                  max: 100,
                  step: 1,
                }}
                helperText="允許範圍：1 至 100 碼"
                sx={{ mt: "12px" }}
              />
            ) : null}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: "24px",
          py: "14px",
        }}
      >
        <Button onClick={onClose} disabled={submitting}>
          取消
        </Button>

        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? "儲存中…" : "儲存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BankMobileCard({ bank, onEdit, onDelete }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: "16px",
        borderColor: "#dfe4e8",
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
              fontSize: "16px",
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {bank.bank_name || "-"}
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: "#64748b",
              fontSize: "12px",
              wordBreak: "break-all",
            }}
          >
            銀行代碼：
            {bank.bank_code || "-"}
          </Typography>
        </Box>

        <StatusChip value={bank.status} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "14px 12px",
          mt: "16px",
        }}
      >
        <InfoBlock label="轉帳檔版本">
          {bank.transfer_file_type || "-"}
        </InfoBlock>

        <InfoBlock label="帳號長度">
          <CheckStatus
            enabled={bank.account_length_check_enabled}
            length={bank.account_length}
          />
        </InfoBlock>

        <InfoBlock label="分行代碼長度">
          <CheckStatus
            enabled={bank.branch_length_check_enabled}
            length={bank.branch_length}
          />
        </InfoBlock>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: "6px",
          mt: "14px",
        }}
      >
        <Button
          size="small"
          startIcon={<EditOutlinedIcon />}
          onClick={() => onEdit(bank)}
        >
          編輯
        </Button>

        <Button
          size="small"
          color="error"
          startIcon={<DeleteOutlineOutlinedIcon />}
          onClick={() => onDelete(bank)}
        >
          刪除／停用
        </Button>
      </Box>
    </Paper>
  );
}

export default function PayrollSalaryBanksPage() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");

  const [formOpen, setFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadBanks() {
    setLoading(true);
    setError("");

    try {
      const data = await getPayrollSalaryBanks();

      setBanks(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "讀取薪資帳戶銀行失敗。"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBanks();
  }, []);

  const filteredBanks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return banks.filter((bank) => {
      const matchesSearch =
        !keyword ||
        [bank.bank_code, bank.bank_name].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(keyword),
        );

      const matchesStatus =
        statusFilter === "全部" || bank.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [banks, search, statusFilter]);

  function openCreateDialog() {
    setEditingBank(null);
    setFormOpen(true);
  }

  function openEditDialog(bank) {
    setEditingBank(bank);
    setFormOpen(true);
  }

  async function handleSaved(successMessage) {
    setFormOpen(false);
    setEditingBank(null);
    setMessage(successMessage);

    await loadBanks();
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const result = await deletePayrollSalaryBank(deleteTarget.salary_bank_id);

      setDeleteTarget(null);

      setMessage(
        result?.message ||
          (result?.disabled
            ? "銀行已有員工薪資資料使用，已改為停用。"
            : "薪資帳戶銀行已刪除。"),
      );

      await loadBanks();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "刪除或停用薪資帳戶銀行失敗。"));
    } finally {
      setDeleting(false);
    }
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
      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "stretch",
            sm: "center",
          },
          justifyContent: "space-between",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: "12px",
          mb: "18px",
        }}
      >
        <Box>
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
            薪資帳戶銀行
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#7b8794",
              fontSize: "13px",
            }}
          >
            管理薪資轉帳可使用的銀行、轉帳檔版本及帳號檢查規則
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          新增銀行
        </Button>
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

      {message ? (
        <Alert
          severity="success"
          onClose={() => setMessage("")}
          sx={{ mb: "14px" }}
        >
          {message}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "minmax(0, 2fr) minmax(150px, 1fr)",
            md: "minmax(260px, 2fr) minmax(160px, 1fr) auto",
          },
          gap: "10px",
          mb: "16px",
        }}
      >
        <TextField
          size="small"
          label="搜尋銀行代碼或名稱"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          InputProps={{
            startAdornment: (
              <SearchIcon
                sx={{
                  mr: "8px",
                  color: "#94a3b8",
                }}
              />
            ),
          }}
        />

        <SelectField
          label="狀態"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={["全部", "啟用", "停用"]}
        />

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadBanks}
          disabled={loading}
          sx={{
            gridColumn: {
              xs: "auto",
              sm: "1 / -1",
              md: "auto",
            },
          }}
        >
          重新整理
        </Button>
      </Box>

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
      ) : filteredBanks.length === 0 ? (
        <Alert severity="info">沒有符合條件的薪資帳戶銀行。</Alert>
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
            {filteredBanks.map((bank) => (
              <BankMobileCard
                key={bank.salary_bank_id}
                bank={bank}
                onEdit={openEditDialog}
                onDelete={setDeleteTarget}
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
              width: "100%",
              maxWidth: "100%",
              overflowX: "hidden",
              borderColor: "#dfe4e8",
            }}
          >
            <Table
              size="small"
              sx={{
                width: "100%",
                tableLayout: "fixed",
                "& .MuiTableCell-root": {
                  px: {
                    md: "6px",
                    lg: "10px",
                  },
                  py: "10px",
                  fontSize: {
                    md: "12px",
                    lg: "14px",
                  },
                  overflowWrap: "anywhere",
                },
              }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 700 }}>銀行代碼</TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>銀行名稱</TableCell>

                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    轉帳檔版本
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>帳號長度</TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>分行代碼長度</TableCell>

                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    狀態
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredBanks.map((bank) => (
                  <TableRow key={bank.salary_bank_id} hover>
                    <TableCell>
                      <Typography
                        sx={{
                          color: "#1f2937",
                          fontSize: "14px",
                          fontWeight: 700,
                        }}
                      >
                        {bank.bank_code || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        maxWidth: "260px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {bank.bank_name || "-"}
                    </TableCell>

                    <TableCell align="center">
                      {bank.transfer_file_type || "-"}
                    </TableCell>

                    <TableCell>
                      <CheckStatus
                        enabled={bank.account_length_check_enabled}
                        length={bank.account_length}
                      />
                    </TableCell>

                    <TableCell>
                      <CheckStatus
                        enabled={bank.branch_length_check_enabled}
                        length={bank.branch_length}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <StatusChip value={bank.status} />
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="編輯">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(bank)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="刪除／停用">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(bank)}
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <BankFormDialog
        open={formOpen}
        bank={editingBank}
        onClose={() => {
          setFormOpen(false);
          setEditingBank(null);
        }}
        onSaved={handleSaved}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={deleting ? undefined : () => setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          刪除或停用銀行
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#475569",
              fontSize: "14px",
            }}
          >
            確定要處理「
            {deleteTarget?.bank_name}（{deleteTarget?.bank_code}
            ）」嗎？
          </Typography>

          <Alert severity="warning" sx={{ mt: "14px" }}>
            如果已有員工薪資資料使用此銀行，銀行不會被永久刪除，系統會將它改為停用。
          </Alert>
        </DialogContent>

        <DialogActions
          sx={{
            px: "24px",
            pb: "18px",
          }}
        >
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            取消
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "處理中…" : "確認處理"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
