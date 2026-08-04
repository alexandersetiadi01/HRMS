import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Typography,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuIcon from "@mui/icons-material/Menu";
import {
  PAYROLL_NAVIGATION,
  findPayrollNavigationItem,
} from "./PayrollNavigation";
import { getStoredAuthUser } from "../../API/auth";
import { filterPayrollNavigation } from "../../Utils/PayrollPermissions";

function PayrollSidebarContent({
  pathname,
  navigation,
  onNavigate,
}) {
  const current = useMemo(
    () => findPayrollNavigationItem(pathname),
    [pathname],
  );

  const [expandedSections, setExpandedSections] = useState(() => ({
    [current?.section.id || "operations"]: true,
  }));

  return (
    <Box component="nav" aria-label="薪資管理功能">
      {navigation.map((section) => {
        const hasActiveItem = section.items.some(
          (item) => item.path === pathname,
        );

        const expanded =
          hasActiveItem || Boolean(expandedSections[section.id]);

        return (
          <Box
            key={section.id}
            sx={{ borderBottom: "1px solid #edf0f3" }}
          >
            <Button
              fullWidth
              onClick={() =>
                setExpandedSections((previous) => ({
                  ...previous,
                  [section.id]: !expanded,
                }))
              }
              endIcon={
                expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
              }
              aria-expanded={expanded}
              sx={{
                minHeight: "46px",
                justifyContent: "space-between",
                px: "16px",
                py: "10px",
                borderRadius: 0,
                color: hasActiveItem ? "#168dc5" : "#334155",
                bgcolor: hasActiveItem ? "#f2faff" : "transparent",
                fontSize: "14px",
                fontWeight: hasActiveItem ? 700 : 600,
                textAlign: "left",
                "&:hover": {
                  bgcolor: "#f5f8fa",
                },
                "& .MuiButton-endIcon": {
                  ml: "8px",
                },
              }}
            >
              {section.label}
            </Button>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box sx={{ pb: "7px" }}>
                {section.items.map((item) => {
                  const active = item.path === pathname;

                  return (
                    <Box
                      key={item.id}
                      component={NavLink}
                      to={item.path}
                      onClick={onNavigate}
                      sx={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        minHeight: "38px",
                        pl: "30px",
                        pr: "13px",
                        py: "8px",
                        color: active ? "#168dc5" : "#64748b",
                        bgcolor: active ? "#eaf7fd" : "transparent",
                        fontSize: "13px",
                        fontWeight: active ? 700 : 500,
                        lineHeight: 1.45,
                        textDecoration: "none",
                        "&::before": active
                          ? {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              bottom: 0,
                              left: 0,
                              width: "3px",
                              bgcolor: "#1f9bd1",
                            }
                          : undefined,
                        "&:hover": {
                          color: "#168dc5",
                          bgcolor: "#f2faff",
                        },
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </Box>

                      {item.implemented ? (
                        <CheckCircleIcon
                          aria-label="功能已完成"
                          sx={{
                            flexShrink: 0,
                            ml: "8px",
                            color: "#22c55e",
                            fontSize: "17px",
                          }}
                        />
                      ) : null}
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
}

export default function PayrollWorkspaceLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const authUser = useMemo(
    () => getStoredAuthUser(),
    [],
  );

  const visibleNavigation = useMemo(
    () =>
      filterPayrollNavigation(
        PAYROLL_NAVIGATION,
        authUser,
      ),
    [authUser],
  );

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          mb: { xs: "12px", md: "16px" },
          px: { xs: "12px", sm: "16px" },
          py: { xs: "11px", sm: "13px" },
          border: "1px solid #dfe4e8",
          borderRadius: "5px",
          bgcolor: "#ffffff",
        }}
      >
        <IconButton
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={
            mobileMenuOpen
              ? "關閉薪資功能選單"
              : "開啟薪資功能選單"
          }
          aria-expanded={mobileMenuOpen}
          sx={{
            display: { xs: "inline-flex", md: "none" },
            color: "#168dc5",
          }}
        >
          <MenuIcon />
        </IconButton>

        <AccountBalanceWalletOutlinedIcon
          sx={{ color: "#1f9bd1" }}
        />

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#111827",
              fontSize: { xs: "16px", sm: "18px" },
              fontWeight: 700,
            }}
          >
            薪資管理
          </Typography>

          <Typography
            sx={{
              color: "#7b8794",
              fontSize: "12px",
            }}
          >
            公司薪資、保險、稅務與結算作業
          </Typography>
        </Box>
      </Box>

      <Collapse
        in={mobileMenuOpen}
        timeout="auto"
        unmountOnExit
      >
        <Box
          sx={{
            display: { xs: "block", md: "none" },
            mb: "14px",
            border: "1px solid #dfe4e8",
            borderRadius: "5px",
            bgcolor: "#ffffff",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
          }}
        >
          <PayrollSidebarContent
            pathname={location.pathname}
            navigation={visibleNavigation}
            onNavigate={() =>
              setMobileMenuOpen(false)
            }
          />
        </Box>
      </Collapse>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "250px minmax(0, 1fr)",
          },
          alignItems: "start",
          gap: { md: "18px", lg: "22px" },
        }}
      >
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "sticky",
            top: "16px",
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto",
            border: "1px solid #dfe4e8",
            borderRadius: "5px",
            bgcolor: "#ffffff",
          }}
        >
          <PayrollSidebarContent
            pathname={location.pathname}
            navigation={visibleNavigation}
          />
        </Box>

        <Box component="main" sx={{ minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}