import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import {
  apiAttendancePermissionSetting,
  apiAttendancePermissionSettings,
  apiUpdateAttendancePermissionSetting,
} from "../../../../API/attendance";
import SuccessDialog from "../../../../Components/SuccessDialog";

function unwrapData(response, fallback = {}) {
  const payload = response?.data?.data ?? response?.data ?? response;

  if (payload === undefined || payload === null) {
    return fallback;
  }

  return payload;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function positionLabel(position = {}) {
  const name = String(position?.position_name || "").trim();
  const code = String(position?.position_code || "").trim();

  if (!name) return code;

  return code && code !== name
    ? `${name} - ${code}`
    : name;
}

export default function PermissionSettingsTab() {
  const [positions, setPositions] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [positionId, setPositionId] = useState("");
  const [permissionCodes, setPermissionCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [positionLoading, setPositionLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const response = await apiAttendancePermissionSettings();
        const data = unwrapData(response, {});

        if (!active) return;

        const nextPositions = Array.isArray(data?.positions)
          ? data.positions
          : [];
        const nextPermissions = Array.isArray(data?.permissions)
          ? data.permissions
          : [];

        setPositions(nextPositions);
        setPermissions(nextPermissions);

        if (nextPositions.length > 0) {
          setPositionId(String(nextPositions[0].position_id));
        } else {
          setPositionId("");
        }
      } catch (error) {
        if (!active) return;

        setPositions([]);
        setPermissions([]);
        setPositionId("");
        setPermissionCodes([]);
        setErrorText(
          getErrorMessage(error, "無法載入權限設定資料。"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!positionId) {
      setPermissionCodes([]);
      return undefined;
    }

    let active = true;

    const loadPositionPermissions = async () => {
      setPositionLoading(true);
      setErrorText("");

      try {
        const response = await apiAttendancePermissionSetting(positionId);
        const data = unwrapData(response, {});

        if (!active) return;

        setPermissionCodes(
          Array.isArray(data?.permission_codes)
            ? data.permission_codes
            : [],
        );
      } catch (error) {
        if (!active) return;

        setPermissionCodes([]);
        setErrorText(
          getErrorMessage(error, "無法載入職位權限。"),
        );
      } finally {
        if (active) {
          setPositionLoading(false);
        }
      }
    };

    loadPositionPermissions();

    return () => {
      active = false;
    };
  }, [positionId]);

  const permissionGroups = useMemo(() => {
    const groups = new Map();

    permissions.forEach((permission) => {
      const groupName = String(permission?.permission_group || "").trim();

      if (!groupName) return;

      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }

      groups.get(groupName).push(permission);
    });

    return Array.from(groups.entries());
  }, [permissions]);

  const handlePermissionChange = (permissionCode, checked) => {
    setPermissionCodes((current) => {
      if (checked) {
        return current.includes(permissionCode)
          ? current
          : [...current, permissionCode];
      }

      return current.filter((code) => code !== permissionCode);
    });

    setErrorText("");
  };

  const handleSave = async () => {
    if (!positionId || saving) return;

    setSaving(true);
    setErrorText("");

    try {
      const response = await apiUpdateAttendancePermissionSetting(
        positionId,
        permissionCodes,
      );
      const data = unwrapData(response, {});

      setPermissionCodes(
        Array.isArray(data?.permission_codes)
          ? data.permission_codes
          : [],
      );

      setSuccessDialog({
        open: true,
        title: "儲存成功",
        message: "權限設定已成功儲存。",
      });
    } catch (error) {
      setErrorText(
        getErrorMessage(error, "儲存權限設定失敗。"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
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
    );
  }

  return (
    <>
      <Box>
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          權限設定
        </Typography>

        <Typography
          sx={{
            mt: "4px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Attendance 模組權限設定
        </Typography>

        {errorText ? (
          <Alert severity="error" sx={{ mt: "16px" }}>
            {errorText}
          </Alert>
        ) : null}

        <Box
          sx={{
            mt: "18px",
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "260px minmax(0, 1fr)",
            },
            gap: "18px",
            alignItems: "start",
          }}
        >
          <Box>
            <TextField
              select
              label="職位 / Job Position"
              value={positionId}
              onChange={(event) => {
                setPositionId(event.target.value);
                setPermissionCodes([]);
                setErrorText("");
              }}
              size="small"
              fullWidth
              disabled={positionLoading || saving}
            >
              {positions.map((position) => (
                <MenuItem
                  key={position.position_id}
                  value={String(position.position_id)}
                >
                  {positionLabel(position)}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              overflow: "hidden",
              borderColor: "#d1d5db",
              borderRadius: "8px",
            }}
          >
            {positionLoading ? (
              <Box
                sx={{
                  minHeight: "260px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress size={28} />
              </Box>
            ) : (
              <>
                {permissionGroups.map(
                  ([groupName, groupPermissions], groupIndex) => (
                    <Box key={groupName}>
                      {groupIndex > 0 ? <Divider /> : null}

                      <Box
                        sx={{
                          px: { xs: "14px", sm: "18px" },
                          py: "14px",
                          bgcolor: "#f9fafb",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "15px",
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {groupName}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          px: { xs: "14px", sm: "18px" },
                          py: "10px",
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                          },
                          columnGap: "20px",
                        }}
                      >
                        {groupPermissions.map((permission) => {
                          const permissionCode = String(
                            permission?.permission_code || "",
                          );
                          const checked =
                            permissionCodes.includes(permissionCode);

                          return (
                            <FormControlLabel
                              key={permission.attendance_permission_id}
                              control={
                                <Checkbox
                                  checked={checked}
                                  onChange={(event) =>
                                    handlePermissionChange(
                                      permissionCode,
                                      event.target.checked,
                                    )
                                  }
                                  disabled={saving}
                                />
                              }
                              label={permission.permission_name}
                              sx={{
                                m: 0,
                                minHeight: "44px",
                                "& .MuiFormControlLabel-label": {
                                  fontSize: "14px",
                                  color: "#374151",
                                },
                              }}
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  ),
                )}
              </>
            )}
          </Paper>
        </Box>

        <Box
          sx={{
            mt: "18px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!positionId || positionLoading || saving}
          >
            {saving ? "儲存中..." : "儲存"}
          </Button>
        </Box>
      </Box>

      <SuccessDialog
        open={successDialog.open}
        title={successDialog.title}
        message={successDialog.message}
        onClose={() =>
          setSuccessDialog({
            open: false,
            title: "",
            message: "",
          })
        }
      />
    </>
  );
}