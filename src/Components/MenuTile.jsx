import { Box, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { renderMenuIcon } from "../Utils/Menu/MenuRegistry";

export default function MenuTile({
  item,
  iconSize = 52,
  iconColor = "#2196d3",
  wrapperSx = {},
  iconBoxSx = {},
  labelSx = {},
  onClick,
}) {
  const isDisabled = !!item.disable;

  return (
    <Box
      component={isDisabled ? "div" : NavLink}
      to={isDisabled ? undefined : item.to}
      onClick={
        isDisabled
          ? (event) => event.preventDefault()
          : () => {
              onClick?.();
            }
      }
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "12px",
        textDecoration: "none",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        ...wrapperSx,
      }}
    >
      <Box
        sx={{
          width: "72px",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: isDisabled ? "grayscale(100%) opacity(0.6)" : "none",
          ...iconBoxSx,
        }}
      >
        {renderMenuIcon(item.iconKey, {
          size: iconSize,
          color: iconColor,
        })}
      </Box>

      <Typography
        sx={{
          fontSize: "16px",
          color: isDisabled ? "#9ca3af" : "#1f2937",
          textAlign: "center",
          lineHeight: 1.3,
          ...labelSx,
        }}
      >
        {item.label}
      </Typography>
    </Box>
  );
}