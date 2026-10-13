import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

export default function AdminAccessSwitch({
  checked = false,
  disabled = false,
  onChange,
}) {
  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={onChange}
      sx={{
        p: 0,
        border: 0,
        bgcolor: "transparent",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        cursor: disabled
          ? "default"
          : "pointer",
        opacity: disabled ? 0.65 : 1,
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          width: "34px",
          height: "18px",
          borderRadius: "999px",
          bgcolor: checked
            ? "#425466"
            : "#d1d5db",
          position: "relative",
          flexShrink: 0,
          transition: "background-color 0.18s ease",
        }}
      >
        {checked ? (
          <CheckIcon
            sx={{
              position: "absolute",
              left: "4px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "10px",
              color: "#9ca3af",
            }}
          />
        ) : null}

        <Box
          sx={{
            position: "absolute",
            top: "2px",
            left: checked
              ? "18px"
              : "2px",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            bgcolor: checked
              ? "#7dd3fc"
              : "#ffffff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.22)",
            transition: "left 0.18s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {disabled ? (
            <CircularProgress
              size={9}
              thickness={5}
              sx={{
                color: checked
                  ? "#334155"
                  : "#9ca3af",
              }}
            />
          ) : null}
        </Box>
      </Box>

      <Typography
        component="span"
        sx={{
          fontSize: "13px",
          fontWeight: 400,
          lineHeight: 1,
          color: "#374151",
          whiteSpace: "nowrap",
        }}
      >
        管理權限
      </Typography>
    </Box>
  );
}