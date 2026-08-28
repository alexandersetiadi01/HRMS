import { Box } from "@mui/material";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ForgetTapping from "./ForgetTapping";
import Leave from "./Leave";
import SpecialLeave from "./SpecialLeave";
import Overtime from "./Overtime";
import BusinessTrip from "./BusinessTrip";
import { MobileSectionTitle } from "./SharedFields";

const APPLICATION_RECORD_BASE = "/attendance/form-record/agent";

const TAB_ITEMS = [
  { key: "forget-tapping", label: "忘打卡申請" },
  { key: "leave", label: "請假" },
  { key: "special-leave", label: "特殊假別申請" },
  { key: "overtime", label: "加班" },
  { key: "business-trip", label: "公出/出差" },
];

function getActiveTab(pathname) {
  const relativePath = pathname
    .replace(APPLICATION_RECORD_BASE, "")
    .replace(/^\/+|\/+$/g, "");

  return TAB_ITEMS.some((item) => item.key === relativePath)
    ? relativePath
    : "forget-tapping";
}

export default function ApplicationRecord() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = getActiveTab(location.pathname);

  useEffect(() => {
    const expectedPath = `${APPLICATION_RECORD_BASE}/${activeTab}`;

    if (location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
  }, [activeTab, location.pathname, navigate]);

  const activeTabLabel = useMemo(() => {
    return TAB_ITEMS.find((item) => item.key === activeTab)?.label || "";
  }, [activeTab]);

  const renderContent = () => {
    if (activeTab === "forget-tapping") return <ForgetTapping />;
    if (activeTab === "leave") return <Leave />;
    if (activeTab === "special-leave") return <SpecialLeave />;
    if (activeTab === "overtime") return <Overtime />;
    if (activeTab === "business-trip") return <BusinessTrip />;
    return null;
  };

  return (
    <Box>
      <MobileSectionTitle>{activeTabLabel}</MobileSectionTitle>

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: "10px",
          borderBottom: "1px solid #d1d5db",
          mb: "16px",
          overflowX: "auto",
          pb: "0",
          "&::-webkit-scrollbar": {
            height: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "#c7c7c7",
            borderRadius: "999px",
          },
        }}
      >
        {TAB_ITEMS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <Box
              key={tab.key}
              onClick={() =>
                navigate(`${APPLICATION_RECORD_BASE}/${tab.key}`)
              }
              sx={{
                minWidth: "150px",
                height: "40px",
                px: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: isActive ? "1px solid #c9c9c9" : "1px solid transparent",
                borderBottom: isActive ? "1px solid #ffffff" : "none",
                borderTopLeftRadius: "4px",
                borderTopRightRadius: "4px",
                bgcolor: isActive ? "#ffffff" : "#e5e5e5",
                color: "#111827",
                fontSize: "15px",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                mt: "1px",
                flexShrink: 0,
              }}
            >
              {tab.label}
            </Box>
          );
        })}
      </Box>

      {renderContent()}
    </Box>
  );
}