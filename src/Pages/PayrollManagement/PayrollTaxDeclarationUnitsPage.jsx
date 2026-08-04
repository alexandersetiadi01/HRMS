import { useCallback, useEffect, useMemo, useState } from "react";
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
  InputAdornment,
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
  createTaxDeclarationUnit,
  deleteTaxDeclarationUnit,
  getTaxDeclarationUnits,
  updateTaxDeclarationUnit,
} from "../../API/payroll";

const EMPTY_FORM = {
  declaration_unit_name: "",
  business_registration_no: "",
  withholding_tax_unit_no: "",
  responsible_person: "",
  contact_person: "",
  contact_phone: "",
  declaration_address: "",
  is_default: false,
  status: "啟用",
  remarks: "",
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

function unitToForm(unit) {
  return {
    declaration_unit_name: String(
      unit?.declaration_unit_name || "",
    ),
    business_registration_no: String(
      unit?.business_registration_no || "",
    ),
    withholding_tax_unit_no: String(
      unit?.withholding_tax_unit_no || "",
    ),
    responsible_person: String(
      unit?.responsible_person || "",
    ),
    contact_person: String(
      unit?.contact_person || "",
    ),
    contact_phone: String(
      unit?.contact_phone || "",
    ),
    declaration_address: String(
      unit?.declaration_address || "",
    ),
    is_default: toBoolean(unit?.is_default),
    status: String(unit?.status || "啟用"),
    remarks: String(unit?.remarks || ""),
  };
}

function buildPayload(form) {
  return {
    declaration_unit_name:
      form.declaration_unit_name.trim(),

    business_registration_no:
      form.business_registration_no.replace(
        /\D+/g,
        "",
      ),

    withholding_tax_unit_no:
      form.withholding_tax_unit_no.trim(),

    responsible_person:
      form.responsible_person.trim(),

    contact_person:
      form.contact_person.trim(),

    contact_phone:
      form.contact_phone.trim(),

    declaration_address:
      form.declaration_address.trim(),

    is_default: form.is_default ? 1 : 0,

    status: form.status,

    remarks: form.remarks.trim(),
  };
}

function StatusChip({ status }) {
  const enabled = status === "啟用";

  return (
    <Chip
      label={enabled ? "啟用" : "停用"}
      size="small"
      color={enabled ? "success" : "default"}
      variant="outlined"
    />
  );
}

function DefaultChip({ isDefault }) {
  if (!toBoolean(isDefault)) {
    return null;
  }

  return (
    <Chip
      label="預設"
      size="small"
      color="primary"
    />
  );
}

function TaxDeclarationUnitFormDialog({
  open,
  unit,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      unit
        ? unitToForm(unit)
        : { ...EMPTY_FORM },
    );

    setSubmitting(false);
    setError("");
  }, [open, unit]);

  function setField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function handleStatusChange(value) {
    setForm((current) => ({
      ...current,
      status: value,
      is_default:
        value === "停用"
          ? false
          : current.is_default,
    }));

    setError("");
  }

  function validateForm() {
    if (!form.declaration_unit_name.trim()) {
      return "請輸入申報單位名稱。";
    }

    const businessRegistrationNo =
      form.business_registration_no.replace(
        /\D+/g,
        "",
      );

    if (
      businessRegistrationNo.length !== 8
    ) {
      return "統一編號必須是 8 位數字。";
    }

    if (
      form.withholding_tax_unit_no.length > 50
    ) {
      return "扣繳單位稅籍編號不可超過 50 個字元。";
    }

    if (
      form.responsible_person.length > 255
    ) {
      return "負責人不可超過 255 個字元。";
    }

    if (
      form.contact_person.length > 255
    ) {
      return "聯絡人不可超過 255 個字元。";
    }

    if (
      form.contact_phone.length > 100
    ) {
      return "聯絡電話不可超過 100 個字元。";
    }

    if (
      form.is_default &&
      form.status !== "啟用"
    ) {
      return "只有啟用中的申報單位可以設為預設。";
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
      if (unit?.tax_declaration_unit_id) {
        await updateTaxDeclarationUnit(
          unit.tax_declaration_unit_id,
          buildPayload(form),
        );
      } else {
        await createTaxDeclarationUnit(
          buildPayload(form),
        );
      }

      await onSaved(
        unit
          ? "所得稅申報單位已更新。"
          : "所得稅申報單位已新增。",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          unit
            ? "更新所得稅申報單位失敗。"
            : "新增所得稅申報單位失敗。",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={
        submitting ? undefined : onClose
      }
      fullWidth
      maxWidth="md"
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
        {unit
          ? "編輯所得稅申報單位"
          : "新增所得稅申報單位"}
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: "16px",
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{
                gridColumn: "1 / -1",
              }}
            >
              {error}
            </Alert>
          )}

          <TextField
            label="申報單位名稱"
            size="small"
            required
            value={form.declaration_unit_name}
            onChange={(event) =>
              setField(
                "declaration_unit_name",
                event.target.value,
              )
            }
            inputProps={{
              maxLength: 255,
            }}
            sx={{
              gridColumn: {
                xs: "auto",
                sm: "1 / -1",
              },
            }}
          />

          <TextField
            label="統一編號"
            size="small"
            required
            value={form.business_registration_no}
            onChange={(event) =>
              setField(
                "business_registration_no",
                event.target.value.replace(
                  /\D+/g,
                  "",
                ),
              )
            }
            inputProps={{
              maxLength: 8,
              inputMode: "numeric",
            }}
            helperText={`${form.business_registration_no.length}/8`}
          />

          <TextField
            label="扣繳單位稅籍編號"
            size="small"
            value={form.withholding_tax_unit_no}
            onChange={(event) =>
              setField(
                "withholding_tax_unit_no",
                event.target.value,
              )
            }
            inputProps={{
              maxLength: 50,
            }}
          />

          <TextField
            label="負責人"
            size="small"
            value={form.responsible_person}
            onChange={(event) =>
              setField(
                "responsible_person",
                event.target.value,
              )
            }
            inputProps={{
              maxLength: 255,
            }}
          />

          <TextField
            label="聯絡人"
            size="small"
            value={form.contact_person}
            onChange={(event) =>
              setField(
                "contact_person",
                event.target.value,
              )
            }
            inputProps={{
              maxLength: 255,
            }}
          />

          <TextField
            label="聯絡電話"
            size="small"
            value={form.contact_phone}
            onChange={(event) =>
              setField(
                "contact_phone",
                event.target.value,
              )
            }
            inputProps={{
              maxLength: 100,
            }}
          />

          <FormControl
            size="small"
            fullWidth
          >
            <InputLabel>狀態</InputLabel>

            <Select
              label="狀態"
              value={form.status}
              onChange={(event) =>
                handleStatusChange(
                  event.target.value,
                )
              }
            >
              <MenuItem value="啟用">
                啟用
              </MenuItem>

              <MenuItem value="停用">
                停用
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="申報地址"
            value={form.declaration_address}
            onChange={(event) =>
              setField(
                "declaration_address",
                event.target.value,
              )
            }
            multiline
            minRows={2}
            sx={{
              gridColumn: {
                xs: "auto",
                sm: "1 / -1",
              },
            }}
          />

          <Paper
            variant="outlined"
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
              gridColumn: {
                xs: "auto",
                sm: "1 / -1",
              },
              p: "14px",
              borderColor: "#dfe4e8",
              boxShadow: "none",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#334155",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                預設申報單位
              </Typography>

              <Typography
                sx={{
                  mt: "3px",
                  color: "#7b8794",
                  fontSize: "12px",
                }}
              >
                設為預設後，其他申報單位會自動取消預設。
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_default}
                  disabled={
                    form.status !== "啟用"
                  }
                  onChange={(event) =>
                    setField(
                      "is_default",
                      event.target.checked,
                    )
                  }
                />
              }
              label={
                form.is_default
                  ? "已設為預設"
                  : "設為預設"
              }
              sx={{
                m: 0,
              }}
            />
          </Paper>

          <TextField
            label="備註"
            value={form.remarks}
            onChange={(event) =>
              setField(
                "remarks",
                event.target.value,
              )
            }
            multiline
            minRows={3}
            sx={{
              gridColumn: {
                xs: "auto",
                sm: "1 / -1",
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: "14px 20px",
        }}
      >
        <Button
          type="button"
          color="inherit"
          disabled={submitting}
          onClick={onClose}
        >
          取消
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
        >
          {submitting ? (
            <CircularProgress
              size={20}
              color="inherit"
            />
          ) : unit ? (
            "儲存變更"
          ) : (
            "確認新增"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TaxDeclarationUnitMobileCard({
  unit,
  onEdit,
  onDelete,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: "14px",
          sm: "18px",
        },
        borderColor: "#dfe4e8",
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
        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              color: "#1f2937",
              fontSize: {
                xs: "16px",
                sm: "17px",
              },
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {unit.declaration_unit_name || "--"}
          </Typography>

          <Typography
            sx={{
              mt: "4px",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            統編：
            {unit.business_registration_no || "--"}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "5px",
          }}
        >
          <StatusChip status={unit.status} />

          <DefaultChip
            isDefault={unit.is_default}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "14px 12px",
          mt: "16px",
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            稅籍編號
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#334155",
              fontSize: "13px",
              overflowWrap: "anywhere",
            }}
          >
            {unit.withholding_tax_unit_no || "--"}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            負責人
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#334155",
              fontSize: "13px",
              overflowWrap: "anywhere",
            }}
          >
            {unit.responsible_person || "--"}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            聯絡人
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#334155",
              fontSize: "13px",
              overflowWrap: "anywhere",
            }}
          >
            {unit.contact_person || "--"}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            電話
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#334155",
              fontSize: "13px",
              overflowWrap: "anywhere",
            }}
          >
            {unit.contact_phone || "--"}
          </Typography>
        </Box>

        <Box
          sx={{
            gridColumn: "1 / -1",
          }}
        >
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            地址
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#334155",
              fontSize: "13px",
              overflowWrap: "anywhere",
            }}
          >
            {unit.declaration_address || "--"}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "6px",
          mt: "16px",
          pt: "12px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <Button
          type="button"
          size="small"
          startIcon={<EditOutlinedIcon />}
          onClick={() => onEdit(unit)}
        >
          編輯
        </Button>

        <Button
          type="button"
          size="small"
          color="error"
          startIcon={
            <DeleteOutlineOutlinedIcon />
          }
          onClick={() => onDelete(unit)}
        >
          刪除
        </Button>
      </Box>
    </Paper>
  );
}

