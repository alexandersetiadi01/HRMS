import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  ClickAwayListener,
  Paper,
  Typography,
} from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { getTodayYearMonth } from "../../Utils/Calendar/DateHelpers";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

function getPageStartFromYear(year) {
  const safeYear = Number.isFinite(year) ? year : new Date().getFullYear();
  return safeYear - (safeYear % 10);
}

export default function YearMonthPicker({ valueYear, valueMonth, onConfirm }) {
  const currentYear = new Date().getFullYear();

  const [open, setOpen] = useState(false);
  const [draftYear, setDraftYear] = useState(valueYear);
  const [draftMonth, setDraftMonth] = useState(valueMonth);
  const [yearPageStart, setYearPageStart] = useState(
    getPageStartFromYear(valueYear || currentYear),
  );

  useEffect(() => {
    if (!open) {
      setDraftYear(valueYear);
      setDraftMonth(valueMonth);
      setYearPageStart(getPageStartFromYear(valueYear || currentYear));
    }
  }, [open, valueYear, valueMonth, currentYear]);

  const yearOptions = useMemo(
    () => Array.from({ length: 10 }, (_, index) => yearPageStart + index),
    [yearPageStart],
  );

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: "relative", display: "inline-block" }}>
        <Box
          onClick={() => {
            setDraftYear(valueYear);
            setDraftMonth(valueMonth);
            setYearPageStart(getPageStartFromYear(valueYear || currentYear));
            setOpen(true);
          }}
          sx={{
            minWidth: "120px",
            height: "32px",
            px: "10px",
            border: "1px solid #c7c7c7",
            bgcolor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <Typography sx={{ fontSize: "16px", color: "#111827" }}>
            {valueYear}/{valueMonth}
          </Typography>
          <KeyboardArrowDownIcon sx={{ fontSize: "20px", color: "#8b8b8b" }} />
        </Box>

        {open ? (
          <Paper
            elevation={0}
            sx={{
              position: "absolute",
              top: "36px",
              left: 0,
              zIndex: 20,
              width: "220px",
              border: "1px solid #303030",
              borderRadius: 0,
              bgcolor: "#ffffff",
              p: "10px 10px 12px",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                gap: "12px",
                alignItems: "start",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "6px 8px",
                }}
              >
                {MONTH_OPTIONS.map((month) => {
                  const selected = draftMonth === month;

                  return (
                    <Box
                      key={month}
                      onClick={() => setDraftMonth(month)}
                      sx={{
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        color: "#111827",
                        border: selected ? "1px solid #4fa3ff" : "1px solid transparent",
                        bgcolor: selected ? "#eaf4ff" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      {month}月
                    </Box>
                  );
                })}
              </Box>

              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: "10px",
                  }}
                >
                  <Box
                    onClick={() => setYearPageStart((prev) => prev - 10)}
                    sx={{
                      cursor: "pointer",
                      color: "#17336b",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <KeyboardArrowLeftIcon sx={{ fontSize: "42px" }} />
                  </Box>

                  <Box
                    onClick={() => setYearPageStart((prev) => prev + 10)}
                    sx={{
                      cursor: "pointer",
                      color: "#17336b",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <KeyboardArrowRightIcon sx={{ fontSize: "42px" }} />
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "8px 10px",
                  }}
                >
                  {yearOptions.map((year) => {
                    const selected = draftYear === year;

                    return (
                      <Box
                        key={year}
                        onClick={() => setDraftYear(year)}
                        sx={{
                          height: "30px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          color: "#111827",
                          border: selected ? "1px solid #4fa3ff" : "1px solid transparent",
                          bgcolor: selected ? "#eaf4ff" : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        {year}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                mt: "14px",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                onClick={() => {
                  onConfirm(draftYear, draftMonth);
                  setOpen(false);
                }}
                sx={{
                  minWidth: "52px",
                  height: "34px",
                  borderRadius: 0,
                  bgcolor: "#152a63",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#152a63",
                    boxShadow: "none",
                  },
                }}
              >
                確定
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  const today = getTodayYearMonth();
                  setDraftYear(today.year);
                  setDraftMonth(today.month);
                  setYearPageStart(getPageStartFromYear(today.year));
                }}
                sx={{
                  minWidth: "52px",
                  height: "34px",
                  borderRadius: 0,
                  bgcolor: "#152a63",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#152a63",
                    boxShadow: "none",
                  },
                }}
              >
                今天
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  setDraftYear(valueYear);
                  setDraftMonth(valueMonth);
                  setYearPageStart(getPageStartFromYear(valueYear || currentYear));
                  setOpen(false);
                }}
                sx={{
                  minWidth: "52px",
                  height: "34px",
                  borderRadius: 0,
                  bgcolor: "#152a63",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#152a63",
                    boxShadow: "none",
                  },
                }}
              >
                取消
              </Button>
            </Box>
          </Paper>
        ) : null}
      </Box>
    </ClickAwayListener>
  );
}