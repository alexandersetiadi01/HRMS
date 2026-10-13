import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";

import {
  getPayrollPermissionPosition,
  getPayrollPermissionPositions,
  getPayrollPermissions,
  updatePayrollPermissionPosition,
} from "../../API/payroll";
import AppSnackbar from "../../Components/AppSnackbar";

const PERMISSION_GROUP_ORDER = [
  "基本權限",
  "薪資設定",
  "薪資作業",
  "報表與查詢",
  "稅務與保險",
  "權限管理",
  "其他",
];

const PERMISSION_GROUP_MAP = {
  payroll_view: "基本權限",

  payroll_settings_manage: "薪資設定",

  payroll_calculate: "薪資作業",

  payroll_close: "薪資作業",

  payroll_approve: "薪資作業",

  payroll_mark_paid: "薪資作業",

  payroll_reports_view: "報表與查詢",

  payroll_tax_insurance_manage: "稅務與保險",

  payroll_permissions_manage: "權限管理",
};

const PERMISSION_DESCRIPTION_MAP = {
  payroll_view: "檢視薪資批次、薪資結果與薪資明細。",

  payroll_settings_manage: "管理薪資範圍、計薪週期、薪資科目、銀行與計算規則。",

  payroll_calculate: "建立薪資批次、執行計算及修改尚未核准的薪資結果。",

  payroll_close: "將已核准的薪資批次關帳。",

  payroll_approve: "核准薪資批次及員工薪資結果。",

  payroll_mark_paid: "將員工薪資結果標記為已發放。",

  payroll_reports_view: "檢視及匯出人資薪資報表。",

  payroll_tax_insurance_manage:
    "管理投保單位、投保身分、保險費率、所得稅及員工投保資料。",

  payroll_permissions_manage: "查看及修改各職位的薪資模組權限。",
};

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const candidates = [
      payload.rows,
      payload.items,
      payload.permissions,
      payload.positions,
      payload.data,
    ];

    const matched = candidates.find(Array.isArray);

    if (matched) {
      return matched;
    }
  }

  return [];
}

function normalizePermission(permission) {
  const permissionCode = String(
    permission?.permission_code || permission?.code || permission?.id || "",
  ).trim();

  const permissionName = String(
    permission?.permission_name ||
      permission?.name ||
      permission?.label ||
      permissionCode,
  ).trim();

  const description = String(
    permission?.description || PERMISSION_DESCRIPTION_MAP[permissionCode] || "",
  ).trim();

  const status = String(permission?.status || "啟用").trim();

  return {
    ...permission,
    permission_code: permissionCode,
    permission_name: permissionName,
    description,
    status,
    group: PERMISSION_GROUP_MAP[permissionCode] || "其他",
  };
}

function normalizePosition(position) {
  const positionId = Number(position?.position_id || position?.id || 0);

  const positionCode = String(
    position?.position_code || position?.code || "",
  ).trim();

  const positionName = String(
    position?.position_name ||
      position?.name ||
      position?.label ||
      positionCode,
  ).trim();

  const permissionCodes = Array.isArray(position?.permission_codes)
    ? position.permission_codes
    : [];

  return {
    ...position,
    position_id:
      Number.isInteger(positionId) && positionId > 0 ? positionId : 0,
    position_code: positionCode,
    position_name: positionName,
    permission_codes: permissionCodes
      .map((code) => String(code || "").trim())
      .filter(Boolean),
  };
}

function normalizePositionDetail(detail, fallbackPosition) {
  const normalizedBase = normalizePosition({
    ...fallbackPosition,
    ...(detail?.position || detail || {}),
    permission_codes:
      detail?.permission_codes || fallbackPosition?.permission_codes || [],
  });

  const nestedPermissions = Array.isArray(detail?.permissions)
    ? detail.permissions
    : [];

  const nestedCodes = nestedPermissions
    .filter((permission) => {
      return (
        permission?.granted === true ||
        permission?.granted === 1 ||
        permission?.granted === "1" ||
        permission?.enabled === true ||
        permission?.enabled === 1 ||
        permission?.enabled === "1"
      );
    })
    .map((permission) =>
      String(permission?.permission_code || permission?.code || "").trim(),
    )
    .filter(Boolean);

  const permissionCodes =
    normalizedBase.permission_codes.length > 0
      ? normalizedBase.permission_codes
      : nestedCodes;

  return {
    ...normalizedBase,
    permission_codes: Array.from(new Set(permissionCodes)),
  };
}

