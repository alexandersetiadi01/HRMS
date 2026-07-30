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
  Snackbar,
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
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  createInsuranceRateVersion,
  deleteInsuranceRateVersion,
  getInsuranceRateVersion,
  getInsuranceRateVersions,
  updateInsuranceRateVersion,
} from "../../API/payroll";
import InsuranceRateVersionFormDialog from "./InsuranceRateVersionFormDialog";

const STATUS_OPTIONS = [
  {
    value: "",
    label: "全部狀態",
  },
  {
    value: "草稿",
    label: "草稿",
  },
  {
    value: "已發布",
    label: "已發布",
  },
  {
    value: "已失效",
    label: "已失效",
  },
];

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatDate(value, emptyText = "無期限") {
  if (!value) {
    return emptyText;
  }

  return String(value).replaceAll("-", "/");
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return String(value).replace("T", " ").replaceAll("-", "/");
}

function StatusChip({ status }) {
  const settings = {
    草稿: {
      color: "#b45309",
      bgcolor: "#fef3c7",
      borderColor: "#fcd34d",
    },
    已發布: {
      color: "#15803d",
      bgcolor: "#dcfce7",
      borderColor: "#86efac",
    },
    已失效: {
      color: "#64748b",
      bgcolor: "#f1f5f9",
      borderColor: "#cbd5e1",
    },
  };

  const current = settings[status] || settings.草稿;

  return (
    <Chip
      label={status || "草稿"}
      size="small"
      variant="outlined"
      sx={{
        color: current.color,
        bgcolor: current.bgcolor,
        borderColor: current.borderColor,
        fontWeight: 700,
      }}
    />
  );
}

function getDetailActionLabel(status) {
  if (status === "草稿") {
    return "查看草稿";
  }

  if (status === "已失效") {
    return "查看歷史";
  }

  return "查看費率";
}

function SourceContent({ version }) {
  const sourceName = version?.source_name || "未設定";

  const sourceUrl = String(version?.source_url || "").trim();

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color: "#334155",
          fontSize: "13px",
          fontWeight: 600,
          overflowWrap: "anywhere",
        }}
      >
        {sourceName}
      </Typography>

      {sourceUrl ? (
        <Typography
          component="a"
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          sx={{
            display: "inline-block",
            mt: "2px",
            maxWidth: "100%",
            color: "#0284c7",
            fontSize: "12px",
            overflowWrap: "anywhere",
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          查看來源
        </Typography>
      ) : null}
    </Box>
  );
}

function DetailField({ label, children, fullWidth = false }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        gridColumn: fullWidth ? "1 / -1" : "auto",
      }}
    >
      <Typography
        sx={{
          color: "#94a3b8",
          fontSize: "12px",
        }}
      >
        {label}
      </Typography>

      <Typography
        component="div"
        sx={{
          mt: "3px",
          color: "#334155",
          fontSize: "14px",
          fontWeight: 600,
          lineHeight: 1.55,
          overflowWrap: "anywhere",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

function VersionMobileCard({
  version,
  onView,
  onEdit,
  onDelete,
  detailLoading,
  editLoading,
  deleteLoading,
}) {
  const isDraft = version.status === "草稿";
  const actionLoading = detailLoading || editLoading || deleteLoading;
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
            {version.version_name || version.version_code || "-"}
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: "#64748b",
              fontSize: "12px",
              overflowWrap: "anywhere",
            }}
          >
            {version.version_code || "-"}
          </Typography>
        </Box>

        <StatusChip status={version.status} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: {
            xs: "12px",
            sm: "16px",
          },
          mt: "16px",
        }}
      >
        <DetailField label="生效日期">
          {formatDate(version.effective_from, "-")}
        </DetailField>

        <DetailField label="結束日期">
          {formatDate(version.effective_to)}
        </DetailField>

        <DetailField label="資料來源" fullWidth>
          <SourceContent version={version} />
        </DetailField>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: isDraft ? "repeat(3, minmax(0, 1fr))" : "minmax(0, 1fr)",
          },
          gap: "10px",
          mt: "16px",
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          startIcon={
            detailLoading ? (
              <CircularProgress size={16} />
            ) : (
              <VisibilityOutlinedIcon />
            )
          }
          onClick={() => onView(version)}
          disabled={actionLoading}
          sx={{
            borderColor: "#cbd5e1",
            color: "#475569",
          }}
        >
          {getDetailActionLabel(version.status)}
        </Button>

        {isDraft ? (
          <>
            <Button
              fullWidth
              variant="outlined"
              startIcon={
                editLoading ? (
                  <CircularProgress size={16} />
                ) : (
                  <EditOutlinedIcon />
                )
              }
              onClick={() => onEdit(version)}
              disabled={actionLoading}
              sx={{
                borderColor: "#1f9bd1",
                color: "#168dc5",
              }}
            >
              編輯草稿
            </Button>

            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={
                deleteLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DeleteOutlineIcon />
                )
              }
              onClick={() => onDelete(version)}
              disabled={actionLoading}
            >
              刪除草稿
            </Button>
          </>
        ) : null}
      </Box>
    </Paper>
  );
}

