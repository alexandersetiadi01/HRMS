import { useState } from "react";
import {
  Box,
  Collapse,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

import Breadcrumb from "../../../../Utils/Breadcrumb";
import AttendanceRulesTab from "./AttendanceRulesTab";
import LeaveTypesTab from "./LeaveTypesTab";
import ShiftsTab from "./ShiftsTab";
import {
  ATTENDANCE_RULE_ITEMS,
  FORM_PARAMETER_ITEMS,
  MODULE_TABS,
} from "./moduleSettingOptions";

export default function ModuleSettingPage() {
  const [activeTab, setActiveTab] = useState("form-parameters");
  const [activeParameter, setActiveParameter] = useState("leave-types");
  const [activeAttendanceRule, setActiveAttendanceRule] = useState("leave");
  const [attendanceRulesOpen, setAttendanceRulesOpen] = useState(false);

  const handleParameterClick = (item) => {
    if (item.value === "attendance-rules") {
      setActiveParameter("attendance-rules");
      setActiveTab("form-parameters");
      setAttendanceRulesOpen((current) => !current);
      return;
    }

    setActiveParameter(item.value);
    setActiveTab("form-parameters");
  };

  const handleAttendanceRuleClick = (value) => {
    setActiveTab("form-parameters");
    setActiveParameter("attendance-rules");
    setActiveAttendanceRule(value);
  };

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
        <Box
          sx={{
            display: { xs: "block", md: "grid" },
            gridTemplateColumns: { md: "210px minmax(0, 1fr)" },
            minHeight: "520px",
          }}
        >
          <Box
            sx={{
              borderRight: { md: "1px solid #e5e7eb" },
              borderBottom: { xs: "1px solid #e5e7eb", md: "none" },
              bgcolor: "#f9fafb",
            }}
          >
            <Box sx={{ p: "10px" }}>
              {FORM_PARAMETER_ITEMS.map((item) => {
                const active = activeParameter === item.value;
                const expandable = Boolean(item.expandable);

                return (
                  <Box key={item.value}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => handleParameterClick(item)}
                      sx={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
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
                      <Box component="span">{item.label}</Box>

                      {expandable ? (
                        attendanceRulesOpen ? (
                          <KeyboardArrowDownIcon sx={{ fontSize: "20px" }} />
                        ) : (
                          <KeyboardArrowRightIcon sx={{ fontSize: "20px" }} />
                        )
                      ) : null}
                    </Box>

                    {expandable ? (
                      <Collapse in={attendanceRulesOpen} timeout="auto" unmountOnExit>
                        <Box sx={{ py: "4px" }}>
                          {ATTENDANCE_RULE_ITEMS.map((rule) => {
                            const ruleActive =
                              activeParameter === "attendance-rules" &&
                              activeAttendanceRule === rule.value;

                            return (
                              <Box
                                key={rule.value}
                                component="button"
                                type="button"
                                onClick={() => handleAttendanceRuleClick(rule.value)}
                                sx={{
                                  width: "100%",
                                  display: "block",
                                  border: 0,
                                  borderRadius: "6px",
                                  pl: "30px",
                                  pr: "14px",
                                  py: "9px",
                                  bgcolor: ruleActive ? "#f0f7ff" : "transparent",
                                  color: ruleActive ? "#1976d2" : "#4b5563",
                                  fontSize: "14px",
                                  fontWeight: ruleActive ? 700 : 500,
                                  textAlign: "left",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  "&:hover": {
                                    bgcolor: ruleActive ? "#f0f7ff" : "#f3f4f6",
                                  },
                                }}
                              >
                                {rule.label}
                              </Box>
                            );
                          })}
                        </Box>
                      </Collapse>
                    ) : null}
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                overflowX: "auto",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
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

            <Box sx={{ p: { xs: "16px", sm: "20px" }, minWidth: 0 }}>
              {activeTab === "permissions" ? (
                <>
                  <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                    權限設定
                  </Typography>

                  <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
                    Attendance 模組權限設定
                  </Typography>
                </>
              ) : null}

              {activeTab === "approval" ? (
                <>
                  <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                    簽核設定
                  </Typography>

                  <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
                    請假、加班、忘打卡、公出及出差簽核流程設定
                  </Typography>
                </>
              ) : null}

              {activeTab === "form-parameters" ? (
                <>
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
                    <ShiftsTab />
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
                    <AttendanceRulesTab activeRule={activeAttendanceRule} />
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
                </>
              ) : null}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}