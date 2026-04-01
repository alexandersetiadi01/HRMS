import { Box } from "@mui/material";

export default function LabelCell({ required, children }) {
  return (
    <Box
      sx={{
        pt: "8px",
        fontSize: "15px",
        color: "#374151",
        whiteSpace: "nowrap",
      }}
    >
      {required ? (
        <Box component="span" sx={{ color: "#ef4444", mr: "2px" }}>
          *
        </Box>
      ) : null}
      {children}
    </Box>
  );
}