function PermissionItem({ permission, checked, disabled, onChange }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        px: {
          xs: "12px",
          sm: "16px",
        },
        py: "13px",
        borderBottom: "1px solid #edf0f3",
        "&:last-of-type": {
          borderBottom: 0,
        },
      }}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={(event) =>
          onChange(permission.permission_code, event.target.checked)
        }
        sx={{
          mt: "-8px",
          ml: "-8px",
        }}
        inputProps={{
          "aria-label": permission.permission_name,
        }}
      />

      <Box
        sx={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={{
            xs: 0.5,
            sm: 1,
          }}
          alignItems={{
            xs: "flex-start",
            sm: "center",
          }}
        >
          <Typography
            sx={{
              color: "#334155",
              fontSize: {
                xs: "14px",
                sm: "15px",
              },
              fontWeight: 700,
              lineHeight: 1.45,
            }}
          >
            {permission.permission_name}
          </Typography>

          <Chip
            label={permission.permission_code}
            size="small"
            variant="outlined"
            sx={{
              maxWidth: "100%",
              height: "22px",
              color: "#64748b",
              borderColor: "#d8e0e7",
              fontSize: "11px",
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
          />
        </Stack>

        {permission.description ? (
          <Typography
            sx={{
              mt: "5px",
              color: "#64748b",
              fontSize: {
                xs: "12px",
                sm: "13px",
              },
              lineHeight: 1.6,
            }}
          >
            {permission.description}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

export default function PayrollPermissionsPage() {
  const [permissions, setPermissions] = useState([]);

  const [positions, setPositions] = useState([]);

  const [selectedPositionId, setSelectedPositionId] = useState("");

  const selectedPositionIdRef = useRef("");

  const [selectedPosition, setSelectedPosition] = useState(null);

  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState([]);

  const [initialPermissionCodes, setInitialPermissionCodes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [positionLoading, setPositionLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const groupedPermissions = useMemo(() => {
    const groups = {};

    permissions.forEach((permission) => {
      if (permission.status !== "啟用") {
        return;
      }

      if (!groups[permission.group]) {
        groups[permission.group] = [];
      }

      groups[permission.group].push(permission);
    });

    return PERMISSION_GROUP_ORDER.filter(
      (groupName) => groups[groupName]?.length > 0,
    ).map((groupName) => ({
      groupName,
      permissions: groups[groupName],
    }));
  }, [permissions]);

  const selectedCodeSet = useMemo(
    () => new Set(selectedPermissionCodes),
    [selectedPermissionCodes],
  );

  const changed = useMemo(() => {
    const current = [...selectedPermissionCodes].sort();

    const initial = [...initialPermissionCodes].sort();

    return JSON.stringify(current) !== JSON.stringify(initial);
  }, [selectedPermissionCodes, initialPermissionCodes]);

  const loadPositionDetail = useCallback(
    async (positionId, availablePositions = []) => {
      const normalizedId = Number(positionId || 0);

      if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
        setSelectedPosition(null);
        setSelectedPermissionCodes([]);
        setInitialPermissionCodes([]);
        return;
      }

      setPositionLoading(true);
      setError("");
      setSuccess("");

      try {
        const detail = await getPayrollPermissionPosition(normalizedId);

        const fallbackPosition =
          availablePositions.find(
            (position) => Number(position.position_id) === normalizedId,
          ) || null;

        const normalizedDetail = normalizePositionDetail(
          detail,
          fallbackPosition,
        );

        const permissionCodes = Array.from(
          new Set(normalizedDetail.permission_codes),
        );

        setSelectedPosition(normalizedDetail);

        setSelectedPermissionCodes(permissionCodes);

        setInitialPermissionCodes(permissionCodes);
      } catch (loadError) {
        setError(getErrorMessage(loadError, "載入職位權限失敗。"));
      } finally {
        setPositionLoading(false);
      }
    },
    [],
  );

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const [permissionResponse, positionResponse] = await Promise.all([
        getPayrollPermissions(),
        getPayrollPermissionPositions(),
      ]);

      const normalizedPermissions = normalizeListPayload(permissionResponse)
        .map(normalizePermission)
        .filter((permission) => permission.permission_code);

      const normalizedPositions = normalizeListPayload(positionResponse)
        .map(normalizePosition)
        .filter((position) => position.position_id > 0);

      setPermissions(normalizedPermissions);

      setPositions(normalizedPositions);

      const currentPositionId = selectedPositionIdRef.current;

      const nextPositionId = normalizedPositions.some(
        (position) =>
          String(position.position_id) === String(currentPositionId),
      )
        ? currentPositionId
        : String(normalizedPositions[0]?.position_id || "");

      selectedPositionIdRef.current = nextPositionId;

      setSelectedPositionId(nextPositionId);

      if (nextPositionId) {
        await loadPositionDetail(nextPositionId, normalizedPositions);
      } else {
        setSelectedPosition(null);
        setSelectedPermissionCodes([]);
        setInitialPermissionCodes([]);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "載入薪資權限設定失敗。"));
    } finally {
      setLoading(false);
    }
  }, [loadPositionDetail]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  async function handlePositionSelect(positionId) {
    if (String(positionId) === String(selectedPositionId)) {
      return;
    }

    if (
      changed &&
      !window.confirm("目前有尚未儲存的權限變更，確定要切換職位嗎？")
    ) {
      return;
    }

    selectedPositionIdRef.current = String(positionId);

    setSelectedPositionId(String(positionId));

    await loadPositionDetail(positionId, positions);
  }

  function handlePermissionChange(permissionCode, checked) {
    setSuccess("");
    setError("");

    setSelectedPermissionCodes((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(permissionCode);
      } else {
        next.delete(permissionCode);
      }

      return Array.from(next);
    });
  }

  function handleSelectAll() {
    const allCodes = permissions
      .filter((permission) => permission.status === "啟用")
      .map((permission) => permission.permission_code);

    setSelectedPermissionCodes(Array.from(new Set(allCodes)));

    setSuccess("");
    setError("");
  }

  function handleClearAll() {
    setSelectedPermissionCodes([]);

    setSuccess("");
    setError("");
  }

  function handleReset() {
    setSelectedPermissionCodes([...initialPermissionCodes]);

    setSuccess("");
    setError("");
  }

  async function handleSave() {
    if (!selectedPositionId || !changed) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updatePayrollPermissionPosition(
        selectedPositionId,
        selectedPermissionCodes,
      );

      const savedCodes = Array.from(new Set(selectedPermissionCodes));

      setInitialPermissionCodes(savedCodes);

      setSelectedPosition((current) => ({
        ...(current || {}),
        permission_codes: savedCodes,
      }));

      setPositions((current) =>
        current.map((position) =>
          String(position.position_id) === String(selectedPositionId)
            ? {
                ...position,
                permission_codes: savedCodes,
              }
            : position,
        ),
      );

      setSuccess("職位薪資權限已儲存。");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "儲存職位薪資權限失敗。"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        alignItems={{
          xs: "stretch",
          sm: "center",
        }}
        justifyContent="space-between"
        sx={{
          mb: "20px",
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              color: "#1e293b",
              fontSize: {
                xs: "22px",
                sm: "26px",
              },
              fontWeight: 800,
              lineHeight: 1.35,
            }}
          >
            權限設定
          </Typography>

          <Typography
            sx={{
              mt: "5px",
              color: "#64748b",
              fontSize: {
                xs: "13px",
                sm: "14px",
              },
              lineHeight: 1.6,
            }}
          >
            設定各職位可使用的薪資管理功能。
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          disabled={loading || positionLoading || saving}
          onClick={loadPage}
          sx={{
            alignSelf: {
              xs: "flex-start",
              sm: "center",
            },
          }}
        >
          重新整理
        </Button>
      </Stack>

      {error ? (
        <Alert
          severity="error"
          sx={{ mb: "16px" }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      ) : null}

      <AppSnackbar
        open={Boolean(success)}
        severity="success"
        message={success}
        onClose={() => setSuccess("")}
      />

      {loading ? (
        <Paper
          variant="outlined"
          sx={{
            minHeight: "320px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderColor: "#e2e8f0",
          }}
        >
          <Stack spacing={1.5} alignItems="center">
            <CircularProgress size={30} />

            <Typography
              sx={{
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              載入權限設定中…
            </Typography>
          </Stack>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "260px minmax(0, 1fr)",
            },
            gap: "18px",
            alignItems: "start",
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              overflow: "hidden",
              borderColor: "#e2e8f0",
            }}
          >
            <Box
              sx={{
                px: "16px",
                py: "14px",
                bgcolor: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  color: "#334155",
                  fontSize: "14px",
                  fontWeight: 800,
                }}
              >
                職位 / Job Position
              </Typography>
            </Box>

            {positions.length === 0 ? (
              <Box
                sx={{
                  px: "16px",
                  py: "24px",
                }}
              >
                <Typography
                  sx={{
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  目前沒有可設定的職位。
                </Typography>
              </Box>
            ) : (
              positions.map((position) => {
                const active =
                  String(selectedPositionId) === String(position.position_id);

                return (
                  <Box
                    key={position.position_id}
                    component="button"
                    type="button"
                    onClick={() => handlePositionSelect(position.position_id)}
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      px: "16px",
                      py: "13px",
                      border: 0,
                      borderBottom: "1px solid #edf0f3",
                      bgcolor: active ? "#eaf7fd" : "#ffffff",
                      color: active ? "#168dc5" : "#475569",
                      textAlign: "left",
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: active ? "#eaf7fd" : "#f8fafc",
                      },
                      "&:last-of-type": {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <SecurityOutlinedIcon
                      sx={{
                        fontSize: "19px",
                      }}
                    />

                    <Box
                      sx={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: active ? 800 : 600,
                          lineHeight: 1.4,
                        }}
                      >
                        {position.position_name}
                      </Typography>

                      <Typography
                        sx={{
                          mt: "2px",
                          color: "#94a3b8",
                          fontSize: "11px",
                          lineHeight: 1.4,
                          wordBreak: "break-all",
                        }}
                      >
                        {position.position_code}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              minWidth: 0,
              overflow: "hidden",
              borderColor: "#e2e8f0",
            }}
          >
            {!selectedPositionId ? (
              <Box
                sx={{
                  minHeight: "320px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: "20px",
                }}
              >
                <Typography
                  sx={{
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  請先選擇職位。
                </Typography>
              </Box>
            ) : positionLoading ? (
              <Box
                sx={{
                  minHeight: "320px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress size={30} />
              </Box>
            ) : (
              <>
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
                    px: {
                      xs: "14px",
                      sm: "18px",
                    },
                    py: "15px",
                    bgcolor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Typography
                        sx={{
                          color: "#1e293b",
                          fontSize: {
                            xs: "16px",
                            sm: "17px",
                          },
                          fontWeight: 800,
                        }}
                      >
                        {selectedPosition?.position_name}
                      </Typography>

                      {selectedPosition?.position_code ? (
                        <Chip
                          label={selectedPosition.position_code}
                          size="small"
                          variant="outlined"
                        />
                      ) : null}
                    </Stack>

                    <Typography
                      sx={{
                        mt: "4px",
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      已選擇 {selectedPermissionCodes.length} 項權限
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={saving}
                      onClick={handleSelectAll}
                    >
                      全選
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                      disabled={saving}
                      onClick={handleClearAll}
                    >
                      清除
                    </Button>
                  </Stack>
                </Box>

                {groupedPermissions.length === 0 ? (
                  <Box
                    sx={{
                      px: "18px",
                      py: "32px",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#64748b",
                        fontSize: "14px",
                        textAlign: "center",
                      }}
                    >
                      目前沒有可設定的薪資權限。
                    </Typography>
                  </Box>
                ) : (
                  groupedPermissions.map(
                    ({ groupName, permissions: groupItems }) => (
                      <Box key={groupName}>
                        <Box
                          sx={{
                            px: {
                              xs: "14px",
                              sm: "18px",
                            },
                            py: "10px",
                            bgcolor: "#fbfdff",
                            borderTop: "1px solid #edf0f3",
                            borderBottom: "1px solid #edf0f3",
                          }}
                        >
                          <Typography
                            sx={{
                              color: "#475569",
                              fontSize: "13px",
                              fontWeight: 800,
                            }}
                          >
                            {groupName}
                          </Typography>
                        </Box>

                        {groupItems.map((permission) => (
                          <PermissionItem
                            key={permission.permission_code}
                            permission={permission}
                            checked={selectedCodeSet.has(
                              permission.permission_code,
                            )}
                            disabled={saving}
                            onChange={handlePermissionChange}
                          />
                        ))}
                      </Box>
                    ),
                  )
                )}

                <Divider />

                <Stack
                  direction={{
                    xs: "column-reverse",
                    sm: "row",
                  }}
                  spacing={1.5}
                  justifyContent="flex-end"
                  sx={{
                    px: {
                      xs: "14px",
                      sm: "18px",
                    },
                    py: "15px",
                    bgcolor: "#ffffff",
                  }}
                >
                  <Button
                    variant="outlined"
                    disabled={!changed || saving}
                    onClick={handleReset}
                  >
                    還原變更
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={
                      saving ? (
                        <CircularProgress size={17} color="inherit" />
                      ) : (
                        <SaveOutlinedIcon />
                      )
                    }
                    disabled={!changed || saving}
                    onClick={handleSave}
                  >
                    {saving ? "儲存中…" : "儲存權限"}
                  </Button>
                </Stack>
              </>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
