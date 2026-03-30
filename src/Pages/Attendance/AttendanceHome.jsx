import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { getCurrentPosition } from "../../Utils/Geolocation";
import { getDistanceInMeters } from "../../Utils/Distance";

const OFFICE = {
  lat: 25.0729,
  lng: 121.3615,
  radius: 100,
};

export default function AttendanceHome() {
  const [locationText, setLocationText] = useState("Location not checked yet.");
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
        setStatusText("Location not accurate enough. Please move near a window and try again.");
        return;
      }

      if (distance <= OFFICE.radius) {
        setStatusText(`Inside office (${Math.round(distance)}m)`);
      } else {
        setStatusText(`Outside office (${Math.round(distance)}m)`);
      }
    } catch (error) {
      setStatusText(error.message || "Failed to get location.");
    }
  };

  return (
    <Box>
      <Typography sx={{ fontSize: "28px", fontWeight: 700, mb: "16px" }}>
        Attendance
      </Typography>

      <Stack spacing={2}>
        <Typography sx={{ fontSize: "16px", wordBreak: "break-word" }}>
          {locationText}
        </Typography>

        <Typography sx={{ fontSize: "16px" }}>{statusText}</Typography>

        <Box sx={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Button variant="contained" onClick={handleClockCheck}>
            Check Location
          </Button>

          <Button variant="contained" disabled>
            Clock In
          </Button>

          <Button variant="outlined" disabled>
            Clock Out
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}