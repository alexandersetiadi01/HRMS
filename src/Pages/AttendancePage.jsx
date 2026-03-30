import { useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { getCurrentPosition } from "../Utils/Geolocation";

function AttendancePage() {
  const [locationText, setLocationText] = useState("Location not checked yet.");

  const handleGetLocation = async () => {
    try {
      const coords = await getCurrentPosition();

      setLocationText(
        `Lat: ${coords.latitude}, Lng: ${coords.longitude}, Accuracy: ${coords.accuracy}m`
      );
    } catch (error) {
      setLocationText(error.message || "Failed to get location.");
    }
  };

  return (
    <Box sx={{ p: "24px", maxWidth: "600px", mx: "auto" }}>
      <Paper sx={{ p: "24px", borderRadius: "16px" }}>
        <Stack spacing={2}>
          <Typography sx={{ fontSize: "28px", fontWeight: 700 }}>
            Attendance
          </Typography>

          <Typography sx={{ fontSize: "16px" }}>{locationText}</Typography>

          <Button variant="contained" onClick={handleGetLocation}>
            Check My Location
          </Button>

          <Button variant="contained">Clock In</Button>
          <Button variant="outlined">Clock Out</Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default AttendancePage;