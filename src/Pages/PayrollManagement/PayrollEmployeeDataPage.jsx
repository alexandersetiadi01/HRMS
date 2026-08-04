import {
  Box,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";

import PayrollEmployeeInsurancePage from "./PayrollEmployeeInsurancePage";
import PayrollEmployeeTaxDataPage from "./PayrollEmployeeTaxDataPage";
import PayrollEmployeeSalaryDataPage from "./PayrollEmployeeSalaryDataPage";

const EMPLOYEE_DATA_TABS = [
  {
    value: "salary",
    label: "薪資資料",
  },
  {
    value: "insurance",
    label: "保險資料",
  },
  {
    value: "tax",
    label: "所得稅資料",
  },
];

export default function PayrollEmployeeDataPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const requestedTab =
    searchParams.get("tab") || "salary";

  const activeTab = EMPLOYEE_DATA_TABS.some(
    (tab) => tab.value === requestedTab,
  )
    ? requestedTab
    : "salary";

  function handleTabChange(_, nextTab) {
    const nextSearchParams = new URLSearchParams(
      searchParams,
    );

    if (nextTab === "salary") {
      nextSearchParams.delete("tab");
    } else {
      nextSearchParams.set("tab", nextTab);
    }

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  }

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          mb: "14px",
          borderColor: "#dfe4e8",
          borderRadius: "5px",
          boxShadow: "none",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          aria-label="員工薪資保險資料分類"
          sx={{
            minHeight: {
              xs: "44px",
              sm: "48px",
            },
            "& .MuiTab-root": {
              minWidth: 0,
              minHeight: {
                xs: "44px",
                sm: "48px",
              },
              px: {
                xs: "6px",
                sm: "16px",
              },
              color: "#64748b",
              fontSize: {
                xs: "13px",
                sm: "15px",
              },
              fontWeight: 700,
            },
            "& .Mui-selected": {
              color: "#1976d2",
            },
          }}
        >
          {EMPLOYEE_DATA_TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
            />
          ))}
        </Tabs>
      </Paper>

      {activeTab === "salary" && (
        <PayrollEmployeeSalaryDataPage />
      )}

      {activeTab === "insurance" && (
        <PayrollEmployeeInsurancePage />
      )}

      {activeTab === "tax" && (
        <PayrollEmployeeTaxDataPage />
      )}
    </Box>
  );
}