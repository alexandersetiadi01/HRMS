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
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import {
  getInsuranceGradeVersion,
  getInsuranceGradeVersions,
  publishInsuranceGradeVersion,
} from "../../API/payroll";
import InsuranceGradeVersionFormDialog from "./InsuranceGradeVersionFormDialog";

const INSURANCE_TYPES = [
  {
    value: "labor",
    label: "勞保",
    fullLabel: "勞工保險",
  },
  {
    value: "health",
    label: "健保",
    fullLabel: "全民健康保險",
  },
  {
    value: "pension",
    label: "勞退",
    fullLabel: "勞工退休金",
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

function formatDate(value) {
  return value ? String(value).replaceAll("-", "/") : "無期限";
}

function formatAmount(value, emptyText = "-") {
  if (value === null || value === undefined || value === "") {
    return emptyText;
  }

  const amount = Number(value);

  return Number.isFinite(amount)
    ? `NT$ ${amount.toLocaleString("zh-TW", {
        maximumFractionDigits: 2,
      })}`
    : emptyText;
}

function getGradeCount(version, type) {
  const count = version?.[`${type}_grade_count`];

  if (count !== null && count !== undefined && count !== "") {
    return Number(count) || 0;
  }

  return Number(version?.grade_counts?.[type]) || 0;
}

function StatusChip({ status }) {
  const settings = {
    已發布: {
      color: "success",
      variant: "filled",
    },
    草稿: {
      color: "warning",
      variant: "outlined",
    },
    已失效: {
      color: "default",
      variant: "outlined",
    },
  };

  const current = settings[status] || settings.已失效;

  return (
    <Chip
      label={status || "未設定"}
      size="small"
      color={current.color}
      variant={current.variant}
    />
  );
}

function SummaryCard({ label, value, active = false }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: "12px",
          sm: "14px",
        },
        borderColor: active ? "#86b7a3" : "#dfe4e8",
        bgcolor: active ? "#f0f9f5" : "#ffffff",
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
          mt: "3px",
          color: "#1f2937",
          fontSize: {
            xs: "18px",
            sm: "20px",
          },
          fontWeight: 700,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function DetailField({ label, children }) {
  return (
    <Box>
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
          fontSize: "13px",
          fontWeight: 600,
          overflowWrap: "anywhere",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

function GradeMobileCard({ grade }) {
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
        <DetailField label="投保級距">
          <Box
            component="span"
            sx={{
              color: "#1f2937",
              fontSize: {
                xs: "17px",
                sm: "18px",
              },
            }}
          >
            第 {grade.grade_number} 級
          </Box>
        </DetailField>

        <Box sx={{ textAlign: "right" }}>
          <Typography
            sx={{
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            月投保金額
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: "#166534",
              fontSize: {
                xs: "16px",
                sm: "17px",
              },
              fontWeight: 700,
            }}
          >
            {formatAmount(grade.monthly_insured_amount)}
          </Typography>
        </Box>
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
        <DetailField label="薪資下限">
          {formatAmount(grade.salary_lower_bound, "未設下限")}
        </DetailField>

        <DetailField label="薪資上限">
          {formatAmount(grade.salary_upper_bound, "未設上限")}
        </DetailField>
      </Box>

      {grade.remarks ? (
        <Box
          sx={{
            mt: "14px",
            pt: "12px",
            borderTop: "1px solid #eef2f6",
          }}
        >
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
              color: "#475569",
              fontSize: "13px",
              lineHeight: 1.6,
              overflowWrap: "anywhere",
            }}
          >
            {grade.remarks}
          </Typography>
        </Box>
      ) : null}
    </Paper>
  );
}

export default function PayrollInsuranceGradesPage() {
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [insuranceType, setInsuranceType] = useState("labor");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const loadVersions = useCallback(
    async (options = {}) => {
      const preferredVersionId = String(options.preferredVersionId || "");

      const nextSearch =
        options.search !== undefined ? options.search : appliedSearch;

      const nextStatus =
        options.status !== undefined ? options.status : statusFilter;

      setListLoading(true);
      setError("");

      try {
        const data = await getInsuranceGradeVersions({
          search: nextSearch || undefined,
          status: nextStatus === "全部" ? undefined : nextStatus,
        });

        const nextVersions = Array.isArray(data) ? data : [];

        setVersions(nextVersions);

        setSelectedVersionId((currentId) => {
          const preferredExists = nextVersions.some(
            (version) =>
              String(version.insurance_grade_version_id) === preferredVersionId,
          );

          const currentExists = nextVersions.some(
            (version) =>
              String(version.insurance_grade_version_id) === String(currentId),
          );

          if (preferredExists) {
            return preferredVersionId;
          }

          if (currentExists) {
            return currentId;
          }

          return nextVersions[0]
            ? String(nextVersions[0].insurance_grade_version_id)
            : "";
        });

        if (nextVersions.length === 0) {
          setSelectedVersion(null);
        }
      } catch (requestError) {
        setVersions([]);
        setSelectedVersionId("");
        setSelectedVersion(null);
        setError(getErrorMessage(requestError, "讀取投保金額分級表版本失敗。"));
      } finally {
        setListLoading(false);
      }
    },
    [appliedSearch, statusFilter],
  );

  const loadVersionDetail = useCallback(async (versionId) => {
    if (!versionId) {
      setSelectedVersion(null);
      return;
    }

    setDetailLoading(true);
    setError("");

    try {
      const data = await getInsuranceGradeVersion(versionId);

      setSelectedVersion(data || null);
    } catch (requestError) {
      setSelectedVersion(null);

      setError(getErrorMessage(requestError, "讀取投保金額分級表內容失敗。"));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  useEffect(() => {
    loadVersionDetail(selectedVersionId);
  }, [loadVersionDetail, selectedVersionId]);

  const activeGrades = useMemo(() => {
    const grades = selectedVersion?.grades?.[insuranceType];

    return Array.isArray(grades) ? grades : [];
  }, [insuranceType, selectedVersion]);

  const totalGradeCount = useMemo(() => {
    if (
      selectedVersion?.total_grade_count !== null &&
      selectedVersion?.total_grade_count !== undefined
    ) {
      return Number(selectedVersion.total_grade_count) || 0;
    }

    return INSURANCE_TYPES.reduce(
      (total, type) => total + getGradeCount(selectedVersion, type.value),
      0,
    );
  }, [selectedVersion]);

  function handleSearch(event) {
    event.preventDefault();

    setAppliedSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setAppliedSearch("");
  }

  async function handleRefresh() {
    await loadVersions();

    if (selectedVersionId) {
      await loadVersionDetail(selectedVersionId);
    }
  }

  function handleCreate() {
    setEditingVersion(null);
    setFormDialogOpen(true);
  }

  function handleEdit() {
    if (selectedVersion?.status !== "草稿") {
      return;
    }

    setEditingVersion(selectedVersion);
    setFormDialogOpen(true);
  }

  async function handleSaved(message, savedVersion) {
    const savedVersionId = String(
      savedVersion?.insurance_grade_version_id || selectedVersionId || "",
    );

    setFormDialogOpen(false);
    setEditingVersion(null);
    setSuccessMessage(message);

    /*
     * Remove filters so the created or edited draft
     * remains visible and selected.
     */
    setSearchInput("");
    setAppliedSearch("");
    setStatusFilter("全部");

    if (savedVersion) {
      setSelectedVersion(savedVersion);
    }

    await loadVersions({
      preferredVersionId: savedVersionId,
      search: "",
      status: "全部",
    });

    if (savedVersionId) {
      await loadVersionDetail(savedVersionId);
    }
  }

  async function handlePublish() {
    if (selectedVersion?.status !== "草稿" || !selectedVersionId) {
      return;
    }

    setPublishing(true);
    setError("");

    try {
      const publishedVersion =
        await publishInsuranceGradeVersion(selectedVersionId);

      const publishedVersionId = String(
        publishedVersion?.insurance_grade_version_id || selectedVersionId,
      );

      setPublishDialogOpen(false);
      setSuccessMessage("投保金額分級表版本已發布。");

      /*
       * The published version could disappear when
       * the page is currently filtered to drafts.
       */
      setSearchInput("");
      setAppliedSearch("");
      setStatusFilter("全部");

      if (publishedVersion) {
        setSelectedVersion(publishedVersion);
      }

      await loadVersions({
        preferredVersionId: publishedVersionId,
        search: "",
        status: "全部",
      });

      await loadVersionDetail(publishedVersionId);
    } catch (requestError) {
      setPublishDialogOpen(false);
      setError(getErrorMessage(requestError, "發布投保金額分級表版本失敗。"));
    } finally {
      setPublishing(false);
    }
  }

  const currentType =
    INSURANCE_TYPES.find((type) => type.value === insuranceType) ||
    INSURANCE_TYPES[0];

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
            投保金額分級表
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#7b8794",
              fontSize: "13px",
            }}
          >
            查詢勞保、健保與勞退的版本及投保薪資級距
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: {
              xs: "flex-end",
              sm: "initial",
            },
            gap: "8px",
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            新增版本
          </Button>

          <Tooltip title="重新整理">
            <span>
              <IconButton
                onClick={handleRefresh}
                disabled={listLoading || detailLoading}
                aria-label="重新整理投保金額分級表"
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
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
          label="搜尋版本"
          placeholder="版本代碼、名稱或來源"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small">
          <InputLabel id="insurance-grade-status-filter-label">狀態</InputLabel>

          <Select
            labelId="insurance-grade-status-filter-label"
            label="狀態"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {["全部", "草稿", "已發布", "已失效"].map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
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
            <Button type="button" onClick={clearSearch}>
              清除
            </Button>
          ) : null}
        </Box>
      </Box>

      {listLoading ? (
        <Box
          sx={{
            minHeight: "220px",
            display: "grid",
            placeItems: "center",
          }}
        >
          <CircularProgress size={32} />
        </Box>
      ) : versions.length === 0 ? (
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
            {appliedSearch || statusFilter !== "全部"
              ? "沒有符合條件的投保金額分級表版本。"
              : "尚未建立投保金額分級表版本。"}
          </Typography>
        </Paper>
      ) : (
        <>
          <FormControl fullWidth size="small" sx={{ mb: "16px" }}>
            <InputLabel id="insurance-grade-version-select-label">
              分級表版本
            </InputLabel>

            <Select
              labelId="insurance-grade-version-select-label"
              label="分級表版本"
              value={selectedVersionId}
              onChange={(event) =>
                setSelectedVersionId(String(event.target.value))
              }
            >
              {versions.map((version) => (
                <MenuItem
                  key={version.insurance_grade_version_id}
                  value={String(version.insurance_grade_version_id)}
                >
                  {version.version_name || version.version_code}
                  {" — "}
                  {formatDate(version.effective_from)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {detailLoading ? (
            <Box
              sx={{
                minHeight: "220px",
                display: "grid",
                placeItems: "center",
              }}
            >
              <CircularProgress size={32} />
            </Box>
          ) : selectedVersion ? (
            <>
              <Paper
                variant="outlined"
                sx={{
                  p: {
                    xs: "14px",
                    sm: "18px",
                  },
                  mb: "16px",
                  borderColor: "#dfe4e8",
                }}
              >
                <Box
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
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: "#1f2937",
                        fontSize: {
                          xs: "16px",
                          sm: "18px",
                        },
                        fontWeight: 700,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {selectedVersion.version_name || "-"}
                    </Typography>

                    <Typography
                      sx={{
                        mt: "3px",
                        color: "#64748b",
                        fontSize: "12px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      版本代碼：
                      {selectedVersion.version_code || "-"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <StatusChip status={selectedVersion.status} />

                    {selectedVersion.status === "草稿" ? (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditOutlinedIcon />}
                          onClick={handleEdit}
                        >
                          編輯草稿
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<PublishOutlinedIcon />}
                          onClick={() => setPublishDialogOpen(true)}
                        >
                          發布版本
                        </Button>
                      </>
                    ) : null}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      md: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: {
                      xs: "10px",
                      sm: "14px",
                    },
                    mt: "16px",
                    pt: "14px",
                    borderTop: "1px solid #eef2f6",
                  }}
                >
                  <DetailField label="有效期間">
                    {formatDate(selectedVersion.effective_from)}
                    {" 至 "}
                    {formatDate(selectedVersion.effective_to)}
                  </DetailField>

                  <DetailField label="資料來源">
                    {selectedVersion.source_name || "未設定"}
                  </DetailField>

                  <DetailField label="發布時間">
                    {selectedVersion.published_at || "尚未發布"}
                  </DetailField>
                </Box>

                {selectedVersion.remarks ? (
                  <Alert severity="info" sx={{ mt: "14px" }}>
                    {selectedVersion.remarks}
                  </Alert>
                ) : null}
              </Paper>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: {
                    xs: "8px",
                    sm: "12px",
                  },
                  mb: "16px",
                }}
              >
                {INSURANCE_TYPES.map((type) => (
                  <SummaryCard
                    key={type.value}
                    label={`${type.label}級數`}
                    value={`${getGradeCount(selectedVersion, type.value)} 級`}
                    active={insuranceType === type.value}
                  />
                ))}

                <SummaryCard label="全部級數" value={`${totalGradeCount} 級`} />
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  borderColor: "#dfe4e8",
                  overflow: "hidden",
                }}
              >
                <Tabs
                  value={insuranceType}
                  onChange={(event, nextType) => setInsuranceType(nextType)}
                  variant="fullWidth"
                  aria-label="投保金額分級表類型"
                  sx={{
                    borderBottom: "1px solid #dfe4e8",
                    "& .MuiTab-root": {
                      minWidth: 0,
                      px: {
                        xs: "6px",
                        sm: "14px",
                      },
                      fontSize: {
                        xs: "13px",
                        sm: "14px",
                      },
                      fontWeight: 700,
                    },
                  }}
                >
                  {INSURANCE_TYPES.map((type) => (
                    <Tab
                      key={type.value}
                      value={type.value}
                      label={`${type.label} (${getGradeCount(
                        selectedVersion,
                        type.value,
                      )})`}
                    />
                  ))}
                </Tabs>

                <Box
                  sx={{
                    p: {
                      xs: "12px",
                      sm: "16px",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      mb: "12px",
                      color: "#475569",
                      fontSize: "13px",
                    }}
                  >
                    {currentType.fullLabel}共 {activeGrades.length} 個級距
                  </Typography>

                  {activeGrades.length === 0 ? (
                    <Box
                      sx={{
                        p: "28px 16px",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "4px",
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        此版本尚未設定
                        {currentType.label}
                        投保級距。
                      </Typography>
                    </Box>
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
                              sx={{
                                bgcolor: "#f8fafc",
                              }}
                            >
                              <TableCell
                                sx={{
                                  width: "13%",
                                }}
                              >
                                級距
                              </TableCell>

                              <TableCell
                                sx={{
                                  width: "22%",
                                }}
                              >
                                薪資下限
                              </TableCell>

                              <TableCell
                                sx={{
                                  width: "22%",
                                }}
                              >
                                薪資上限
                              </TableCell>

                              <TableCell
                                sx={{
                                  width: "25%",
                                }}
                              >
                                月投保金額
                              </TableCell>

                              <TableCell
                                sx={{
                                  width: "18%",
                                }}
                              >
                                備註
                              </TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {activeGrades.map((grade) => (
                              <TableRow
                                key={grade.insurance_salary_grade_id}
                                hover
                              >
                                <TableCell>
                                  <Typography
                                    sx={{
                                      color: "#1f2937",
                                      fontSize: "13px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    第 {grade.grade_number} 級
                                  </Typography>
                                </TableCell>

                                <TableCell>
                                  {formatAmount(
                                    grade.salary_lower_bound,
                                    "未設下限",
                                  )}
                                </TableCell>

                                <TableCell>
                                  {formatAmount(
                                    grade.salary_upper_bound,
                                    "未設上限",
                                  )}
                                </TableCell>

                                <TableCell>
                                  <Typography
                                    sx={{
                                      color: "#166534",
                                      fontSize: "13px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {formatAmount(grade.monthly_insured_amount)}
                                  </Typography>
                                </TableCell>

                                <TableCell>{grade.remarks || "-"}</TableCell>
                              </TableRow>
                            ))}
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
                        {activeGrades.map((grade) => (
                          <GradeMobileCard
                            key={grade.insurance_salary_grade_id}
                            grade={grade}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              </Paper>
            </>
          ) : (
            <Alert severity="warning">無法讀取所選的投保金額分級表版本。</Alert>
          )}
        </>
      )}

      <InsuranceGradeVersionFormDialog
        open={formDialogOpen}
        version={editingVersion}
        onClose={() => {
          setFormDialogOpen(false);
          setEditingVersion(null);
        }}
        onSaved={handleSaved}
      />

      <Dialog
        open={publishDialogOpen}
        onClose={publishing ? undefined : () => setPublishDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>確認發布投保金額分級表</DialogTitle>

        <DialogContent>
          <DialogContentText>
            確定要發布「
            {selectedVersion?.version_name ||
              selectedVersion?.version_code ||
              "-"}
            」嗎？發布後此版本不能再編輯，系統也會依生效日關閉先前的已發布版本。
          </DialogContentText>

          <Alert severity="warning" sx={{ mt: "16px" }}>
            生效日：
            {formatDate(selectedVersion?.effective_from)}
            。如果有效期間與其他已發布版本衝突，系統會取消發布且不會變更任何版本。
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setPublishDialogOpen(false)}
            disabled={publishing}
          >
            取消
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? "發布中…" : "確認發布"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage("")}
        message={successMessage}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      />
    </Box>
  );
}
