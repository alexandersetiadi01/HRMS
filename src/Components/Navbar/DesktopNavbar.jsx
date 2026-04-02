import { Box } from "@mui/material";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { label: "首頁", to: "/", disable: false },
  { label: "考勤", to: "/attendance", disable: false },
  { label: "帳戶資訊", to: "/account", disable: false },
  { label: "薪資單", to: "/payroll", disable: false },
  { label: "儀表板", to: "/dashboard", disable: true },
];

export default function DesktopNavbar() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "40px",
        bgcolor: "#0c93d4",
        display: { xs: "none", md: "block" },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "1180px",
          mx: "auto",
          px: { md: "24px" },
          height: "40px",
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isDisabled = item.disable;

          return (
            <Box
              key={item.label}
              component={isDisabled ? "div" : NavLink}
              to={isDisabled ? undefined : item.to}
              onClick={isDisabled ? (e) => e.preventDefault() : undefined}
              sx={{
                minWidth: "fit-content",
                px: "18px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                textDecoration: "none",
                position: "relative",
                flexShrink: 0,
                color: isDisabled ? "#93c5fd" : "#dbeafe",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.6 : 1,

                ...(isDisabled
                  ? {}
                  : {
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
                    }),
              }}
            >
              {item.label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}