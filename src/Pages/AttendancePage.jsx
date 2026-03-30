import { useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { getCurrentPosition } from "../Utils/Geolocation";
import { getDistanceInMeters } from "../Utils/Distance";

const OFFICE = {
  lat: 25.0729,
  lng: 121.3615,
  radius: 50,
};

function AttendancePage() {
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

      // Step 1: accuracy check
      if (coords.accuracy > 100) {
        setStatusText("❌ Location not accurate. Please move near a window.");
        return;
      }

      // Step 2: geofence check
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
          <Typography sx={{ fontSize: "28px", fontWeight: 700 }}>
            Attendance
          </Typography>

          <Typography sx={{ fontSize: "16px", wordBreak: "break-word" }}>
            {locationText}
          </Typography>

          <Typography sx={{ fontSize: "16px" }}>{statusText}</Typography>

          <Button variant="contained" onClick={handleClockCheck}>
            Check Location (Clock Validation)
          </Button>

          <Button variant="contained" disabled>
            Clock In
          </Button>

          <Button variant="outlined" disabled>
            Clock Out
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default AttendancePage;