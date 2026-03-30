import { Box } from "@mui/material";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { label: "LinkUp", to: "/" },
  { label: "Attendance", to: "/attendance" },
  { label: "Foundation", to: "/foundation" },
  { label: "Payroll", to: "/payroll" },
  { label: "Dashboard", to: "/dashboard" },
];

export default function Navbar() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "40px",
        bgcolor: "#0c93d4",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "1180px",
          mx: "auto",
          px: { xs: "16px", md: "24px" },
          height: "40px",
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
        }}
      >
        {NAV_ITEMS.map((item) => (
          <Box
            key={item.label}
            component={NavLink}
            to={item.to}
            sx={{
              minWidth: "fit-content",
              px: "18px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dbeafe",
              fontSize: "15px",
              textDecoration: "none",
              position: "relative",
              flexShrink: 0,
              "&.active": {
                color: "#ffffff",
              },
              "&.active::after": {
                content: '""',
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderBottom: "6px solid #ffffff",
              },
            }}
          >
            {item.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}