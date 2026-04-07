import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Link as RouterLink, Navigate } from "react-router-dom";
import Breadcrumb from "../../Utils/Breadcrumb";

function SettingsRow({
  title,
  to,
  topLabel,
  value,
  withSwitch = false,
  switchChecked = false,
  onSwitchChange,
  disabled = false,
}) {
  const secondaryTextColor = "grey";
  const primaryTextColor = "text.primary";

  const content = (
    <Box
      sx={{
        minHeight: topLabel ? "110px" : "88px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        px: 2.5
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {topLabel ? (
          <>
            <Typography
              sx={{
                fontSize: "14px",
                color: secondaryTextColor,
                lineHeight: 1.4,
                mb: "2px",
              }}
            >
              {topLabel}
            </Typography>

            <Typography
              sx={{
                fontSize: "24px",
                fontWeight: 700,
                color: disabled ? secondaryTextColor : primaryTextColor,
                lineHeight: 1.3,
              }}
            >
              {value}
            </Typography>
          </>
        ) : (
          <Typography
            sx={{
              fontSize: "24px",
              fontWeight: 700,
              color: disabled ? secondaryTextColor : primaryTextColor,
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>
        )}
      </Box>

      {withSwitch ? (
        <Switch
          checked={switchChecked}
          onChange={disabled ? undefined : onSwitchChange}
          disabled={disabled}
          sx={{
            mr: "-6px",
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: "#ffffff",
            },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              bgcolor: "#1098dc",
              opacity: 1,
            },
            "& .MuiSwitch-track": {
              bgcolor: "#bdbdbd",
              opacity: 1,
            },
          }}
        />
      ) : (
        <ChevronRightRoundedIcon
          sx={{
            fontSize: "40px",
            color: disabled ? "#eef0f3" : "#dfe3e8",
            flexShrink: 0,
          }}
        />
      )}
    </Box>
  );

  if (withSwitch || disabled || !to) {
    return <Box>{content}</Box>;
  }

  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        display: "block",
        textDecoration: "none",
      }}
    >
      {content}
    </Box>
  );
}

export default function Settings() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [pushEnabled, setPushEnabled] = useState(true);

  if (isDesktop) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box>
      <Breadcrumb currentLabel="設定" mb="10px" />

      <Typography
        sx={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#111827",
          mb: "14px",
        }}
      >
        設定
      </Typography>

      <Box
        sx={{
          bgcolor: "#ffffff",
          borderTop: "1px solid #e5e7eb",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Box sx={{ px: "2px" }}>
          <SettingsRow title="個人資料" to="/account" />
        </Box>

        <Divider />

        <Box sx={{ px: "2px" }}>
          <SettingsRow title="選單設置" to="/settings/menu-shortcuts" />
        </Box>

        <Divider />

        <Box sx={{ px: "2px" }}>
          <SettingsRow
            topLabel="首頁顯示姓名或招呼語"
            value="顯示姓名"
            disabled
          />
        </Box>

        <Divider />

        <Box sx={{ px: "2px" }}>
          <SettingsRow topLabel="語言" value="繁體中文" disabled />
        </Box>

        <Divider />

        <Box sx={{ px: "2px" }}>
          <SettingsRow
            title="推播通知"
            withSwitch
            disabled
            switchChecked={pushEnabled}
            onSwitchChange={(event) => setPushEnabled(event.target.checked)}
          />
        </Box>

        <Divider />

        <Box sx={{ px: "2px" }}>
          <SettingsRow title="隱私權條款" disabled />
        </Box>
      </Box>

      <Button
        fullWidth
        variant="outlined"
        sx={{
          mt: "18px",
          height: "86px",
          borderRadius: "10px",
          borderColor: "#1098dc",
          color: "#1f2937",
          bgcolor: "#ffffff",
          fontSize: "30px",
          fontWeight: 700,
          "&:hover": {
            borderColor: "#1098dc",
            bgcolor: "#f9fdff",
          },
        }}
      >
        登出
      </Button>
    </Box>
  );
}