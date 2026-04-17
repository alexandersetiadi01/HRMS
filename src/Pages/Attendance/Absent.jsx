import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from "@mui/material";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { NavLink, useNavigate } from "react-router-dom";
import { getCurrentPosition } from "../../Utils/Geolocation";
import { getDistanceInMeters } from "../../Utils/Distance";
import { getCurrentEmployeeId } from "../../API/account";
import { apiClockIn, apiClockOut, apiTodayStatus } from "../../API/attendance";

const OFFICE = {
  lat: 25.0729,
  lng: 121.3615,
  radius: 50,
  name: "台灣水禾（辦公室）",
};

function getTaiwanNowDisplay() {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function getTaiwanNowValue() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value || "";
  const month = parts.find((part) => part.type === "month")?.value || "";
  const day = parts.find((part) => part.type === "day")?.value || "";
  const hour = parts.find((part) => part.type === "hour")?.value || "00";
  const minute = parts.find((part) => part.type === "minute")?.value || "00";
  const second = parts.find((part) => part.type === "second")?.value || "00";

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function getErrorMessage(error, fallback = "取得位置失敗") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function Absent() {
  const navigate = useNavigate();
  const employeeId = useMemo(() => getCurrentEmployeeId(), []);

  const [taiwanTime, setTaiwanTime] = useState(getTaiwanNowDisplay());
  const [locationText, setLocationText] = useState("尚未取得位置");
  const [statusText, setStatusText] = useState("");
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [outsideDialogOpen, setOutsideDialogOpen] = useState(false);
  const [outsideDialogMessage, setOutsideDialogMessage] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTaiwanTime(getTaiwanNowDisplay());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTodayStatus() {
      if (!employeeId) {
        setStatusLoading(false);
        setStatusText("找不到目前登入者對應的員工資料。");
        return;
      }

      setStatusLoading(true);

      try {
        const result = await apiTodayStatus({ employee_id: employeeId });

        if (cancelled) {
          return;
        }

        if (result?.isCompleted) {
          setIsClockedIn(true);
          setIsCompleted(true);
          setStatusText("今日已完成上下班打卡。");
        } else if (result?.hasClockIn) {
          setIsClockedIn(true);
          setIsCompleted(false);
          setStatusText("今日已上班，可進行下班打卡。");
        } else {
          setIsClockedIn(false);
          setIsCompleted(false);
          setStatusText("");
        }
      } catch (error) {
        if (!cancelled) {
          setStatusText(getErrorMessage(error, "無法取得今日打卡狀態。"));
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false);
        }
      }
    }

    loadTodayStatus();

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  async function handleClock() {
    if (!employeeId || actionLoading || statusLoading || isCompleted) {
      return;
    }

    setActionLoading(true);
    setStatusText("檢查位置中...");

    try {
      const coords = await getCurrentPosition();

      const distance = getDistanceInMeters(
        coords.latitude,
        coords.longitude,
        OFFICE.lat,
        OFFICE.lng,
      );

      if (coords.accuracy > 100) {
        setLocationText("尚未取得位置");
        setStatusText("❌ 位置不準確，請移至窗邊");
        return;
      }

      if (distance > OFFICE.radius) {
        setLocationText("非辦公室範圍");
        setStatusText(`❌ 辦公室外 (${Math.round(distance)}m)`);
        setOutsideDialogMessage("您目前位於辦公室範圍外，請改走忘打卡申請。");
        setOutsideDialogOpen(true);
        return;
      }

      setLocationText(OFFICE.name);

      const payload = {
        employee_id: employeeId,
        punch_time: getTaiwanNowValue(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        method: "web",
      };

      if (isClockedIn) {
        await apiClockOut(payload);

        setIsClockedIn(true);
        setIsCompleted(true);
        setStatusText(`✅ 下班成功 (${Math.round(distance)}m)`);
      } else {
        await apiClockIn(payload);

        setIsClockedIn(true);
        setIsCompleted(false);
        setStatusText(`✅ 上班成功 (${Math.round(distance)}m)`);
      }

      try {
        const latest = await apiTodayStatus({ employee_id: employeeId });

        if (latest?.isCompleted) {
          setIsClockedIn(true);
          setIsCompleted(true);
        } else if (latest?.hasClockIn) {
          setIsClockedIn(true);
          setIsCompleted(false);
        } else {
          setIsClockedIn(false);
          setIsCompleted(false);
        }
      } catch {
        // Do nothing here.
        // The optimistic UI state above is already enough to keep the button correct.
      }
    } catch (error) {
      setStatusText(getErrorMessage(error, "取得位置失敗"));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <Dialog
        open={outsideDialogOpen}
        onClose={() => setOutsideDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 700,
          }}
        >
          <WarningAmberRoundedIcon sx={{ color: "#f59e0b" }} />
          不在打卡範圍內
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              fontSize: "15px",
              color: "#374151",
              lineHeight: 1.7,
            }}
          >
            {outsideDialogMessage || "您目前位於辦公室範圍外，無法直接打卡。"}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: "20px", pb: "18px" }}>
          <Button onClick={() => setOutsideDialogOpen(false)}>取消</Button>

          <Button
            variant="contained"
            onClick={() => {
              setOutsideDialogOpen(false);
              navigate("/attendance/missed-punch");
            }}
          >
            前往忘打卡申請
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ p: "16px", maxWidth: "520px", mx: "auto" }}>
        <Paper
          sx={{
            p: "20px",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <Typography
            sx={{
              fontSize: "26px",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {taiwanTime}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <PlaceOutlinedIcon sx={{ color: "#1698dc" }} />
            <Typography sx={{ fontSize: "16px", color: "#374151" }}>
              {locationText}
            </Typography>
          </Box>

          {statusText ? (
            <Typography
              sx={{
                fontSize: "14px",
                textAlign: "center",
                color: "#9ca3af",
              }}
            >
              {statusText}
            </Typography>
          ) : null}

          <Button
            fullWidth
            variant="contained"
            onClick={handleClock}
            disabled={!employeeId || actionLoading || statusLoading || isCompleted}
            sx={{
              height: "56px",
              fontSize: "18px",
              fontWeight: 700,
              borderRadius: "12px",
            }}
          >
            {actionLoading
              ? "處理中..."
              : statusLoading
                ? "載入中..."
                : isCompleted
                  ? "今日已完成打卡"
                  : isClockedIn
                    ? "下班"
                    : "上班"}
          </Button>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <Button
              component={NavLink}
              to="/attendance/missed-punch"
              variant="outlined"
              sx={{
                height: "48px",
                borderRadius: "10px",
                fontWeight: 600,
              }}
            >
              忘打卡申請
            </Button>

            <Button
              component={NavLink}
              to="/attendance/leave"
              variant="outlined"
              sx={{
                height: "48px",
                borderRadius: "10px",
                fontWeight: 600,
              }}
            >
              請假
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
}