import { Box } from "@mui/material";
import { useState } from "react";
import ForgetTapping from "./ForgetTapping";
import Leave from "./Leave";
import SpecialLeave from "./SpecialLeave";
import Overtime from "./Overtime";
import BusinessTrip from "./BusinessTrip";

const TAB_ITEMS = [
  { key: "forget-tapping", label: "忘打卡申請" },
  { key: "leave", label: "請假" },
  { key: "special-leave", label: "特殊假別申請" },
  { key: "overtime", label: "加班" },
  { key: "business-trip", label: "公出/出差" },
];

export default function ApplicationRecord() {
  const [activeTab, setActiveTab] = useState("forget-tapping");

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
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: "10px",
          borderBottom: "1px solid #d1d5db",
          mb: "16px",
          overflowX: "auto",
          pb: "0",
        }}
      >
        {TAB_ITEMS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <Box
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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