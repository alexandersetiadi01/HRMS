import { Box, Typography } from "@mui/material";
import Breadcrumb from "../Utils/Breadcrumb";

import { useState, useEffect } from "react";

function SidebarMenuItem({
  item,
  activeMenu,
  activeOvertimeMenu,
  onMenuClick,
  onOvertimeMenuClick,
}) {
  const isActive = activeMenu === item.key;

  const [isOpen, setIsOpen] = useState(false);

  // auto open when active (so UX matches current behavior)
  useEffect(() => {
    if (item.key === "overtime" && activeMenu === "overtime") {
      setIsOpen(true);
    }
  }, [activeMenu, item.key]);

  const handleClick = () => {
    if (item.children) {
      setIsOpen((prev) => !prev);
      onMenuClick(item.key);
    } else {
      onMenuClick(item.key);
    }
  };

  return (
    <Box>
      <Box
        onClick={handleClick}
        sx={{
          position: "relative",
          minHeight: "40px",
          px: "20px",
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
        }}
      >
        <Box component="span">{item.label}</Box>

        {item.children && (
          <Box
            sx={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "0.2s",
              display: "flex",
              alignItems: "center",
            }}
          >
            {item.icon}
          </Box>
        )}
      </Box>

      {/* ✅ Only show children when open */}
      {item.children && isOpen && (
        <Box sx={{ pt: "6px", pb: "8px" }}>
          {item.children.map((child) => {
            const isChildActive =
              activeMenu === "overtime" && activeOvertimeMenu === child.key;

            return (
              <Box
                key={child.key}
                onClick={() => onOvertimeMenuClick(child.key)}
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
      )}
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
  return (
    <Box>
      <Breadcrumb rootLabel={rootLabel} currentLabel={title} mb="10px" />

      <Typography
        sx={{
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
          border: "1px solid #bdbdbd",
          bgcolor: "#ffffff",
          minHeight: "690px",
          display: "flex",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: "170px",
            flexShrink: 0,
            bgcolor: "#2f2f2f",
            pt: "14px",
            pb: "18px",
          }}
        >
          {menuConfig.map((item) => (
            <SidebarMenuItem
              key={item.key}
              item={item}
              activeMenu={activeMenu}
              activeOvertimeMenu={activeOvertimeMenu}
              onMenuClick={onMenuClick}
              onOvertimeMenuClick={onOvertimeMenuClick}
            />
          ))}
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            px: "20px",
            py: "18px",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
