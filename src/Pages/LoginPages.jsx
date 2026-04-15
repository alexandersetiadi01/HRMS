import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  getStoredAuthToken,
  loginWithPassword,
} from "../API/auth";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function tryAutoLogin() {
      const token = getStoredAuthToken();

      if (!token) {
        return;
      }

      try {
        await fetchCurrentUser();

        if (!mounted) {
          return;
        }

        const redirectTo = location.state?.from?.pathname || "/";
        navigate(redirectTo, { replace: true });
      } catch {
        // ignore here, user stays on login page
      }
    }

    tryAutoLogin();

    return () => {
      mounted = false;
    };
  }, [location.state, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorText("");
    setSubmitting(true);

    try {
      await loginWithPassword(username, password);

      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.data?.message ||
        error?.message ||
        "登入失敗。";

      setErrorText(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: "420px",
          p: "32px",
          borderRadius: "16px",
        }}
      >
        <Typography
          sx={{
            fontSize: "28px",
            fontWeight: 700,
            textAlign: "center",
            mb: "8px",
          }}
        >
          HRMS Login
        </Typography>

        <Typography
          sx={{
            fontSize: "14px",
            color: "#64748b",
            textAlign: "center",
            mb: "24px",
          }}
        >
          請使用帳號與密碼登入
        </Typography>

        {errorText ? (
          <Alert severity="error" sx={{ mb: "16px" }}>
            {errorText}
          </Alert>
        ) : null}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            sx={{ mb: "16px" }}
            autoComplete="username"
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            sx={{ mb: "24px" }}
            autoComplete="current-password"
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{ height: "48px", fontSize: "16px", fontWeight: 700 }}
          >
            {submitting ? "登入中..." : "登入"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginPage;