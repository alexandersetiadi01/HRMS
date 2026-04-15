import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import {
  clearStoredAuth,
  fetchCurrentUser,
  getStoredAuthToken,
} from "../API/auth";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let mounted = true;

    async function validate() {
      const token = getStoredAuthToken();

      if (!token) {
        if (mounted) {
          setStatus("guest");
        }
        return;
      }

      try {
        await fetchCurrentUser();

        if (mounted) {
          setStatus("authenticated");
        }
      } catch {
        clearStoredAuth();

        if (mounted) {
          setStatus("guest");
        }
      }
    }

    validate();

    return () => {
      mounted = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}