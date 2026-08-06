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
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  deletePayrollTaxDependent,
  deletePayrollTaxProfile,
  getPayrollEmployees,
  getPayrollTaxDependents,
  getPayrollTaxProfiles,
} from "../../API/payroll";

import EmployeeTaxDependentFormDialog from "./EmployeeTaxDependentFormDialog";
import EmployeeTaxProfileFormDialog from "./EmployeeTaxProfileFormDialog";

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

function normalizeDate(value) {
  if (!value || value === "0000-00-00") {
    return "";
  }

  return String(value).slice(0, 10);
}

function formatEffectivePeriod(record) {
  return `${formatDate(record?.effective_from)} ～ ${formatDate(
    record?.effective_to,
  )}`;
}

function getCertificateTypeLabel(value) {
  const labels = {
    0: "0｜本國個人",
    3: "3｜境內住滿 183 天之外僑或大陸居民",
    5: "5｜境內未住滿 183 天之大陸地區人民",
    7: "7｜境內未住滿 183 天之外僑",
  };

  return labels[String(value || "")] || value || "--";
}

function getWithholdingMethodLabel(value) {
  const labels = {
    依照所得稅額表扣繳:
      "依照所得稅額表扣繳",

    不扣繳:
      "不扣繳（舊版）",

    依年度參數:
      "依年度參數（舊版固定稅率）",

    固定稅率:
      "固定稅率（舊版）",

    手動金額:
      "手動金額（舊版）",
  };

  return labels[value] || value || "--";
}

function getWithholdingDetail(record) {
  if (
    record?.withholding_method ===
    "依照所得稅額表扣繳"
  ) {
    return "依級距自動計算";
  }

  if (record?.withholding_method === "固定稅率") {
    const rate = Number(record?.withholding_rate);

    return Number.isFinite(rate) ? `${rate}%` : "--";
  }

  if (record?.withholding_method === "手動金額") {
    const amount = Number(record?.fixed_tax_amount);

    return Number.isFinite(amount)
      ? `NT$ ${new Intl.NumberFormat("zh-TW").format(amount)}`
      : "--";
  }

  return "--";
}

function formatBoolean(value) {
  return value === true || Number(value || 0) === 1 ? "是" : "否";
}

function DetailField({
  label,
  value,
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: "14px",
        border: "1px solid #e5e7eb",
        borderRadius: "5px",
      }}
    >
      <Typography
        sx={{
          color: "#64748b",
          fontSize: "12px",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: "5px",
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

function sortTaxProfiles(records) {
  return [...records].sort((left, right) => {
    const dateComparison = normalizeDate(right?.effective_from).localeCompare(
      normalizeDate(left?.effective_from),
    );

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return (
      Number(right?.tax_profile_id || 0) - Number(left?.tax_profile_id || 0)
    );
  });
}

function findCurrentTaxProfile(records) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    sortTaxProfiles(
      records.filter((record) => {
        const effectiveFrom = normalizeDate(record?.effective_from);

        const effectiveTo = normalizeDate(record?.effective_to);

        return (
          record?.status === "啟用" &&
          (!effectiveFrom || effectiveFrom <= today) &&
          (!effectiveTo || effectiveTo >= today)
        );
      }),
    )[0] || null
  );
}

function sortTaxDependents(records) {
  return [...records].sort((left, right) => {
    const dateComparison = normalizeDate(right?.effective_from).localeCompare(
      normalizeDate(left?.effective_from),
    );

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return (
      Number(right?.tax_dependent_id || 0) -
      Number(left?.tax_dependent_id || 0)
    );
  });
}

