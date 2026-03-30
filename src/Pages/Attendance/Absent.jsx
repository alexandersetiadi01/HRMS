import { useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { getCurrentPosition } from "../../Utils/Geolocation";
import { getDistanceInMeters } from "../../Utils/Distance";

const OFFICE = {
  lat: 25.0729,
  lng: 121.3615,
  radius: 50,
};

export default function Absent() {
  const [locationText, setLocationText] = useState("位置尚未核實。");
  const [statusText, setStatusText] = useState("");

  const handleClockCheck = async () => {
    setStatusText("Checking location...");

    try {
      const coords = await getCurrentPosition();

      const distance = getDistanceInMeters(
        coords.latitude,
        coords.longitude,
        OFFICE.lat,
        OFFICE.lng
      );

      setLocationText(
        `Lat: ${coords.latitude}, Lng: ${coords.longitude}, Accuracy: ${coords.accuracy}m`
      );

      if (coords.accuracy > 100) {
        setStatusText("❌ Location not accurate. Please move near a window.");
        return;
      }

      if (distance <= OFFICE.radius) {
        setStatusText(`✅ Inside office (${Math.round(distance)}m)`);
      } else {
        setStatusText(`❌ Outside office (${Math.round(distance)}m)`);
      }
    } catch (error) {
      setStatusText(error.message || "Failed to get location.");
    }
  };

  return (
    <Box sx={{ p: "24px", maxWidth: "600px", mx: "auto" }}>
      <Paper sx={{ p: "24px", borderRadius: "16px" }}>
        <Stack spacing={2}>
          <Typography sx={{ fontSize: "28px", fontWeight: 700,}}>
            打卡
          </Typography>

          <Typography sx={{ fontSize: "16px", wordBreak: "break-word",}}>
            {locationText}
          </Typography>

          <Typography sx={{ fontSize: "16px" }}>{statusText}</Typography>

          <Button variant="contained" onClick={handleClockCheck}>
            {"查看位置 (時鐘驗證)"}
          </Button>

          <Button variant="contained" disabled>
            上班
          </Button>

          <Button variant="outlined" disabled>
            下班
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}