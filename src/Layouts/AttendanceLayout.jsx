import { Box, Typography } from "@mui/material";
import MenuTile from "../Components/MenuTile";
import { getAttendanceMenuItemsBySection } from "../Utils/Menu/MenuRegistry";

function AttendanceMenuSection({ title, items }) {
  if (!items.length) return null;

  return (
    <Box sx={{ mb: "44px" }}>
      <Typography
        sx={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#111827",
          mb: "28px",
        }}
      >
        {title}
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
        {items.map((item) => (
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

export default function AttendanceLayout() {
  const personalItems = getAttendanceMenuItemsBySection("personal");
  const supervisorItems = getAttendanceMenuItemsBySection("supervisor");
  const managerItems = getAttendanceMenuItemsBySection("manager");

  return (
    <Box>
      <AttendanceMenuSection title="個人專區" items={personalItems} />
      <AttendanceMenuSection title="主管專區" items={supervisorItems} />
      <AttendanceMenuSection title="管理者專區" items={managerItems} />
    </Box>
  );
}