export default function PayrollEmployeeTaxDataPage() {
  const [employees, setEmployees] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [taxProfiles, setTaxProfiles] = useState([]);

  const [taxDependents, setTaxDependents] = useState([]);

  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const [loadingDependents, setLoadingDependents] = useState(false);

  const [error, setError] = useState("");

  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const [editingRecord, setEditingRecord] = useState(null);

  const [viewingRecord, setViewingRecord] = useState(null);

  const [dependentDialogOpen, setDependentDialogOpen] = useState(false);

  const [editingDependent, setEditingDependent] = useState(null);

  const [deletingDependent, setDeletingDependent] = useState(null);

  const [deletingDependentLoading, setDeletingDependentLoading] =
    useState(false);

  const [retiringRecord, setRetiringRecord] = useState(null);

  const [retiring, setRetiring] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

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
          setEmployees([]);
          setSelectedEmployee(null);

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

  const loadProfiles = useCallback(async () => {
    const employeeId = Number(selectedEmployee?.employee_id || 0);

    if (!employeeId) {
      setTaxProfiles([]);
      return;
    }

    setLoadingProfiles(true);
    setError("");

    try {
      const result = await getPayrollTaxProfiles({
        employee_id: employeeId,
      });

      setTaxProfiles(sortTaxProfiles(Array.isArray(result) ? result : []));
    } catch (requestError) {
      setTaxProfiles([]);

      setError(getErrorMessage(requestError, "無法載入員工所得稅資料。"));
    } finally {
      setLoadingProfiles(false);
    }
  }, [selectedEmployee]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const loadDependents = useCallback(async () => {
    const employeeId = Number(selectedEmployee?.employee_id || 0);

    if (!employeeId) {
      setTaxDependents([]);
      return;
    }

    setLoadingDependents(true);
    setError("");

    try {
      const result = await getPayrollTaxDependents({
        employee_id: employeeId,
      });

      setTaxDependents(
        sortTaxDependents(Array.isArray(result) ? result : []),
      );
    } catch (requestError) {
      setTaxDependents([]);

      setError(getErrorMessage(requestError, "無法載入扶養親屬資料。"));
    } finally {
      setLoadingDependents(false);
    }
  }, [selectedEmployee]);

  useEffect(() => {
    loadDependents();
  }, [loadDependents]);

  const currentTaxProfile = useMemo(
    () => findCurrentTaxProfile(taxProfiles),
    [taxProfiles],
  );

  function handleOpenCreate() {
    if (!selectedEmployee) {
      setError("請先選擇員工。");

      return;
    }

    setEditingRecord(null);
    setFormDialogOpen(true);
  }

  function handleOpenView(record) {
    setViewingRecord(record);
  }

  function handleCloseView() {
    setViewingRecord(null);
  }

  function handleOpenEdit(record) {
    setEditingRecord(record);
    setFormDialogOpen(true);
  }

  function handleCloseDialog() {
    setFormDialogOpen(false);
    setEditingRecord(null);
  }

  async function handleSaved() {
    handleCloseDialog();
    await loadProfiles();
  }

  function handleOpenRetire(record) {
    setRetiringRecord(record);
    setError("");
    setSuccessMessage("");
  }

  function handleCloseRetire() {
    if (retiring) {
      return;
    }

    setRetiringRecord(null);
  }

  async function handleConfirmRetire() {
    const taxProfileId = Number(retiringRecord?.tax_profile_id || 0);

    if (!taxProfileId) {
      setError("所得稅資料 ID 不正確。");

      setRetiringRecord(null);
      return;
    }

    setRetiring(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await deletePayrollTaxProfile(taxProfileId);

      setSuccessMessage(result?.message || "員工所得稅資料已停用。");

      setRetiringRecord(null);

      await loadProfiles();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "停用員工所得稅資料失敗。"));
    } finally {
      setRetiring(false);
    }
  }

  function handleOpenCreateDependent() {
    if (!selectedEmployee) {
      setError("請先選擇員工。");
      return;
    }

    if (!currentTaxProfile) {
      setError("此員工尚未建立目前有效的所得稅主檔。");
      return;
    }

    setEditingDependent(null);
    setDependentDialogOpen(true);
    setError("");
    setSuccessMessage("");
  }

  function handleOpenEditDependent(record) {
    setEditingDependent(record);
    setDependentDialogOpen(true);
    setError("");
    setSuccessMessage("");
  }

  function handleCloseDependentDialog() {
    setDependentDialogOpen(false);
    setEditingDependent(null);
  }

  async function handleDependentSaved(_result, context = {}) {
    handleCloseDependentDialog();

    setSuccessMessage(
      context.isEditing
        ? "扶養親屬資料已更新。"
        : "扶養親屬資料已新增。",
    );

    await loadDependents();
  }

  function handleOpenDeleteDependent(record) {
    setDeletingDependent(record);
    setError("");
    setSuccessMessage("");
  }

  function handleCloseDeleteDependent() {
    if (deletingDependentLoading) {
      return;
    }

    setDeletingDependent(null);
  }

  async function handleConfirmDeleteDependent() {
    const taxDependentId = Number(
      deletingDependent?.tax_dependent_id || 0,
    );

    if (!taxDependentId) {
      setError("扶養親屬資料 ID 不正確。");
      setDeletingDependent(null);
      return;
    }

    setDeletingDependentLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await deletePayrollTaxDependent(taxDependentId);

      setSuccessMessage("扶養親屬資料已刪除。");
      setDeletingDependent(null);

      await loadDependents();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "刪除扶養親屬資料失敗。"));
    } finally {
      setDeletingDependentLoading(false);
    }
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
        員工所得稅資料
      </Typography>

      <Typography
        sx={{
          mt: "5px",
          color: "#7b8794",
          fontSize: "13px",
        }}
      >
        管理員工所得稅身分、申報單位、扣繳設定及扶養親屬資料
      </Typography>

      <Alert severity="info" sx={{ mt: "18px" }}>
        已建立薪資主檔的員工也必須建立所得稅主檔；外籍員工的 183
        天身分變更應新增一筆具生效日期的異動紀錄。
      </Alert>

      {error && (
        <Alert
          severity="error"
          sx={{ mt: "18px" }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mt: "18px" }}
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "minmax(0, 1fr) auto",
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
            setSuccessMessage("");
            setRetiringRecord(null);
            setEditingDependent(null);
            setDeletingDependent(null);
            setDependentDialogOpen(false);
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

        <Box
          sx={{
            display: "flex",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: "10px",
          }}
        >
          <Button
            type="button"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={loadingProfiles || !selectedEmployee}
            onClick={handleOpenCreate}
            sx={{
              minWidth: {
                xs: "100%",
                sm: "150px",
              },
              fontWeight: 700,
            }}
          >
            新增所得稅資料
          </Button>

          <Button
            type="button"
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={loadingProfiles || !selectedEmployee}
            onClick={loadProfiles}
            sx={{
              minWidth: {
                xs: "100%",
                sm: "96px",
              },
              fontWeight: 700,
            }}
          >
            重新整理
          </Button>
        </Box>
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
              {"　"}
              員工狀態：
              {selectedEmployee.employee_status || "--"}
            </Typography>
          </Box>

          {loadingProfiles ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                minHeight: "240px",
              }}
            >
              <CircularProgress size={24} />

              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                載入所得稅資料中...
              </Typography>
            </Box>
          ) : (
            <>
              {!currentTaxProfile && (
                <Alert
                  severity="warning"
                  sx={{
                    mt: "18px",
                  }}
                >
                  此員工尚未建立目前有效的所得稅主檔，將無法通過計薪資料確認。
                </Alert>
              )}

              <Paper
                variant="outlined"
                sx={{
                  mt: "18px",
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
                    p: {
                      xs: "14px",
                      sm: "16px 18px",
                    },
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#1f2937",
                      fontSize: "15px",
                      fontWeight: 700,
                    }}
                  >
                    所得稅主檔異動紀錄
                  </Typography>

                  <Chip
                    label={`${taxProfiles.length} 筆`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                {taxProfiles.length === 0 ? (
                  <Alert
                    severity="info"
                    sx={{
                      m: "16px",
                    }}
                  >
                    此員工尚未建立所得稅主檔。
                  </Alert>
                ) : (
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
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
                          <TableCell
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            生效期間
                          </TableCell>

                          <TableCell
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            申報單位
                          </TableCell>

                          <TableCell
                            align="center"
                            sx={{
                              width: "112px",
                              minWidth: "112px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            狀態
                          </TableCell>

                          <TableCell
                            align="center"
                            sx={{
                              width: "126px",
                              minWidth: "126px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            計薪使用
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
                        {taxProfiles.map((record) => {
                          const profileId = Number(
                            record?.tax_profile_id || 0,
                          );

                          const isCurrent =
                            profileId ===
                            Number(
                              currentTaxProfile?.tax_profile_id || 0,
                            );

                          const isPayrollUsed =
                            Number(record?.is_payroll_used || 0) === 1;

                          const isRetired =
                            record?.status === "停用";

                          return (
                            <TableRow
                              key={profileId}
                              hover
                              sx={{
                                bgcolor: isCurrent
                                  ? "#f0f9ff"
                                  : "inherit",

                                "&:last-child td": {
                                  borderBottom: 0,
                                },
                              }}
                            >
                              <TableCell>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "7px",
                                  }}
                                >
                                  <Typography
                                    component="span"
                                    sx={{
                                      color: "#1f2937",
                                      fontSize: "14px",
                                    }}
                                  >
                                    {formatEffectivePeriod(record)}
                                  </Typography>

                                  {isCurrent && (
                                    <Chip
                                      label="目前生效"
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      sx={{
                                        fontWeight: 700,
                                      }}
                                    />
                                  )}
                                </Box>
                              </TableCell>

                              <TableCell>
                                <Typography
                                  sx={{
                                    color: "#1f2937",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {record?.declaration_unit_name || "--"}
                                </Typography>
                              </TableCell>

                              <TableCell align="center">
                                <Chip
                                  label={record?.status || "--"}
                                  size="small"
                                  color={
                                    record?.status === "啟用"
                                      ? "success"
                                      : "default"
                                  }
                                  variant={
                                    record?.status === "啟用"
                                      ? "filled"
                                      : "outlined"
                                  }
                                  sx={{
                                    fontWeight: 700,
                                  }}
                                />
                              </TableCell>

                              <TableCell align="center">
                                {isPayrollUsed ? (
                                  <Chip
                                    label={`已使用 ${Number(
                                      record?.payroll_usage_count || 0,
                                    )} 次`}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{
                                      fontWeight: 700,
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    label="尚未使用"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
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
                                    title="檢視詳細資料"
                                    arrow
                                  >
                                    <IconButton
                                      type="button"
                                      aria-label="檢視詳細資料"
                                      onClick={() =>
                                        handleOpenView(record)
                                      }
                                      sx={{
                                        width: "40px",
                                        height: "40px",
                                        color: "#15803d",
                                        bgcolor: "#f0fdf4",
                                        border: "1px solid #86efac",
                                        borderRadius: "6px",

                                        "&:hover": {
                                          bgcolor: "#dbeafe",
                                        },
                                      }}
                                    >
                                      <VisibilityOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip
                                    title={
                                      isPayrollUsed
                                        ? "此資料已用於計薪，無法直接編輯"
                                        : isRetired
                                          ? "已停用的資料無法編輯"
                                          : "編輯"
                                    }
                                    arrow
                                  >
                                    <span>
                                      <IconButton
                                        type="button"
                                        aria-label="編輯"
                                        disabled={
                                          isPayrollUsed ||
                                          isRetired
                                        }
                                        onClick={() =>
                                          handleOpenEdit(record)
                                        }
                                        sx={{
                                          width: "40px",
                                          height: "40px",
                                          color: "#1976d2",
                                          bgcolor: "#eff6ff",
                                          border: "1px solid #93c5fd",
                                          borderRadius: "6px",

                                          "&:hover": {
                                            bgcolor: "#dcfce7",
                                          },

                                          "&.Mui-disabled": {
                                            color: "#94a3b8",
                                            bgcolor: "#f1f5f9",
                                            borderColor: "#cbd5e1",
                                          },
                                        }}
                                      >
                                        <EditOutlinedIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>

                                  <Tooltip
                                    title={
                                      isRetired
                                        ? "此資料已停用"
                                        : "停用"
                                    }
                                    arrow
                                  >
                                    <span>
                                      <IconButton
                                        type="button"
                                        aria-label="停用"
                                        disabled={isRetired}
                                        onClick={() =>
                                          handleOpenRetire(record)
                                        }
                                        sx={{
                                          width: "40px",
                                          height: "40px",
                                          color: "#dc2626",
                                          bgcolor: "#fef2f2",
                                          border: "1px solid #fca5a5",
                                          borderRadius: "6px",

                                          "&:hover": {
                                            bgcolor: "#fee2e2",
                                          },

                                          "&.Mui-disabled": {
                                            color: "#94a3b8",
                                            bgcolor: "#f1f5f9",
                                            borderColor: "#cbd5e1",
                                          },
                                        }}
                                      >
                                        <DeleteOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
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

              <Paper
                variant="outlined"
                sx={{
                  mt: "18px",
                  borderColor: "#dfe4e8",
                  borderRadius: "5px",
                  boxShadow: "none",
                  overflow: "hidden",
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
                    p: {
                      xs: "14px",
                      sm: "16px 18px",
                    },
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: "#1f2937",
                        fontSize: "15px",
                        fontWeight: 700,
                      }}
                    >
                      扶養親屬資料
                    </Typography>

                    <Typography
                      sx={{
                        mt: "3px",
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      管理此員工所得稅扶養親屬及其生效期間。
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Chip
                      label={`${taxDependents.length} 筆`}
                      size="small"
                      variant="outlined"
                    />

                    <Button
                      type="button"
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      disabled={
                        loadingDependents ||
                        !currentTaxProfile
                      }
                      onClick={handleOpenCreateDependent}
                      sx={{
                        whiteSpace: "nowrap",
                        fontWeight: 700,
                      }}
                    >
                      新增扶養親屬
                    </Button>
                  </Box>
                </Box>

                {loadingDependents ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      minHeight: "150px",
                    }}
                  >
                    <CircularProgress size={22} />

                    <Typography
                      sx={{
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      載入扶養親屬資料中...
                    </Typography>
                  </Box>
                ) : taxDependents.length === 0 ? (
                  <Alert
                    severity="info"
                    sx={{
                      m: "16px",
                    }}
                  >
                    此員工尚未建立扶養親屬資料。
                  </Alert>
                ) : (
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
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
                          {[
                            "扶養親屬",
                            "關係",
                            "證號別",
                            "生效期間",
                            "狀態",
                            "操作",
                          ].map((label) => (
                            <TableCell
                              key={label}
                              align={
                                label === "狀態" || label === "操作"
                                  ? "center"
                                  : "left"
                              }
                              sx={{
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {taxDependents.map((record) => {
                          const dependentId = Number(
                            record?.tax_dependent_id || 0,
                          );

                          return (
                            <TableRow key={dependentId} hover>
                              <TableCell>
                                <Typography
                                  sx={{
                                    color: "#1f2937",
                                    fontSize: "14px",
                                    fontWeight: 700,
                                  }}
                                >
                                  {record?.dependent_name || "--"}
                                </Typography>

                                <Typography
                                  sx={{
                                    mt: "2px",
                                    color: "#64748b",
                                    fontSize: "12px",
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {record?.identity_number || "--"}
                                </Typography>
                              </TableCell>

                              <TableCell>
                                {record?.relationship_type || "--"}
                              </TableCell>

                              <TableCell>
                                {getCertificateTypeLabel(
                                  record?.certificate_type,
                                )}
                              </TableCell>

                              <TableCell
                                sx={{
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {formatEffectivePeriod(record)}
                              </TableCell>

                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={record?.status || "--"}
                                  color={
                                    record?.status === "啟用"
                                      ? "success"
                                      : "default"
                                  }
                                  variant={
                                    record?.status === "啟用"
                                      ? "filled"
                                      : "outlined"
                                  }
                                  sx={{
                                    fontWeight: 700,
                                  }}
                                />
                              </TableCell>

                              <TableCell
                                align="center"
                                sx={{
                                  width: "116px",
                                  minWidth: "116px",
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
                                  <Tooltip title="編輯" arrow>
                                    <IconButton
                                      type="button"
                                      aria-label="編輯扶養親屬"
                                      onClick={() =>
                                        handleOpenEditDependent(record)
                                      }
                                      sx={{
                                        width: "40px",
                                        height: "40px",
                                        color: "#1976d2",
                                        bgcolor: "#eff6ff",
                                        border: "1px solid #93c5fd",
                                        borderRadius: "6px",

                                        "&:hover": {
                                          bgcolor: "#dbeafe",
                                        },
                                      }}
                                    >
                                      <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="刪除" arrow>
                                    <IconButton
                                      type="button"
                                      aria-label="刪除扶養親屬"
                                      onClick={() =>
                                        handleOpenDeleteDependent(record)
                                      }
                                      sx={{
                                        width: "40px",
                                        height: "40px",
                                        color: "#dc2626",
                                        bgcolor: "#fef2f2",
                                        border: "1px solid #fca5a5",
                                        borderRadius: "6px",

                                        "&:hover": {
                                          bgcolor: "#fee2e2",
                                        },
                                      }}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
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
            </>
          )}
        </>
      )}

            <Dialog
        open={Boolean(viewingRecord)}
        onClose={handleCloseView}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
          }}
        >
          員工所得稅資料明細
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <Box
              sx={{
                gridColumn: "1 / -1",
                p: "14px",
                borderRadius: "5px",
                bgcolor: "#f8fafc",
              }}
            >
              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                員工
              </Typography>

              <Typography
                sx={{
                  mt: "4px",
                  color: "#111827",
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                {selectedEmployee
                  ? getEmployeeLabel(selectedEmployee)
                  : "--"}
              </Typography>
            </Box>

            <DetailField
              label="生效期間"
              value={
                viewingRecord
                  ? formatEffectivePeriod(viewingRecord)
                  : "--"
              }
            />

            <DetailField
              label="建檔日期"
              value={formatDate(viewingRecord?.entry_date)}
            />

            <DetailField
              label="所得稅申報單位"
              value={
                viewingRecord?.declaration_unit_name ||
                "--"
              }
            />

            <DetailField
              label="營業人統一編號"
              value={
                viewingRecord?.business_registration_no ||
                "--"
              }
            />

            <DetailField
              label="證號別"
              value={getCertificateTypeLabel(
                viewingRecord?.certificate_type,
              )}
            />

            <DetailField
              label="納稅人類型"
              value={viewingRecord?.taxpayer_type || "--"}
            />

            <DetailField
              label="居留狀態"
              value={viewingRecord?.residency_status || "--"}
            />

            <DetailField
              label="扣繳方式"
              value={getWithholdingMethodLabel(
                viewingRecord?.withholding_method,
              )}
            />

            <DetailField
              label="扣繳值"
              value={getWithholdingDetail(viewingRecord)}
            />

            <DetailField
              label="計算兼職薪資補充保費"
              value={formatBoolean(
                viewingRecord?.part_time_supplementary_enabled,
              )}
            />

            <DetailField
              label="兼職員工健保投保單位"
              value={
                viewingRecord
                  ?.part_time_health_insurance_unit_name ||
                "--"
              }
            />

            <DetailField
              label="補充保費弱勢族群身分"
              value={formatBoolean(
                viewingRecord?.vulnerable_group_exempt,
              )}
            />

            <DetailField
              label="狀態"
              value={viewingRecord?.status || "--"}
            />

            <DetailField
              label="計薪使用"
              value={
                Number(viewingRecord?.is_payroll_used || 0) === 1
                  ? `已使用 ${Number(
                      viewingRecord?.payroll_usage_count || 0,
                    )} 次`
                  : "尚未使用"
              }
            />

            <DetailField
              label="建立時間"
              value={
                viewingRecord?.created_at
                  ? String(viewingRecord.created_at)
                  : "--"
              }
            />

            <DetailField
              label="更新時間"
              value={
                viewingRecord?.updated_at
                  ? String(viewingRecord.updated_at)
                  : "--"
              }
            />

            <Box
              sx={{
                gridColumn: "1 / -1",
                p: "14px",
                border: "1px solid #e5e7eb",
                borderRadius: "5px",
              }}
            >
              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                備註
              </Typography>

              <Typography
                sx={{
                  mt: "5px",
                  color: "#1f2937",
                  fontSize: "14px",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {viewingRecord?.remarks || "--"}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: "24px",
            py: "14px",
          }}
        >
          <Button
            type="button"
            onClick={handleCloseView}
          >
            關閉
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(retiringRecord)}
        onClose={retiring ? undefined : handleCloseRetire}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
          }}
        >
          停用員工所得稅資料
        </DialogTitle>

        <DialogContent>
          <DialogContentText>確定要停用這筆所得稅資料嗎？</DialogContentText>

          <Alert
            severity={
              Number(retiringRecord?.is_payroll_used || 0) === 1
                ? "warning"
                : "info"
            }
            sx={{
              mt: "16px",
            }}
          >
            {Number(retiringRecord?.is_payroll_used || 0) === 1
              ? `這筆資料已用於 ${Number(
                  retiringRecord?.payroll_usage_count || 0,
                )} 筆計薪扣繳結果。停用後仍會保留歷史紀錄，既有薪資結果不會被刪除。`
              : "停用後資料仍會保留在異動紀錄中，不會被永久刪除。"}
          </Alert>

          <Box
            sx={{
              mt: "16px",
              p: "14px",
              borderRadius: "5px",
              bgcolor: "#f8fafc",
            }}
          >
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              生效期間
            </Typography>

            <Typography
              sx={{
                mt: "4px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              {retiringRecord ? formatEffectivePeriod(retiringRecord) : "--"}
            </Typography>

            <Typography
              sx={{
                mt: "12px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              所得稅申報單位
            </Typography>

            <Typography
              sx={{
                mt: "4px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              {retiringRecord?.declaration_unit_name || "--"}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: "24px",
            py: "14px",
          }}
        >
          <Button type="button" disabled={retiring} onClick={handleCloseRetire}>
            取消
          </Button>

          <Button
            type="button"
            color="error"
            variant="contained"
            disabled={retiring}
            startIcon={
              retiring ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteOutlineIcon />
              )
            }
            onClick={handleConfirmRetire}
          >
            {retiring ? "停用中..." : "確認停用"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(deletingDependent)}
        onClose={
          deletingDependentLoading
            ? undefined
            : handleCloseDeleteDependent
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
          }}
        >
          刪除扶養親屬資料
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            確定要永久刪除這筆扶養親屬資料嗎？
          </DialogContentText>

          <Alert
            severity="warning"
            sx={{
              mt: "16px",
            }}
          >
            刪除後將無法復原。若只是不再適用，請取消刪除並將狀態編輯為停用。
          </Alert>

          <Box
            sx={{
              mt: "16px",
              p: "14px",
              borderRadius: "5px",
              bgcolor: "#f8fafc",
            }}
          >
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              扶養親屬
            </Typography>

            <Typography
              sx={{
                mt: "4px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              {deletingDependent?.dependent_name || "--"}
            </Typography>

            <Typography
              sx={{
                mt: "12px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              生效期間
            </Typography>

            <Typography
              sx={{
                mt: "4px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              {deletingDependent
                ? formatEffectivePeriod(deletingDependent)
                : "--"}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: "24px",
            py: "14px",
          }}
        >
          <Button
            type="button"
            disabled={deletingDependentLoading}
            onClick={handleCloseDeleteDependent}
          >
            取消
          </Button>

          <Button
            type="button"
            color="error"
            variant="contained"
            disabled={deletingDependentLoading}
            startIcon={
              deletingDependentLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteOutlineIcon />
              )
            }
            onClick={handleConfirmDeleteDependent}
          >
            {deletingDependentLoading ? "刪除中..." : "確認刪除"}
          </Button>
        </DialogActions>
      </Dialog>

      <EmployeeTaxProfileFormDialog
        open={formDialogOpen}
        employee={selectedEmployee}
        record={editingRecord}
        onClose={handleCloseDialog}
        onSaved={handleSaved}
      />

      <EmployeeTaxDependentFormDialog
        open={dependentDialogOpen}
        employee={selectedEmployee}
        taxProfile={currentTaxProfile}
        editingRecord={editingDependent}
        onClose={handleCloseDependentDialog}
        onSaved={handleDependentSaved}
      />
    </Box>
  );
}