export default function PayrollTaxDeclarationUnitsPage() {
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] =
    useState(null);
  const [deleteTarget, setDeleteTarget] =
    useState(null);
  const [deleting, setDeleting] =
    useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUnits = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result =
        await getTaxDeclarationUnits({
          search: search.trim(),
          status,
        });

      setUnits(
        Array.isArray(result) ? result : [],
      );
    } catch (requestError) {
      setUnits([]);

      setError(
        getErrorMessage(
          requestError,
          "無法載入所得稅申報單位。",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const enabledCount = useMemo(
    () =>
      units.filter(
        (unit) => unit.status === "啟用",
      ).length,
    [units],
  );

  const defaultUnit = useMemo(
    () =>
      units.find(
        (unit) => toBoolean(unit.is_default),
      ) || null,
    [units],
  );

  function handleOpenCreate() {
    setSuccess("");
    setError("");

    setFormDialog({
      unit: null,
    });
  }

  function handleOpenEdit(unit) {
    setSuccess("");
    setError("");

    setFormDialog({
      unit,
    });
  }

  async function handleSaved(message) {
    setFormDialog(null);
    setSuccess(message);

    await loadUnits();
  }

  async function handleDelete() {
    if (
      !deleteTarget?.tax_declaration_unit_id
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const result =
        await deleteTaxDeclarationUnit(
          deleteTarget.tax_declaration_unit_id,
        );

      setDeleteTarget(null);

      setSuccess(
        result?.disabled
          ? result.message ||
              "此申報單位已被薪資扣繳結果使用，已改為停用。"
          : result?.message ||
              "所得稅申報單位已刪除。",
      );

      await loadUnits();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "刪除所得稅申報單位失敗。",
        ),
      );
    } finally {
      setDeleting(false);
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
        }}
      >
        <Box>
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
            所得稅申報單位
          </Typography>

          <Typography
            sx={{
              mt: "5px",
              color: "#7b8794",
              fontSize: "13px",
            }}
          >
            管理薪資所得扣繳使用的法定申報單位
          </Typography>
        </Box>

        <Button
          type="button"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            minWidth: {
              xs: "100%",
              sm: "158px",
            },
            fontWeight: 700,
          }}
        >
          新增申報單位
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mt: "18px",
          }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{
            mt: "18px",
          }}
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
            md: "minmax(0, 1fr) 180px auto",
          },
          gap: "12px",
          mt: "20px",
          p: {
            xs: "14px",
            sm: "18px",
          },
          borderColor: "#dfe4e8",
          boxShadow: "none",
        }}
      >
        <TextField
          label="搜尋申報單位"
          placeholder="輸入名稱、統編或稅籍編號"
          size="small"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
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
        />

        <FormControl size="small" fullWidth>
          <InputLabel>狀態</InputLabel>

          <Select
            label="狀態"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <MenuItem value="">
              全部
            </MenuItem>

            <MenuItem value="啟用">
              啟用
            </MenuItem>

            <MenuItem value="停用">
              停用
            </MenuItem>
          </Select>
        </FormControl>

        <Button
          type="button"
          variant="outlined"
          startIcon={<RefreshIcon />}
          disabled={loading}
          onClick={loadUnits}
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

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          mt: "16px",
        }}
      >
        <Chip
          label={`共 ${units.length} 筆`}
          size="small"
          variant="outlined"
        />

        <Chip
          label={`啟用 ${enabledCount} 筆`}
          size="small"
          color="success"
          variant="outlined"
        />

        {defaultUnit && (
          <Chip
            label={`預設：${defaultUnit.declaration_unit_name}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {loading ? (
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
            載入申報單位中...
          </Typography>
        </Box>
      ) : units.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            mt: "18px",
          }}
        >
          找不到符合條件的所得稅申報單位。
        </Alert>
      ) : (
        <>
          <Box
            sx={{
              display: {
                xs: "grid",
                md: "none",
              },
              gap: "12px",
              mt: "18px",
            }}
          >
            {units.map((unit) => (
              <TaxDeclarationUnitMobileCard
                key={
                  unit.tax_declaration_unit_id
                }
                unit={unit}
                onEdit={handleOpenEdit}
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
              mt: "18px",
              borderColor: "#dfe4e8",
              boxShadow: "none",
              overflowX: "hidden",
            }}
          >
            <Table
              size="small"
              sx={{
                width: "100%",
                tableLayout: "fixed",

                "& th, & td": {
                  px: {
                    md: "9px",
                    lg: "13px",
                  },
                  py: "12px",
                  verticalAlign: "middle",
                },

                "& th": {
                  color: "#334155",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                },
              }}
            >
              <colgroup>
                <col style={{ width: "24%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>

              <TableHead>
                <TableRow>
                  <TableCell>
                    申報單位
                  </TableCell>

                  <TableCell>
                    統編
                  </TableCell>

                  <TableCell>
                    稅籍編號
                  </TableCell>

                  <TableCell>
                    聯絡人
                  </TableCell>

                  <TableCell>
                    電話
                  </TableCell>

                  <TableCell align="center">
                    狀態
                  </TableCell>

                  <TableCell align="center">
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {units.map((unit) => (
                  <TableRow
                    key={
                      unit.tax_declaration_unit_id
                    }
                    hover
                  >
                    <TableCell>
                      <Box
                        sx={{
                          minWidth: 0,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "5px",
                          }}
                        >
                          <Typography
                            sx={{
                              minWidth: 0,
                              color: "#1f2937",
                              fontSize: "13px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={
                              unit.declaration_unit_name ||
                              "--"
                            }
                          >
                            {unit.declaration_unit_name || "--"}
                          </Typography>

                          <DefaultChip
                            isDefault={unit.is_default}
                          />
                        </Box>

                        <Typography
                          sx={{
                            mt: "3px",
                            color: "#7b8794",
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={
                            unit.declaration_address ||
                            "--"
                          }
                        >
                          {unit.declaration_address || "--"}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                      }}
                    >
                      {unit.business_registration_no || "--"}
                    </TableCell>

                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={
                        unit.withholding_tax_unit_no ||
                        "--"
                      }
                    >
                      {unit.withholding_tax_unit_no || "--"}
                    </TableCell>

                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={
                        unit.contact_person || "--"
                      }
                    >
                      {unit.contact_person || "--"}
                    </TableCell>

                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={
                        unit.contact_phone || "--"
                      }
                    >
                      {unit.contact_phone || "--"}
                    </TableCell>

                    <TableCell align="center">
                      <StatusChip
                        status={unit.status}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexWrap: "nowrap",
                          gap: "2px",
                        }}
                      >
                        <Tooltip title="編輯" arrow>
                          <IconButton
                            type="button"
                            size="small"
                            aria-label="編輯"
                            onClick={() =>
                              handleOpenEdit(unit)
                            }
                          >
                            <EditOutlinedIcon
                              sx={{
                                fontSize: "20px",
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
                              setDeleteTarget(unit)
                            }
                          >
                            <DeleteOutlineOutlinedIcon
                              sx={{
                                fontSize: "20px",
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <TaxDeclarationUnitFormDialog
        open={Boolean(formDialog)}
        unit={formDialog?.unit || null}
        onClose={() => setFormDialog(null)}
        onSaved={handleSaved}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={
          deleting
            ? undefined
            : () => setDeleteTarget(null)
        }
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
          }}
        >
          刪除所得稅申報單位
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="warning">
            確定要刪除「
            {deleteTarget?.declaration_unit_name ||
              "--"}
            」嗎？若此單位已被薪資扣繳結果使用，系統不會刪除資料，而會自動將狀態改為停用。
          </Alert>
        </DialogContent>

        <DialogActions
          sx={{
            p: "14px 20px",
          }}
        >
          <Button
            type="button"
            color="inherit"
            disabled={deleting}
            onClick={() =>
              setDeleteTarget(null)
            }
          >
            取消
          </Button>

          <Button
            type="button"
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? (
              <CircularProgress
                size={20}
                color="inherit"
              />
            ) : (
              "確認刪除"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}