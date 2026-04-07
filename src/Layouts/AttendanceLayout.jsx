import { Box, Typography } from "@mui/material";
import MenuTile from "../Components/MenuTile";
import { getAttendanceMenuItems } from "../Utils/Menu/MenuRegistry";

export default function AttendanceLayout() {
  const attendanceMenuItems = getAttendanceMenuItems();

  return (
    <Box>
      <Typography
        sx={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#111827",
          mb: "28px",
        }}
      >
        個人專區
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
            md: "repeat(5, minmax(0, 1fr))",
            lg: "repeat(6, minmax(0, 1fr))",
          },
          gap: "48px 28px",
        }}
      >
        {attendanceMenuItems.map((item) => (
          <MenuTile
            key={item.id}
            item={item}
            iconSize={56}
            wrapperSx={{
              gap: "14px",
            }}
          />
        ))}
      </Box>
    </Box>
  );
}