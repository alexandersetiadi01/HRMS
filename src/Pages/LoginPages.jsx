import { Box, Paper, Typography } from "@mui/material";

function LoginPage() {
  return (
    <Box sx={{ p: "24px", maxWidth: "600px", mx: "auto" }}>
      <Paper sx={{ p: "24px" }}>
        <Typography sx={{ fontSize: "28px", fontWeight: 700 }}>
          Login Page
        </Typography>
      </Paper>
    </Box>
  );
}

export default LoginPage;