import { useEffect, useSyncExternalStore } from "react";
import {
  Box,
  CircularProgress,
  GlobalStyles,
  Portal,
  Typography,
} from "@mui/material";

import {
  getGlobalLoading,
  subscribeGlobalLoading,
} from "../Utils/GlobalLoading";

export default function GlobalLoadingOverlay() {
  const open = useSyncExternalStore(
    subscribeGlobalLoading,
    getGlobalLoading,
    getGlobalLoading,
  );

  useEffect(() => {
    if (!open) {
      document.body.classList.remove("hrms-global-loading-active");
      return undefined;
    }

    document.body.classList.add("hrms-global-loading-active");

    return () => {
      document.body.classList.remove("hrms-global-loading-active");
    };
  }, [open]);

  return (
    <>
      <GlobalStyles
        styles={{
          "body.hrms-global-loading-active .MuiCircularProgress-root:not(.hrms-global-loading-spinner)":
            {
              visibility: "hidden !important",
            },
        }}
      />

      {open ? (
        <Portal container={() => document.body}>
          <Box
            role="presentation"
            aria-busy="true"
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: 2147483647,
              width: "100vw",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(17, 24, 39, 0.62)",
              pointerEvents: "all",
              cursor: "wait",
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "#ffffff",
              }}
            >
              <CircularProgress
                className="hrms-global-loading-spinner"
                size={46}
                thickness={4}
                color="inherit"
              />

              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 600,
                  userSelect: "none",
                }}
              >
                處理中...
              </Typography>
            </Box>
          </Box>
        </Portal>
      ) : null}
    </>
  );
}