import { useEffect, useState } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { NavLink } from "react-router-dom";
import { getCurrentPosition } from "../../Utils/Geolocation";
import { getDistanceInMeters } from "../../Utils/Distance";

const OFFICE = {
  lat: 25.0729,
  lng: 121.3615,
  radius: 50,
};

function getTaiwanNow() {
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

export default function Absent() {
  const [taiwanTime, setTaiwanTime] = useState(getTaiwanNow());
  const [locationText, setLocationText] = useState("尚未取得位置");
  const [statusText, setStatusText] = useState("");
  const [isClockedIn, setIsClockedIn] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTaiwanTime(getTaiwanNow());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClock = async () => {
    setStatusText("檢查位置中...");

    try {
      const coords = await getCurrentPosition();

      const distance = getDistanceInMeters(
        coords.latitude,
        coords.longitude,
        OFFICE.lat,
        OFFICE.lng
      );

      if (coords.accuracy > 100) {
        setStatusText("❌ 位置不準確，請移至窗邊");
        return;
      }

      if (distance <= OFFICE.radius) {
        setIsClockedIn((prev) => !prev);
        setStatusText(
          `✅ ${isClockedIn ? "下班" : "上班"}成功 (${Math.round(distance)}m)`
        );
        setLocationText("台灣水禾（辦公室）");
      } else {
        setStatusText(`❌ 辦公室外 (${Math.round(distance)}m)`);
        setLocationText("非辦公室範圍");
      }
    } catch (err) {
      setStatusText("取得位置失敗");
    }
  };

  return (
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
        {/* TIME */}
        <Typography
          sx={{
            fontSize: "26px",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          {taiwanTime}
        </Typography>

        {/* LOCATION */}
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

        {/* STATUS */}
        {statusText && (
          <Typography
            sx={{
              fontSize: "14px",
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            {statusText}
          </Typography>
        )}

        {/* MAIN BUTTON */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleClock}
          sx={{
            height: "56px",
            fontSize: "18px",
            fontWeight: 700,
            borderRadius: "12px",
          }}
        >
          {isClockedIn ? "下班" : "上班"}
        </Button>

        {/* SECONDARY BUTTONS */}
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
  );
}