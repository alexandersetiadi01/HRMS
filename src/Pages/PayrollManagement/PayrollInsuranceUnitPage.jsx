import { useCallback, useEffect, useState } from "react";
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
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import {
  deleteInsuranceUnit,
  getInsuranceUnits,
} from "../../API/payroll";
import InsuranceUnitFormDialog from "./InsuranceUnitFormDialog";
import InsuranceUnitRateHistoryDialog from "./InsuranceUnitRateHistoryDialog";

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatDate(value) {
  return value
    ? String(value).replaceAll("-", "/")
    : "無期限";
}

function formatRate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  const rate = Number(value);

  if (!Number.isFinite(rate)) {
    return "-";
  }

  return `${rate.toLocaleString("zh-TW", {
    maximumFractionDigits: 4,
  })}%`;
}

function isEnabled(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1"
  );
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

function UnitNumberList({ unit }) {
  const numbers = [
    ["勞保", unit.labor_insurance_unit_no],
    ["健保", unit.health_insurance_unit_no],
    ["勞退", unit.labor_pension_unit_no],
  ];

  return (
    <Box sx={{ display: "grid", gap: "3px" }}>
      {numbers.map(([label, value]) => (
        <Typography
          key={label}
          component="div"
          sx={{
            color: value ? "#334155" : "#94a3b8",
            fontSize: "12px",
            lineHeight: 1.45,
          }}
        >
          <Box
            component="span"
            sx={{
              display: "inline-block",
              width: "34px",
              color: "#64748b",
            }}
          >
            {label}
          </Box>

          {value || "未設定"}
        </Typography>
      ))}
    </Box>
  );
}

function UnitMobileCard({
  unit,
  onEdit,
  onRates,
  onDelete,
}) {
  const currentRate =
    unit.current_accident_rate;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: "14px",
          sm: "18px",
        },
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
              fontSize: {
                xs: "16px",
                sm: "17px",
              },
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {unit.unit_name || "-"}
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: "#64748b",
              fontSize: "12px",
              overflowWrap: "anywhere",
            }}
          >
            {unit.unit_code || "-"}
          </Typography>
        </Box>

        <StatusChip status={unit.status} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: {
            xs: "12px",
            sm: "16px",
          },
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
            目前職災費率
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: "#334155",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            {formatRate(
              currentRate?.accident_rate,
            )}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            補充保費扣繳
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: "#334155",
              fontSize: "14px",
            }}
          >
            {isEnabled(
              unit.supplementary_premium_withholding_enabled,
            )
              ? "啟用"
              : "未啟用"}
          </Typography>
        </Box>

        <Box sx={{ gridColumn: "1 / -1" }}>
          <Typography
            sx={{
              mb: "4px",
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            投保編號
          </Typography>

          <UnitNumberList unit={unit} />
        </Box>

        <Box sx={{ gridColumn: "1 / -1" }}>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            有效期間
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: "#334155",
              fontSize: "13px",
            }}
          >
            {formatDate(unit.effective_from)}
            {" ～ "}
            {formatDate(unit.effective_to)}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "6px",
          mt: "14px",
          pt: "10px",
          borderTop: "1px solid #edf0f3",
        }}
      >
        <Button
          size="small"
          startIcon={<HistoryOutlinedIcon />}
          onClick={() => onRates(unit)}
        >
          費率紀錄
        </Button>

        <Button
          size="small"
          startIcon={<EditOutlinedIcon />}
          onClick={() => onEdit(unit)}
        >
          編輯
        </Button>

        <Button
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

export default function PayrollInsuranceUnitsPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [searchInput, setSearchInput] =
    useState("");
  const [appliedSearch, setAppliedSearch] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("全部");

  const [formOpen, setFormOpen] =
    useState(false);
  const [editingUnit, setEditingUnit] =
    useState(null);
  const [rateUnit, setRateUnit] =
    useState(null);
  const [deleteTarget, setDeleteTarget] =
    useState(null);
  const [deleting, setDeleting] =
    useState(false);

  const loadUnits = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getInsuranceUnits({
        search: appliedSearch || undefined,
        status:
          statusFilter === "全部"
            ? undefined
            : statusFilter,
      });

      setUnits(
        Array.isArray(data) ? data : [],
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "讀取投保單位資料失敗。",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, statusFilter]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  function handleSearch(event) {
    event.preventDefault();

    setAppliedSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setAppliedSearch("");
  }

  function openCreateDialog() {
    setEditingUnit(null);
    setFormOpen(true);
  }

  function openEditDialog(unit) {
    setEditingUnit(unit);
    setFormOpen(true);
  }

  async function handleSaved(successMessage) {
    setFormOpen(false);
    setEditingUnit(null);
    setMessage(successMessage);

    await loadUnits();
  }

  async function handleRatesChanged(
    successMessage,
  ) {
    setMessage(successMessage);

    await loadUnits();
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const result =
        await deleteInsuranceUnit(
          deleteTarget.insurance_unit_id,
        );

      setDeleteTarget(null);

      setMessage(
        result?.message ||
          (result?.disabled
            ? "此投保單位已被使用，無法刪除，已改為停用。"
            : "投保單位已刪除。"),
      );

      await loadUnits();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "刪除投保單位失敗。",
        ),
      );
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
            投保單位
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#7b8794",
              fontSize: "13px",
            }}
          >
            維護勞健保投保單位、有效期間與職災保險費率
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          新增投保單位
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
        component="form"
        onSubmit={handleSearch}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "minmax(0, 1fr) 180px auto",
          },
          gap: "10px",
          mb: "16px",
        }}
      >
        <TextField
          size="small"
          label="搜尋投保單位"
          placeholder="代碼、名稱或投保編號"
          value={searchInput}
          onChange={(event) =>
            setSearchInput(event.target.value)
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small">
          <InputLabel id="insurance-unit-status-filter-label">
            狀態
          </InputLabel>

          <Select
            labelId="insurance-unit-status-filter-label"
            label="狀態"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <MenuItem value="全部">
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

        <Box
          sx={{
            display: "flex",
            gap: "6px",
          }}
        >
          <Button
            type="submit"
            variant="outlined"
            startIcon={<SearchIcon />}
            sx={{
              flex: {
                xs: 1,
                sm: "initial",
              },
            }}
          >
            搜尋
          </Button>

          {appliedSearch ? (
            <Button
              type="button"
              onClick={clearSearch}
            >
              清除
            </Button>
          ) : null}

          <Tooltip title="重新整理">
            <span>
              <IconButton
                type="button"
                onClick={loadUnits}
                disabled={loading}
                aria-label="重新整理投保單位"
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {loading ? (
        <Box
          sx={{
            minHeight: "220px",
            display: "grid",
            placeItems: "center",
          }}
        >
          <CircularProgress size={32} />
        </Box>
      ) : units.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: "30px 18px",
            borderStyle: "dashed",
            borderColor: "#cbd5e1",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            {appliedSearch ||
            statusFilter !== "全部"
              ? "沒有符合條件的投保單位。"
              : "尚未建立投保單位。"}
          </Typography>
        </Paper>
      ) : (
        <>
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
              borderColor: "#dfe4e8",
              overflowX: "hidden",
            }}
          >
            <Table
              size="small"
              sx={{
                width: "100%",
                tableLayout: "fixed",
                "& .MuiTableCell-root": {
                  px: {
                    md: "8px",
                    lg: "12px",
                  },
                  overflowWrap: "anywhere",
                },
              }}
            >
              <TableHead>
                <TableRow
                  sx={{ bgcolor: "#f8fafc" }}
                >
                  <TableCell sx={{ width: "20%" }}>
                    投保單位
                  </TableCell>

                  <TableCell sx={{ width: "23%" }}>
                    投保編號
                  </TableCell>

                  <TableCell sx={{ width: "15%" }}>
                    目前職災費率
                  </TableCell>

                  <TableCell sx={{ width: "18%" }}>
                    有效期間
                  </TableCell>

                  <TableCell sx={{ width: "9%" }}>
                    狀態
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ width: "15%" }}
                  >
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {units.map((unit) => {
                  const currentRate =
                    unit.current_accident_rate;

                  return (
                    <TableRow
                      key={
                        unit.insurance_unit_id
                      }
                      hover
                    >
                      <TableCell>
                        <Typography
                          sx={{
                            color: "#1f2937",
                            fontSize: "13px",
                            fontWeight: 700,
                            overflowWrap:
                              "anywhere",
                          }}
                        >
                          {unit.unit_name || "-"}
                        </Typography>

                        <Typography
                          sx={{
                            mt: "2px",
                            color: "#64748b",
                            fontSize: "12px",
                            overflowWrap:
                              "anywhere",
                          }}
                        >
                          {unit.unit_code || "-"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <UnitNumberList
                          unit={unit}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            color: "#334155",
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          {formatRate(
                            currentRate
                              ?.accident_rate,
                          )}
                        </Typography>

                        <Typography
                          sx={{
                            mt: "2px",
                            color: "#94a3b8",
                            fontSize: "11px",
                          }}
                        >
                          補充保費：
                          {isEnabled(
                            unit.supplementary_premium_withholding_enabled,
                          )
                            ? "啟用"
                            : "未啟用"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            color: "#334155",
                            fontSize: "12px",
                            lineHeight: 1.55,
                          }}
                        >
                          {formatDate(
                            unit.effective_from,
                          )}
                          <br />
                          至{" "}
                          {formatDate(
                            unit.effective_to,
                          )}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <StatusChip
                          status={unit.status}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="費率紀錄">
                          <IconButton
                            size="small"
                            onClick={() =>
                              setRateUnit(unit)
                            }
                            aria-label={`查看 ${
                              unit.unit_name || ""
                            } 的職災保險費率紀錄`}
                          >
                            <HistoryOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="編輯">
                          <IconButton
                            size="small"
                            onClick={() =>
                              openEditDialog(
                                unit,
                              )
                            }
                            aria-label={`編輯 ${
                              unit.unit_name || ""
                            }`}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="刪除">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteTarget(
                                unit,
                              )
                            }
                            aria-label={`刪除 ${
                              unit.unit_name || ""
                            }`}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              display: {
                xs: "grid",
                md: "none",
              },
              gap: "12px",
            }}
          >
            {units.map((unit) => (
              <UnitMobileCard
                key={unit.insurance_unit_id}
                unit={unit}
                onEdit={openEditDialog}
                onRates={setRateUnit}
                onDelete={setDeleteTarget}
              />
            ))}
          </Box>
        </>
      )}

      <InsuranceUnitFormDialog
        open={formOpen}
        unit={editingUnit}
        onClose={() => {
          setFormOpen(false);
          setEditingUnit(null);
        }}
        onSaved={handleSaved}
      />

      <InsuranceUnitRateHistoryDialog
        open={Boolean(rateUnit)}
        unit={rateUnit}
        onClose={() => setRateUnit(null)}
        onChanged={handleRatesChanged}
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
            fontSize: "19px",
            fontWeight: 700,
          }}
        >
          刪除投保單位
        </DialogTitle>

        <DialogContent dividers>
          <Typography
            sx={{
              color: "#334155",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            確定要刪除「
            {deleteTarget?.unit_name || ""}
            」嗎？
          </Typography>

          <Alert
            severity="warning"
            sx={{ mt: "14px" }}
          >
            如果此投保單位已被薪資或員工保險資料使用，系統不會刪除資料，而會自動將它改為停用。
          </Alert>
        </DialogContent>

        <DialogActions
          sx={{
            px: "24px",
            py: "14px",
          }}
        >
          <Button
            onClick={() =>
              setDeleteTarget(null)
            }
            disabled={deleting}
          >
            取消
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting
              ? "處理中…"
              : "確認刪除"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}