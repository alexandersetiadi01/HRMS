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
  createInsuranceIdentity,
  deleteInsuranceIdentity,
  getInsuranceIdentities,
  updateInsuranceIdentity,
} from "../../API/payroll";

const EMPTY_FORM = {
  identity_name: "",
  labor_insurance_enabled: true,
  health_insurance_enabled: false,
  pension_insurance_enabled: true,
  occupational_insurance_enabled: true,
  employer_pension_contribution_rate: 6,
  remarks: "",
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

function identityToForm(identity) {
  return {
    identity_name: String(identity?.identity_name || ""),
    labor_insurance_enabled: toBoolean(
      identity?.labor_insurance_enabled,
    ),
    health_insurance_enabled: toBoolean(
      identity?.health_insurance_enabled,
    ),
    pension_insurance_enabled: toBoolean(
      identity?.pension_insurance_enabled,
    ),
    occupational_insurance_enabled: toBoolean(
      identity?.occupational_insurance_enabled,
    ),
    employer_pension_contribution_rate:
      identity?.employer_pension_contribution_rate === null ||
      identity?.employer_pension_contribution_rate === undefined
        ? 6
        : identity.employer_pension_contribution_rate,
    remarks: String(identity?.remarks || ""),
    status: String(identity?.status || "啟用"),
  };
}

function buildPayload(form) {
  return {
    identity_name: form.identity_name.trim(),
    labor_insurance_enabled: form.labor_insurance_enabled ? 1 : 0,
    health_insurance_enabled: form.health_insurance_enabled ? 1 : 0,
    pension_insurance_enabled: form.pension_insurance_enabled ? 1 : 0,
    occupational_insurance_enabled:
      form.occupational_insurance_enabled ? 1 : 0,
    employer_pension_contribution_rate: Number(
      form.employer_pension_contribution_rate,
    ),
    remarks: form.remarks.trim(),
    status: form.status,
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

function InsuranceItemChip({ label, enabled }) {
  return (
    <Chip
      label={label}
      size="small"
      color={enabled ? "primary" : "default"}
      variant={enabled ? "filled" : "outlined"}
      sx={{
        opacity: enabled ? 1 : 0.55,
      }}
    />
  );
}

function InsuranceItems({
  identity,
  noWrap = false,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: noWrap ? "nowrap" : "wrap",
        gap: "5px",
      }}
    >
      {toBoolean(identity.labor_insurance_enabled) && (
        <InsuranceItemChip
          label="勞保"
          enabled
        />
      )}

      {toBoolean(identity.health_insurance_enabled) && (
        <InsuranceItemChip
          label="健保"
          enabled
        />
      )}

      {toBoolean(identity.pension_insurance_enabled) && (
        <InsuranceItemChip
          label="勞退"
          enabled
        />
      )}

      {toBoolean(identity.occupational_insurance_enabled) && (
        <InsuranceItemChip
          label="職保"
          enabled
        />
      )}
    </Box>
  );
}

function IdentityFormDialog({
  open,
  identity,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      identity
        ? identityToForm(identity)
        : { ...EMPTY_FORM },
    );

    setSubmitting(false);
    setError("");
  }, [identity, open]);

  function setField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function validateForm() {
    if (!form.identity_name.trim()) {
      return "請輸入身分類別。";
    }

    const hasInsuranceItem =
      form.labor_insurance_enabled ||
      form.health_insurance_enabled ||
      form.pension_insurance_enabled ||
      form.occupational_insurance_enabled;

    if (!hasInsuranceItem) {
      return "投保身分至少必須包含一個保險項目。";
    }

    const pensionRate = Number(
      form.employer_pension_contribution_rate,
    );

    if (
      !Number.isFinite(pensionRate) ||
      pensionRate < 6 ||
      pensionRate > 100
    ) {
      return "勞退雇主提繳率不得低於 6%，且不可超過 100%。";
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
      if (identity?.insurance_identity_id) {
        await updateInsuranceIdentity(
          identity.insurance_identity_id,
          buildPayload(form),
        );
      } else {
        await createInsuranceIdentity(
          buildPayload(form),
        );
      }

      await onSaved(
        identity
          ? "投保身分已更新。"
          : "投保身分已新增。",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          identity
            ? "更新投保身分失敗。"
            : "新增投保身分失敗。",
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
        {identity ? "編輯投保身分" : "新增投保身分"}
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
            label="身分類別"
            size="small"
            required
            value={form.identity_name}
            onChange={(event) =>
              setField(
                "identity_name",
                event.target.value,
              )
            }
            inputProps={{
              maxLength: 255,
            }}
            sx={{
              gridColumn: "1 / -1",
            }}
          />

          <Paper
            variant="outlined"
            sx={{
              gridColumn: "1 / -1",
              p: "14px",
              borderColor: "#dfe4e8",
              boxShadow: "none",
            }}
          >
            <Typography
              sx={{
                mb: "10px",
                color: "#334155",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              適用保險項目
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(4, minmax(0, 1fr))",
                },
                gap: "8px",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      form.labor_insurance_enabled
                    }
                    onChange={(event) =>
                      setField(
                        "labor_insurance_enabled",
                        event.target.checked,
                      )
                    }
                  />
                }
                label="勞保"
                sx={{
                  m: 0,
                }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={
                      form.health_insurance_enabled
                    }
                    onChange={(event) =>
                      setField(
                        "health_insurance_enabled",
                        event.target.checked,
                      )
                    }
                  />
                }
                label="健保"
                sx={{
                  m: 0,
                }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={
                      form.pension_insurance_enabled
                    }
                    onChange={(event) =>
                      setField(
                        "pension_insurance_enabled",
                        event.target.checked,
                      )
                    }
                  />
                }
                label="勞退"
                sx={{
                  m: 0,
                }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={
                      form.occupational_insurance_enabled
                    }
                    onChange={(event) =>
                      setField(
                        "occupational_insurance_enabled",
                        event.target.checked,
                      )
                    }
                  />
                }
                label="職保"
                sx={{
                  m: 0,
                }}
              />
            </Box>
          </Paper>

          <TextField
            label="勞退雇主提繳率（%）"
            type="number"
            size="small"
            required
            value={
              form.employer_pension_contribution_rate
            }
            onChange={(event) =>
              setField(
                "employer_pension_contribution_rate",
                event.target.value,
              )
            }
            inputProps={{
              min: 6,
              max: 100,
              step: 0.0001,
            }}
          />

          <FormControl size="small" fullWidth>
            <InputLabel>狀態</InputLabel>

            <Select
              label="狀態"
              value={form.status}
              onChange={(event) =>
                setField(
                  "status",
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
            inputProps={{
              maxLength: 1000,
            }}
            sx={{
              gridColumn: "1 / -1",
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
          ) : identity ? (
            "儲存變更"
          ) : (
            "確認新增"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function IdentityMobileCard({
  identity,
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
        <Typography
          sx={{
            minWidth: 0,
            color: "#1f2937",
            fontSize: {
              xs: "16px",
              sm: "17px",
            },
            fontWeight: 700,
            overflowWrap: "anywhere",
          }}
        >
          {identity.identity_name || "--"}
        </Typography>

        <StatusChip status={identity.status} />
      </Box>

      <Box
        sx={{
          mt: "15px",
        }}
      >
        <Typography
          sx={{
            mb: "7px",
            color: "#94a3b8",
            fontSize: "12px",
          }}
        >
          適用保險項目
        </Typography>

        <InsuranceItems identity={identity} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "12px",
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
            勞退雇主提繳率
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#334155",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            {Number(
              identity.employer_pension_contribution_rate,
            ).toLocaleString("zh-TW", {
              maximumFractionDigits: 4,
            })}
            %
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            備註
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#334155",
              fontSize: "13px",
              overflowWrap: "anywhere",
            }}
          >
            {identity.remarks || "--"}
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
          onClick={() => onEdit(identity)}
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
          onClick={() => onDelete(identity)}
        >
          刪除
        </Button>
      </Box>
    </Paper>
  );
}

export default function PayrollInsuranceIdentitiesPage() {
  const [identities, setIdentities] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadIdentities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getInsuranceIdentities({
        search: search.trim(),
        status,
      });

      setIdentities(
        Array.isArray(result) ? result : [],
      );
    } catch (requestError) {
      setIdentities([]);

      setError(
        getErrorMessage(
          requestError,
          "無法載入投保身分資料。",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    loadIdentities();
  }, [loadIdentities]);

  const resultCount = identities.length;

  const enabledCount = useMemo(
    () =>
      identities.filter(
        (identity) => identity.status === "啟用",
      ).length,
    [identities],
  );

  function handleOpenCreate() {
    setSuccess("");
    setError("");
    setFormDialog({
      identity: null,
    });
  }

  function handleOpenEdit(identity) {
    setSuccess("");
    setError("");
    setFormDialog({
      identity,
    });
  }

  async function handleSaved(message) {
    setFormDialog(null);
    setSuccess(message);

    await loadIdentities();
  }

  async function handleDelete() {
    if (!deleteTarget?.insurance_identity_id) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const result = await deleteInsuranceIdentity(
        deleteTarget.insurance_identity_id,
      );

      setDeleteTarget(null);

      setSuccess(
        result?.disabled
          ? result.message ||
              "此投保身分已被使用，已改為停用。"
          : "投保身分已刪除。",
      );

      await loadIdentities();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "刪除投保身分失敗。",
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
            投保身分
          </Typography>

          <Typography
            sx={{
              mt: "5px",
              color: "#7b8794",
              fontSize: "13px",
            }}
          >
            管理員工可使用的投保身分類別與適用保險項目
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
              sm: "132px",
            },
            fontWeight: 700,
          }}
        >
          新增投保身分
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
          label="搜尋投保身分"
          placeholder="輸入身分類別"
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
          onClick={loadIdentities}
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
          gap: "8px",
          mt: "16px",
        }}
      >
        <Chip
          label={`共 ${resultCount} 筆`}
          size="small"
          variant="outlined"
        />

        <Chip
          label={`啟用 ${enabledCount} 筆`}
          size="small"
          color="success"
          variant="outlined"
        />
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
            載入投保身分中...
          </Typography>
        </Box>
      ) : identities.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            mt: "18px",
          }}
        >
          找不到符合條件的投保身分。
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
            {identities.map((identity) => (
              <IdentityMobileCard
                key={
                  identity.insurance_identity_id
                }
                identity={identity}
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
                    md: "10px",
                    lg: "14px",
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
                <col style={{ width: "15%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "9%" }} />
              </colgroup>

              <TableHead>
                <TableRow>
                  <TableCell>
                    身分
                  </TableCell>

                  <TableCell>
                    適用項目
                  </TableCell>

                  <TableCell align="center">
                    雇主提繳率
                  </TableCell>

                  <TableCell>
                    備註
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
                {identities.map((identity) => (
                  <TableRow
                    key={
                      identity.insurance_identity_id
                    }
                    hover
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={
                        identity.identity_name || "--"
                      }
                    >
                      {identity.identity_name || "--"}
                    </TableCell>

                    <TableCell>
                      <InsuranceItems
                        identity={identity}
                        noWrap
                      />
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{
                        whiteSpace: "nowrap",
                      }}
                    >
                      {Number(
                        identity.employer_pension_contribution_rate,
                      ).toLocaleString("zh-TW", {
                        maximumFractionDigits: 4,
                      })}
                      %
                    </TableCell>

                    <TableCell
                      sx={{
                        whiteSpace: "normal",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {identity.remarks || "--"}
                    </TableCell>

                    <TableCell align="center">
                      <StatusChip
                        status={identity.status}
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
                        <Tooltip
                          title="編輯"
                          arrow
                        >
                          <IconButton
                            type="button"
                            size="small"
                            aria-label="編輯"
                            onClick={() =>
                              handleOpenEdit(identity)
                            }
                          >
                            <EditOutlinedIcon
                              sx={{
                                fontSize: "20px",
                              }}
                            />
                          </IconButton>
                        </Tooltip>

                        <Tooltip
                          title="刪除"
                          arrow
                        >
                          <IconButton
                            type="button"
                            size="small"
                            color="error"
                            aria-label="刪除"
                            onClick={() =>
                              setDeleteTarget(identity)
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

      <IdentityFormDialog
        open={Boolean(formDialog)}
        identity={formDialog?.identity || null}
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
          刪除投保身分
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="warning">
            確定要刪除「
            {deleteTarget?.identity_name || "--"}
            」嗎？若此身分已被員工保險紀錄使用，系統不會刪除資料，而會自動將狀態改為停用。
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