import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PersonIcon from "@mui/icons-material/Person";
import AccountTabs from "../Pages/Account/AccountTabs";
import { fetchMyAccountProfile } from "../API/account";

export default function AccountLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setErrorText("");

      try {
        const data = await fetchMyAccountProfile();

        if (!active) {
          return;
        }

        setProfile(data);
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorText(error?.message || "無法取得帳戶資料。");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const employee = profile?.employee || {};
  const photoUrl = employee?.personal_photo_url || "";
  const dynamicMessage = employee?.dynamic_message || "";

  const photoContent = useMemo(() => {
    if (photoUrl) {
      return (
        <Box
          component="img"
          src={photoUrl}
          alt={employee?.display_name || "employee"}
          sx={{
            width: "140px",
            height: "170px",
            objectFit: "cover",
            display: "block",
          }}
        />
      );
    }

    return <PersonIcon sx={{ fontSize: "150px", color: "#a8a8a8" }} />;
  }, [employee?.display_name, photoUrl]);

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: "0px", md: "40px" },
        py: { xs: "20px", md: "28px" },
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "220px minmax(0, 1fr)" },
          gap: { xs: "20px", md: "28px" },
          alignItems: "start",
        }}
      >
        <Box>
          <Paper
            elevation={0}
            sx={{
              width: "160px",
              height: "190px",
              mx: "auto",
              border: "1px solid #cfcfcf",
              bgcolor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: "10px",
            }}
          >
            <Box
              sx={{
                width: "140px",
                height: "170px",
                border: "1px solid #d6d6d6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#fafafa",
                overflow: "hidden",
              }}
            >
              {photoContent}
            </Box>
          </Paper>

          <Button
            startIcon={<CameraAltIcon />}
            sx={{
              color: "#1f2937",
              fontSize: "14px",
              textTransform: "none",
              p: 0,
              minWidth: "unset",
              display: "flex",
              mx: "auto",
              mb: "14px",
            }}
          >
            更改個人大頭照
          </Button>

          <TextField
            fullWidth
            placeholder="請輸入您的動態訊息"
            size="small"
            value={dynamicMessage}
            InputProps={{
              readOnly: true,
            }}
            sx={{
              maxWidth: { xs: "260px", md: "100%" },
              width: "100%",
              mx: "auto",
              display: "block",
              "& .MuiInputBase-root": {
                height: "36px",
                fontSize: "14px",
                bgcolor: "#ffffff",
              },
            }}
          />

          {isMobile ? (
            <Typography
              sx={{
                maxWidth: "260px",
                mx: "auto",
                mt: "8px",
                fontSize: "13px",
                color: "#b91c1c",
                lineHeight: 1.5,
              }}
            >
              *如需修改個人資料，請用電腦版更新
            </Typography>
          ) : null}
        </Box>

        <Paper
          elevation={0}
          sx={{
            border: "1px solid #cfcfcf",
            bgcolor: "#ffffff",
            p: { xs: 0, md: "16px" },
            overflow: "hidden",
          }}
        >
          {loading ? (
            <Box
              sx={{
                minHeight: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : errorText ? (
            <Box sx={{ p: "16px" }}>
              <Alert severity="error">{errorText}</Alert>
            </Box>
          ) : (
            <AccountTabs profile={profile} />
          )}
        </Paper>
      </Box>
    </Box>
  );
}