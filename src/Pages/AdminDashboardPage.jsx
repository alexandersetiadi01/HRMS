import { Box, Paper, Typography } from "@mui/material";

function AdminDashboardPage() {
  return (
    <Box sx={{ p: "24px", maxWidth: "600px", mx: "auto" }}>
      <Paper sx={{ p: "24px" }}>
        <Typography sx={{ fontSize: "28px", fontWeight: 700 }}>
          Admin Dashboard
        </Typography>
      </Paper>
    </Box>
  );
}

export default AdminDashboardPage;