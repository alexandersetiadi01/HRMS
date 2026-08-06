import { useState } from "react";

import {
  Box,
  Typography,
} from "@mui/material";

import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";

import MonthlyInsuranceStatusReport from "./MonthlyInsuranceStatusReport";
import MonthlyWithholdingTaxReport from "./MonthlyWithholdingTaxReport";
import SalaryBonusPaymentRegisterReport from "./SalaryBonusPaymentRegisterReport";

import ReportCatalog from "./Components/ReportCatalog";

import {
  REPORT_IDS,
} from "../../../Utils/reportConstants";

export default function PayrollReportsPage() {
  const [
    selectedReportId,
    setSelectedReportId,
  ] = useState(
    REPORT_IDS
      .SALARY_BONUS_PAYMENT_REGISTER,
  );

  function handleSelectReport(
    reportId,
  ) {
    if (
      reportId
      === selectedReportId
    ) {
      return;
    }

    setSelectedReportId(
      reportId,
    );
  }

  return (
    <Box
      sx={{
        width:
          "100%",
        maxWidth:
          "100%",
        minWidth:
          0,
        minHeight:
          "360px",
        p: {
          xs:
            "14px",
          sm:
            "18px",
          md:
            "22px",
        },
        border:
          "1px solid #dfe4e8",
        borderRadius:
          "5px",
        bgcolor:
          "#ffffff",
        overflow:
          "hidden",
      }}
    >
      <Box
        sx={{
          display:
            "flex",
          alignItems: {
            xs:
              "flex-start",
            sm:
              "center",
          },
          gap:
            "11px",
          mb:
            "18px",
        }}
      >
        <AssessmentOutlinedIcon
          sx={{
            color:
              "#1f9bd1",
            fontSize: {
              xs:
                "25px",
              md:
                "50px",
            },
          }}
        />

        <Box>
          <Typography
            component="h1"
            sx={{
              color:
                "#111827",
              fontSize: {
                xs:
                  "18px",
                sm:
                  "20px",
              },
              fontWeight:
                700,
            }}
          >
            報表中心
          </Typography>

          <Typography
            sx={{
              mt:
                "3px",
              color:
                "#7b8794",
              fontSize:
                "13px",
              lineHeight:
                1.6,
            }}
          >
            依各報表的查詢條件產生並下載薪資報表
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          width:
            "100%",
          minWidth:
            0,
        }}
      >
        <Box
          sx={{
            width:
              "100%",
            mb:
              "16px",
          }}
        >
          <Typography
            sx={{
              mb:
                "9px",
              color:
                "#475569",
              fontSize:
                "13px",
              fontWeight:
                700,
            }}
          >
            報表項目
          </Typography>

          <ReportCatalog
            selectedReportId={
              selectedReportId
            }
            onSelect={
              handleSelectReport
            }
          />
        </Box>

        <Box
          sx={{
            width:
              "100%",
            minWidth:
              0,
          }}
        >
          {selectedReportId
            === REPORT_IDS
              .SALARY_BONUS_PAYMENT_REGISTER ? (
            <SalaryBonusPaymentRegisterReport />
          ) : null}

          {selectedReportId
            === REPORT_IDS
              .MONTHLY_INSURANCE_STATUS ? (
            <MonthlyInsuranceStatusReport />
          ) : null}

          {selectedReportId
            === REPORT_IDS
              .MONTHLY_WITHHOLDING_TAX ? (
            <MonthlyWithholdingTaxReport />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}