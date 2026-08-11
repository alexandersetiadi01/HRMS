import { useState } from "react";
import {
  Box,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Breadcrumb from "../../../../Utils/Breadcrumb";
import AttendanceRulesTab from "./AttendanceRulesTab";
import LeaveTypesTab from "./LeaveTypesTab";

const MODULE_TABS = [
  { value: "permissions", label: "權限設定" },
  { value: "approval", label: "簽核設定" },
  { value: "form-parameters", label: "表單參數" },
];

const FORM_PARAMETER_ITEMS = [
  { value: "calendar", label: "行事曆管理" },
  { value: "shift", label: "班次" },
  { value: "shift-group", label: "班別" },
  { value: "leave-types", label: "假別名稱維護" },
  { value: "attendance-rules", label: "出勤規則設定" },
  { value: "clock-settings", label: "打卡設定" },
  { value: "unit-settings", label: "單位參數設定" },
];

export default function ModuleSettingPage() {
  const [activeTab, setActiveTab] = useState("form-parameters");
  const [activeParameter, setActiveParameter] = useState("leave-types");

  return (
    <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, sm: 2.5, md: 3 } }}>
      <Breadcrumb
        rootLabel="管理者專區"
        rootTo="/attendance"
        currentLabel="模組設定"
        mb="14px"
      />

      <Typography
        component="h1"
        sx={{
          mb: 2,
          fontSize: { xs: "22px", sm: "25px", md: "28px" },
          fontWeight: 700,
          color: "#111827",
        }}
      >
        模組設定
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          overflow: "hidden",
          borderColor: "#d1d5db",
          borderRadius: "8px",
        }}
      >
        <Box sx={{ overflowX: "auto", borderBottom: "1px solid #e5e7eb" }}>
          <Tabs
            value={activeTab}
            onChange={(_event, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: "48px",
              "& .MuiTab-root": {
                minHeight: "48px",
                minWidth: { xs: "120px", sm: "150px" },
                px: { xs: 1.5, sm: 2.5 },
                fontSize: { xs: "14px", sm: "15px", md: "16px" },
                fontWeight: 700,
              },
            }}
          >
            {MODULE_TABS.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tab.label} />
            ))}
          </Tabs>
        </Box>

        {activeTab === "permissions" ? (
          <Box sx={{ p: { xs: "16px", sm: "20px" } }}>
            <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
              權限設定
            </Typography>

            <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
              Attendance 模組權限設定
            </Typography>
          </Box>
        ) : null}

        {activeTab === "approval" ? (
          <Box sx={{ p: { xs: "16px", sm: "20px" } }}>
            <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
              簽核設定
            </Typography>

            <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
              請假、加班、忘打卡、公出及出差簽核流程設定
            </Typography>
          </Box>
        ) : null}

        {activeTab === "form-parameters" ? (
          <Box
            sx={{
              display: { xs: "block", md: "grid" },
              gridTemplateColumns: { md: "210px minmax(0, 1fr)" },
              minHeight: "420px",
            }}
          >
            <Box
              sx={{
                borderRight: { md: "1px solid #e5e7eb" },
                borderBottom: { xs: "1px solid #e5e7eb", md: "none" },
                bgcolor: "#f9fafb",
              }}
            >
              <Box
                sx={{
                  display: { xs: "flex", md: "block" },
                  overflowX: { xs: "auto", md: "visible" },
                  p: { xs: "8px", md: "10px" },
                }}
              >
                {FORM_PARAMETER_ITEMS.map((item) => {
                  const active = activeParameter === item.value;

                  return (
                    <Box
                      key={item.value}
                      component="button"
                      type="button"
                      onClick={() => setActiveParameter(item.value)}
                      sx={{
                        width: { xs: "auto", md: "100%" },
                        minWidth: { xs: "130px", md: 0 },
                        display: "block",
                        border: 0,
                        borderRadius: "6px",
                        px: "14px",
                        py: "11px",
                        bgcolor: active ? "#e8f3ff" : "transparent",
                        color: active ? "#1976d2" : "#374151",
                        fontSize: "15px",
                        fontWeight: active ? 700 : 500,
                        textAlign: "left",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        "&:hover": {
                          bgcolor: active ? "#e8f3ff" : "#f3f4f6",
                        },
                      }}
                    >
                      {item.label}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ p: { xs: "16px", sm: "20px" } }}>
              {activeParameter === "calendar" ? (
                <>
                  <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                    行事曆管理
                  </Typography>

                  <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
                    建立及管理行事曆與特殊班表事件
                  </Typography>
                </>
              ) : null}

              {activeParameter === "shift" ? (
                <>
                  <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                    班次
                  </Typography>

                  <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
                    班次時間與工作時段設定
                  </Typography>
                </>
              ) : null}

              {activeParameter === "shift-group" ? (
                <>
                  <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                    班別
                  </Typography>

                  <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
                    班別與班次組合設定
                  </Typography>
                </>
              ) : null}

              {activeParameter === "leave-types" ? (
                <LeaveTypesTab />
              ) : null}

              {activeParameter === "attendance-rules" ? (
                <AttendanceRulesTab />
              ) : null}

              {activeParameter === "clock-settings" ? (
                <>
                  <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                    打卡設定
                  </Typography>

                  <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
                    Attendance 打卡相關參數設定
                  </Typography>
                </>
              ) : null}

              {activeParameter === "unit-settings" ? (
                <>
                  <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                    單位參數設定
                  </Typography>

                  <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
                    單位排班及代申請權限相關設定
                  </Typography>
                </>
              ) : null}
            </Box>
          </Box>
        ) : null}
      </Paper>
    </Box>
  );
}