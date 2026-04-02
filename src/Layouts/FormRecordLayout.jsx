import { useEffect, useRef, useState } from "react";
import {
  Box,
  ClickAwayListener,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Breadcrumb from "../Utils/Breadcrumb";

function SidebarMenuItem({
  item,
  activeMenu,
  activeOvertimeMenu,
  isOpen,
  onToggleOvertime,
  onMenuClick,
  onOvertimeMenuClick,
  onCloseMobileSidebar,
}) {
  const isActive = activeMenu === item.key;

  const handleClick = () => {
    if (item.children) {
      onToggleOvertime();
      return;
    }

    onMenuClick(item.key);
    onCloseMobileSidebar?.();
  };

  const handleChildClick = (key) => {
    onOvertimeMenuClick(key);
    onCloseMobileSidebar?.();
  };

  return (
    <Box>
      <Box
        onClick={handleClick}
        sx={{
          position: "relative",
          minHeight: "40px",
          px: "20px",
          pl: onCloseMobileSidebar ? "28px" : "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "15px",
          fontWeight: isActive ? 700 : 500,
          color: isActive ? "#ffffff" : "#d1d5db",
          cursor: "pointer",
          bgcolor: isActive ? "#2b2b2b" : "transparent",
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: isActive ? "#2b2b2b" : "rgba(255,255,255,0.04)",
            color: "#ffffff",
          },
          ...(isActive && {
            ...(onCloseMobileSidebar
              ? {
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: "6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 0,
                    height: 0,
                    borderTop: "5px solid transparent",
                    borderBottom: "5px solid transparent",
                    borderLeft: "8px solid #ffffff",
                  },
                }
              : {
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    top: "50%",
                    right: "0",
                    transform: "translateY(-50%)",
                    width: 0,
                    height: 0,
                    borderTop: "5px solid transparent",
                    borderBottom: "5px solid transparent",
                    borderRight: "8px solid #ffffff",
                  },
                }),
          }),
        }}
      >
        <Box component="span">{item.label}</Box>

        {item.children ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              color: "#b8923f",
            }}
          >
            {item.icon || <KeyboardArrowDownIcon sx={{ fontSize: "18px" }} />}
          </Box>
        ) : null}
      </Box>

      {item.children && isOpen ? (
        <Box sx={{ pt: "6px", pb: "8px" }}>
          {item.children.map((child) => {
            const isChildActive =
              activeMenu === "overtime" && activeOvertimeMenu === child.key;

            return (
              <Box
                key={child.key}
                onClick={() => handleChildClick(child.key)}
                sx={{
                  pl: "40px",
                  pr: "20px",
                  minHeight: "38px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "15px",
                  color: isChildActive ? "#ffffff" : "#c9c9c9",
                  fontWeight: isChildActive ? 700 : 500,
                  cursor: "pointer",
                  "&:hover": {
                    color: "#ffffff",
                  },
                }}
              >
                {child.label}
              </Box>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
}

function SidebarContent({
  menuConfig,
  activeMenu,
  activeOvertimeMenu,
  isOvertimeOpen,
  onToggleOvertime,
  onMenuClick,
  onOvertimeMenuClick,
  onCloseMobileSidebar,
  mobile = false,
}) {
  return (
    <Box
      sx={{
        width: mobile ? "180px" : "170px",
        flexShrink: 0,
        bgcolor: "#2f2f2f",
        pt: "14px",
        pb: "18px",
        borderRadius: mobile ? "0 18px 18px 0" : 0,
        overflow: "hidden",
        boxShadow: mobile ? "4px 8px 18px rgba(0,0,0,0.24)" : "none",
      }}
    >
      {menuConfig.map((item) => (
        <SidebarMenuItem
          key={item.key}
          item={item}
          activeMenu={activeMenu}
          activeOvertimeMenu={activeOvertimeMenu}
          isOpen={item.key === "overtime" ? isOvertimeOpen : false}
          onToggleOvertime={onToggleOvertime}
          onMenuClick={onMenuClick}
          onOvertimeMenuClick={onOvertimeMenuClick}
          onCloseMobileSidebar={onCloseMobileSidebar}
        />
      ))}
    </Box>
  );
}

export default function FormRecordLayout({
  title,
  rootLabel,
  menuConfig,
  activeMenu,
  activeOvertimeMenu,
  onMenuClick,
  onOvertimeMenuClick,
  children,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [isOvertimeOpen, setIsOvertimeOpen] = useState(
    activeMenu === "overtime",
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleHeight = 54;
  const [mobileHandleTop, setMobileHandleTop] = useState(null);
  const dragStateRef = useRef({
    dragging: false,
    startY: 0,
    startTop: 0,
    moved: false,
  });

  useEffect(() => {
    if (activeMenu === "overtime") {
      setIsOvertimeOpen(true);
    }
  }, [activeMenu]);

  useEffect(() => {
    if (!isMobile) return;

    const defaultTop = window.innerHeight / 2 - handleHeight / 2;
    const minTop = 80;
    const maxTop = window.innerHeight - handleHeight - 24;
    const clampedTop = Math.max(minTop, Math.min(defaultTop, maxTop));
    setMobileHandleTop((prev) => (prev == null ? clampedTop : prev));
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      setMobileHandleTop((prev) => {
        const fallback = window.innerHeight / 2 - handleHeight / 2;
        const current = prev == null ? fallback : prev;
        const minTop = 80;
        const maxTop = window.innerHeight - handleHeight - 24;
        return Math.max(minTop, Math.min(current, maxTop));
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  const handleToggleOvertime = () => {
    setIsOvertimeOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const openMobileSidebar = () => {
    setMobileSidebarOpen(true);
  };

  const clampHandleTop = (top) => {
    const minTop = 80;
    const maxTop = window.innerHeight - handleHeight - 24;
    return Math.max(minTop, Math.min(top, maxTop));
  };

  const startDrag = (clientY) => {
    dragStateRef.current = {
      dragging: true,
      startY: clientY,
      startTop:
        mobileHandleTop == null
          ? window.innerHeight / 2 - handleHeight / 2
          : mobileHandleTop,
      moved: false,
    };
  };

  const moveDrag = (clientY) => {
    if (!dragStateRef.current.dragging) return;

    const deltaY = clientY - dragStateRef.current.startY;
    if (Math.abs(deltaY) > 3) {
      dragStateRef.current.moved = true;
    }

    setMobileHandleTop(clampHandleTop(dragStateRef.current.startTop + deltaY));
  };

  const endDrag = () => {
    dragStateRef.current.dragging = false;
  };

  useEffect(() => {
    if (!isMobile) return;

    const handleMouseMove = (event) => {
      moveDrag(event.clientY);
    };

    const handleTouchMove = (event) => {
      if (!event.touches?.length) return;
      moveDrag(event.touches[0].clientY);
    };

    const handleMouseUp = () => {
      endDrag();
    };

    const handleTouchEnd = () => {
      endDrag();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, mobileHandleTop]);

  const handleButtonClick = () => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }
    openMobileSidebar();
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Breadcrumb rootLabel={rootLabel} currentLabel={title} mb="10px" />

      <Typography
        sx={{
          display: { xs: "none", md: "block" },
          fontSize: "24px",
          fontWeight: 700,
          color: "#111827",
          mb: "16px",
        }}
      >
        {title}
      </Typography>

      <Box
        sx={{
          position: "relative",
          border: "1px solid #bdbdbd",
          bgcolor: "#ffffff",
          minHeight: { xs: "auto", md: "690px" },
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        {!isMobile ? (
          <SidebarContent
            menuConfig={menuConfig}
            activeMenu={activeMenu}
            activeOvertimeMenu={activeOvertimeMenu}
            isOvertimeOpen={isOvertimeOpen}
            onToggleOvertime={handleToggleOvertime}
            onMenuClick={onMenuClick}
            onOvertimeMenuClick={onOvertimeMenuClick}
          />
        ) : null}

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            width: "100%",
            px: { xs: "14px", md: "20px" },
            py: { xs: "12px", md: "18px" },
            overflowX: "auto",
          }}
        >
          {children}
        </Box>
      </Box>

      {isMobile ? (
        <>
          {!mobileSidebarOpen ? (
            <Paper
              elevation={6}
              onClick={handleButtonClick}
              onMouseDown={(event) => startDrag(event.clientY)}
              onTouchStart={(event) => {
                if (!event.touches?.length) return;
                startDrag(event.touches[0].clientY);
              }}
              sx={{
                position: "fixed",
                left: 0,
                top: mobileHandleTop == null ? "50%" : `${mobileHandleTop}px`,
                transform:
                  mobileHandleTop == null ? "translateY(-50%)" : "none",
                width: "26px",
                height: "54px",
                borderRadius: "0 14px 14px 0",
                bgcolor: "#2f2f2f",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1300,
                cursor: "grab",
                userSelect: "none",
                touchAction: "none",
                boxShadow: "2px 4px 12px rgba(0,0,0,0.24)",
                "&:hover": {
                  bgcolor: "#262626",
                },
                "&:active": {
                  cursor: "grabbing",
                },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: "20px" }} />
            </Paper>
          ) : null}

          {mobileSidebarOpen ? (
            <Box
              sx={{
                position: "fixed",
                inset: 0,
                zIndex: 1300,
                pointerEvents: "none",
              }}
            >
              <ClickAwayListener onClickAway={closeMobileSidebar}>
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: (() => {
                      const fallbackTop = 120;
                      const panelEstimatedHeight =
                        14 +
                        18 +
                        menuConfig.length * 40 +
                        (isOvertimeOpen ? 82 : 0);
                      const desiredTop =
                        mobileHandleTop == null
                          ? fallbackTop
                          : mobileHandleTop - 80;
                      const minTop = 70;
                      const maxTop = Math.max(
                        minTop,
                        window.innerHeight - panelEstimatedHeight - 24,
                      );

                      return `${Math.max(minTop, Math.min(desiredTop, maxTop))}px`;
                    })(),
                    pointerEvents: "auto",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <SidebarContent
                    menuConfig={menuConfig}
                    activeMenu={activeMenu}
                    activeOvertimeMenu={activeOvertimeMenu}
                    isOvertimeOpen={isOvertimeOpen}
                    onToggleOvertime={handleToggleOvertime}
                    onMenuClick={onMenuClick}
                    onOvertimeMenuClick={onOvertimeMenuClick}
                    onCloseMobileSidebar={closeMobileSidebar}
                    mobile
                  />

                  <Paper
                    elevation={6}
                    onClick={closeMobileSidebar}
                    sx={{
                      ml: "-1px",
                      width: "26px",
                      height: "54px",
                      borderRadius: "0 14px 14px 0",
                      bgcolor: "#2f2f2f",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "2px 4px 12px rgba(0,0,0,0.24)",
                      "&:hover": {
                        bgcolor: "#262626",
                      },
                    }}
                  >
                    <ChevronRightIcon
                      sx={{
                        fontSize: "20px",
                        transform: "rotate(180deg)",
                      }}
                    />
                  </Paper>
                </Box>
              </ClickAwayListener>
            </Box>
          ) : null}
        </>
      ) : null}
    </Box>
  );
}