function VersionDetailDialog({
  open,
  version,
  loading,
  errorMessage,
  onClose,
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          pr: "12px",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="div"
            sx={{
              color: "#1f2937",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            保險費率版本資料
          </Typography>

          <Typography
            component="div"
            sx={{
              mt: "2px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            Insurance Rate Version
          </Typography>
        </Box>

        <IconButton onClick={onClose} disabled={loading} aria-label="關閉">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: "48px",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : errorMessage ? (
          <Alert severity="error">{errorMessage}</Alert>
        ) : version ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "18px",
            }}
          >
            <DetailField label="版本名稱">
              {version.version_name || "-"}
            </DetailField>

            <DetailField label="版本代碼">
              {version.version_code || "-"}
            </DetailField>

            <DetailField label="版本狀態">
              <StatusChip status={version.status} />
            </DetailField>

            <DetailField label="有效期間">
              {formatDate(version.effective_from, "-")}
              {" — "}
              {formatDate(version.effective_to)}
            </DetailField>

            <DetailField label="資料來源" fullWidth>
              <SourceContent version={version} />
            </DetailField>

            <DetailField label="建立時間">
              {formatDateTime(version.created_at)}
            </DetailField>

            <DetailField label="建立人員">
              {version.created_by_name || version.created_by || "-"}
            </DetailField>

            <DetailField label="發布時間">
              {formatDateTime(version.published_at)}
            </DetailField>

            <DetailField label="發布人員">
              {version.published_by_name || version.published_by || "-"}
            </DetailField>

            <DetailField label="備註" fullWidth>
              {version.remarks || "無"}
            </DetailField>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: "24px", py: "14px" }}>
        <Button onClick={onClose} disabled={loading} sx={{ color: "#475569" }}>
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteVersionDialog({
  open,
  version,
  deleting,
  errorMessage,
  onClose,
  onConfirm,
}) {
  const versionName =
    version?.version_name || version?.version_code || "此草稿";

  return (
    <Dialog
      open={open}
      onClose={deleting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>
        <Typography
          component="div"
          sx={{
            color: "#1f2937",
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          刪除保險費率草稿
        </Typography>

        <Typography
          component="div"
          sx={{
            mt: "2px",
            color: "#64748b",
            fontSize: "12px",
          }}
        >
          Delete Insurance Rate Draft
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {errorMessage ? (
          <Alert severity="error" sx={{ mb: "16px" }}>
            {errorMessage}
          </Alert>
        ) : null}

        <Typography
          sx={{
            color: "#334155",
            fontSize: "14px",
            lineHeight: 1.7,
          }}
        >
          確定要刪除保險費率草稿
          <Box
            component="span"
            sx={{
              mx: "4px",
              color: "#b91c1c",
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            「{versionName}」
          </Box>
          嗎？
        </Typography>

        <Alert severity="warning" sx={{ mt: "16px" }}>
          草稿刪除後無法復原。已發布或已失效的費率版本不能刪除。
        </Alert>
      </DialogContent>

      <DialogActions
        sx={{
          px: "24px",
          py: "14px",
        }}
      >
        <Button
          type="button"
          onClick={onClose}
          disabled={deleting}
          sx={{ color: "#64748b" }}
        >
          取消
        </Button>

        <Button
          type="button"
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={deleting}
          startIcon={
            deleting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <DeleteOutlineIcon />
            )
          }
        >
          {deleting ? "刪除中..." : "確認刪除"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PayrollInsuranceRatesPage() {
  const [versions, setVersions] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(null);
  const [editLoadingId, setEditLoadingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailVersion, setDetailVersion] = useState(null);
  const [detailErrorMessage, setDetailErrorMessage] = useState("");

  const loadVersions = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await getInsuranceRateVersions({
        search: filters.search,
        status: filters.status,
      });

      setVersions(Array.isArray(result) ? result : []);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "無法載入保險費率版本。"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handleSubmitFilters = (event) => {
    event.preventDefault();

    setFilters({
      search: searchInput.trim(),
      status: statusInput,
    });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setStatusInput("");
    setFilters({
      search: "",
      status: "",
    });
  };

  const handleOpenCreateForm = () => {
    setFormVersion(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setFormVersion(null);
  };

  const handleSaveVersion = async (payload) => {
    const versionId = formVersion?.insurance_rate_version_id;

    if (versionId) {
      const updatedVersion = await updateInsuranceRateVersion(
        versionId,
        payload,
      );

      handleCloseForm();
      setSuccessMessage(
        updatedVersion?.version_name
          ? `保險費率草稿「${updatedVersion.version_name}」已更新。`
          : "保險費率草稿已更新。",
      );
    } else {
      const createdVersion = await createInsuranceRateVersion(payload);

      handleCloseForm();
      setSuccessMessage(
        createdVersion?.version_name
          ? `保險費率草稿「${createdVersion.version_name}」已建立。`
          : "保險費率草稿已建立。",
      );
    }

    await loadVersions();
  };

  const handleEditVersion = async (version) => {
    if (version.status !== "草稿") {
      return;
    }

    const versionId = version.insurance_rate_version_id;

    setEditLoadingId(versionId);
    setErrorMessage("");

    try {
      const result = await getInsuranceRateVersion(versionId);

      if (!result) {
        throw new Error("找不到保險費率草稿資料。");
      }

      if (result.status !== "草稿") {
        throw new Error("只有草稿狀態的費率版本可以編輯。");
      }

      setFormVersion(result);
      setFormOpen(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "無法載入保險費率草稿。"));
    } finally {
      setEditLoadingId(null);
    }
  };

  const handleOpenDeleteDialog = (version) => {
    if (version.status !== "草稿") {
      return;
    }

    setDeleteTarget(version);
    setDeleteErrorMessage("");
  };

  const handleCloseDeleteDialog = () => {
    if (deleting) {
      return;
    }

    setDeleteTarget(null);
    setDeleteErrorMessage("");
  };

  const handleDeleteVersion = async () => {
    const versionId = deleteTarget?.insurance_rate_version_id;

    if (!versionId || deleteTarget.status !== "草稿") {
      setDeleteErrorMessage("只有草稿狀態的費率版本可以刪除。");
      return;
    }

    const deletedName =
      deleteTarget.version_name || deleteTarget.version_code || "";

    setDeleting(true);
    setDeleteErrorMessage("");
    setErrorMessage("");

    try {
      await deleteInsuranceRateVersion(versionId);

      setDeleteTarget(null);
      setSuccessMessage(
        deletedName
          ? `保險費率草稿「${deletedName}」已刪除。`
          : "保險費率草稿已刪除。",
      );

      await loadVersions();
    } catch (error) {
      setDeleteErrorMessage(getErrorMessage(error, "刪除保險費率草稿失敗。"));
    } finally {
      setDeleting(false);
    }
  };

  const handleViewVersion = async (version) => {
    const versionId = version.insurance_rate_version_id;

    setDetailOpen(true);
    setDetailLoading(true);
    setDetailVersion(null);
    setDetailErrorMessage("");

    try {
      const result = await getInsuranceRateVersion(versionId);

      setDetailVersion(result || version);
    } catch (error) {
      setDetailErrorMessage(
        getErrorMessage(error, "無法載入保險費率版本資料。"),
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    if (detailLoading) {
      return;
    }

    setDetailOpen(false);
    setDetailVersion(null);
    setDetailErrorMessage("");
  };

  const hasActiveFilters = filters.search !== "" || filters.status !== "";

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          alignItems: {
            xs: "stretch",
            sm: "center",
          },
          justifyContent: "space-between",
          gap: "12px",
          mb: "16px",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            sx={{
              color: "#111827",
              fontSize: {
                xs: "20px",
                sm: "23px",
              },
              fontWeight: 700,
            }}
          >
            保險費率
          </Typography>

          <Typography
            sx={{
              mt: "4px",
              color: "#64748b",
              fontSize: {
                xs: "13px",
                sm: "14px",
              },
            }}
          >
            Insurance Rates
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadVersions}
            disabled={loading}
            sx={{
              borderColor: "#cbd5e1",
              color: "#475569",
            }}
          >
            重新整理
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateForm}
            disabled={loading}
            sx={{
              bgcolor: "#1f9bd1",
              "&:hover": {
                bgcolor: "#168dc5",
              },
            }}
          >
            新增費率版本
          </Button>
        </Box>
      </Box>

      <Paper
        component="form"
        variant="outlined"
        onSubmit={handleSubmitFilters}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "minmax(220px, 1fr) " + "minmax(160px, 220px) auto",
          },
          alignItems: "center",
          gap: "10px",
          p: {
            xs: "12px",
            sm: "14px",
          },
          mb: "16px",
          borderColor: "#dfe4e8",
        }}
      >
        <TextField
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="搜尋版本代碼、名稱、來源或備註"
          size="small"
          disabled={loading}
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

        <FormControl size="small">
          <InputLabel id="insurance-rate-status-label">版本狀態</InputLabel>

          <Select
            labelId="insurance-rate-status-label"
            value={statusInput}
            label="版本狀態"
            onChange={(event) => setStatusInput(event.target.value)}
            disabled={loading}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value || "all"} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box
          sx={{
            display: "flex",
            gap: "8px",
          }}
        >
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: "#1f9bd1",
              "&:hover": {
                bgcolor: "#168dc5",
              },
            }}
          >
            搜尋
          </Button>

          <Button
            type="button"
            variant="text"
            onClick={handleClearFilters}
            disabled={loading && !searchInput && !statusInput}
            sx={{ color: "#64748b" }}
          >
            清除
          </Button>
        </Box>
      </Paper>

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: "16px" }}>
          {errorMessage}
        </Alert>
      ) : null}

      <Paper
        variant="outlined"
        sx={{
          borderColor: "#dfe4e8",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            px: {
              xs: "14px",
              sm: "18px",
            },
            py: "14px",
            borderBottom: "1px solid #e5e7eb",
            bgcolor: "#f8fafc",
          }}
        >
          <Typography
            sx={{
              color: "#334155",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            費率版本
          </Typography>

          {!loading ? (
            <Typography
              sx={{
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              共 {versions.length} 筆
            </Typography>
          ) : null}
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: "52px",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : versions.length === 0 ? (
          <Box
            sx={{
              px: "20px",
              py: "52px",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#475569",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              {hasActiveFilters
                ? "找不到符合條件的費率版本"
                : "尚未建立保險費率版本"}
            </Typography>

            <Typography
              sx={{
                mt: "6px",
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              {hasActiveFilters
                ? "請調整搜尋文字或版本狀態。"
                : "建立第一個草稿後，版本會顯示在此處。"}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer
              sx={{
                display: {
                  xs: "none",
                  md: "block",
                },
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>版本</TableCell>
                    <TableCell>有效期間</TableCell>
                    <TableCell>資料來源</TableCell>
                    <TableCell>狀態</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {versions.map((version) => {
                    const versionId = version.insurance_rate_version_id;

                    return (
                      <TableRow key={versionId} hover>
                        <TableCell>
                          <Typography
                            sx={{
                              color: "#1f2937",
                              fontSize: "14px",
                              fontWeight: 700,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {version.version_name ||
                              version.version_code ||
                              "-"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: "2px",
                              color: "#64748b",
                              fontSize: "12px",
                            }}
                          >
                            {version.version_code || "-"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography
                            sx={{
                              color: "#475569",
                              fontSize: "13px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatDate(version.effective_from, "-")}
                            {" — "}
                            {formatDate(version.effective_to)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <SourceContent version={version} />
                        </TableCell>

                        <TableCell>
                          <StatusChip status={version.status} />
                        </TableCell>

                        <TableCell align="right">
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                            }}
                          >
                            <Tooltip
                              title={getDetailActionLabel(version.status)}
                            >
                              <IconButton
                                onClick={() => handleViewVersion(version)}
                                aria-label={getDetailActionLabel(
                                  version.status,
                                )}
                                disabled={
                                  deleting || editLoadingId === versionId
                                }
                                sx={{
                                  color: "#475569",
                                }}
                              >
                                <VisibilityOutlinedIcon />
                              </IconButton>
                            </Tooltip>

                            {version.status === "草稿" ? (
                              <>
                                <Tooltip title="編輯草稿">
                                  <IconButton
                                    onClick={() => handleEditVersion(version)}
                                    aria-label="編輯草稿"
                                    disabled={
                                      deleting || editLoadingId === versionId
                                    }
                                    sx={{
                                      color: "#168dc5",
                                    }}
                                  >
                                    {editLoadingId === versionId ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <EditOutlinedIcon />
                                    )}
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="刪除草稿">
                                  <IconButton
                                    onClick={() =>
                                      handleOpenDeleteDialog(version)
                                    }
                                    aria-label="刪除草稿"
                                    disabled={
                                      deleting || editLoadingId === versionId
                                    }
                                    sx={{
                                      color: "#dc2626",
                                    }}
                                  >
                                    <DeleteOutlineIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : null}
                          </Box>
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
                p: {
                  xs: "12px",
                  sm: "16px",
                },
              }}
            >
              {versions.map((version) => (
                <VersionMobileCard
                  key={version.insurance_rate_version_id}
                  version={version}
                  onView={handleViewVersion}
                  onEdit={handleEditVersion}
                  onDelete={handleOpenDeleteDialog}
                  detailLoading={detailLoading && detailOpen}
                  editLoading={
                    editLoadingId === version.insurance_rate_version_id
                  }
                  deleteLoading={
                    deleting &&
                    deleteTarget?.insurance_rate_version_id ===
                      version.insurance_rate_version_id
                  }
                />
              ))}
            </Box>
          </>
        )}
      </Paper>

      <InsuranceRateVersionFormDialog
        open={formOpen}
        version={formVersion}
        onClose={handleCloseForm}
        onSubmit={handleSaveVersion}
      />

      <VersionDetailDialog
        open={detailOpen}
        version={detailVersion}
        loading={detailLoading}
        errorMessage={detailErrorMessage}
        onClose={handleCloseDetail}
      />

      <DeleteVersionDialog
        open={Boolean(deleteTarget)}
        version={deleteTarget}
        deleting={deleting}
        errorMessage={deleteErrorMessage}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteVersion}
      />

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={5000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMessage("")}
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
