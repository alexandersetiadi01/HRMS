import { Breadcrumbs, Link, Typography } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Link as RouterLink } from "react-router-dom";

export default function Breadcrumb({
  currentLabel,
  rootLabel = "首頁",
  rootTo = "/",
  mb = "10px",
}) {
  return (
    <Breadcrumbs
      separator={
        <NavigateNextIcon sx={{ fontSize: "18px", color: "#9ca3af" }} />
      }
      sx={{ mb }}
    >
      <Link
        component={RouterLink}
        to={rootTo}
        underline="hover"
        sx={{
          fontSize: "14px",
          color: "#6b7280",
          textDecoration: "none",
          "&:hover": {
            color: "#0c93d4",
          },
        }}
      >
        {rootLabel}
      </Link>

      <Typography
        sx={{
          fontSize: "14px",
          color: "#111827",
          fontWeight: 700,
        }}
      >
        {currentLabel}
      </Typography>
    </Breadcrumbs>
  );
}