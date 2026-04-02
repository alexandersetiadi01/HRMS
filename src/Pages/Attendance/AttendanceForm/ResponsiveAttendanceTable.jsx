import { Box, Typography } from "@mui/material";

export default function ResponsiveAttendanceTable({
  columns = [],
  rows = [],
  emptyText = "查無資料",
  getRowKey,
  desktopMinWidth = "100%",
  mobileCardTitleKey = "",
  renderValue,
  headerBg = "#d4d4d4",
}) {
  const desktopGridTemplate = columns
    .map((column) => column.width || "1fr")
    .join(" ");

  return (
    <Box>
      {/* Desktop / Tablet */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: desktopMinWidth }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: desktopGridTemplate,
                minHeight: "40px",
                alignItems: "center",
                bgcolor: headerBg,
                px: "12px",
              }}
            >
              {columns.map((column) => (
                <Typography
                  key={column.key}
                  sx={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#111827",
                    whiteSpace: "nowrap",
                  }}
                >
                  {column.label}
                </Typography>
              ))}
            </Box>

            {rows.length === 0 ? (
              <Box
                sx={{
                  minHeight: "40px",
                  display: "flex",
                  alignItems: "center",
                  px: "12px",
                  borderBottom: "1px solid #d1d5db",
                }}
              >
                <Typography sx={{ fontSize: "15px", color: "#111827" }}>
                  {emptyText}
                </Typography>
              </Box>
            ) : (
              rows.map((row, index) => (
                <Box
                  key={getRowKey ? getRowKey(row, index) : index}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: desktopGridTemplate,
                    px: "12px",
                    py: "14px",
                    borderBottom: "1px solid #d1d5db",
                    alignItems: "start",
                  }}
                >
                  {columns.map((column) => {
                    const value = renderValue
                      ? renderValue(row, column)
                      : row[column.key];

                    return (
                      <Typography
                        key={column.key}
                        sx={{
                          fontSize: "15px",
                          color: "#111827",
                          whiteSpace: column.desktopWhiteSpace || "normal",
                          lineHeight: 1.5,
                        }}
                      >
                        {value || "-"}
                      </Typography>
                    );
                  })}
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      {/* Mobile */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {rows.length === 0 ? (
          <Box
            sx={{
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              px: "12px",
              py: "14px",
              bgcolor: "#ffffff",
            }}
          >
            <Typography sx={{ fontSize: "15px", color: "#111827" }}>
              {emptyText}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {rows.map((row, index) => {
              const cardTitle =
                mobileCardTitleKey && row[mobileCardTitleKey]
                  ? row[mobileCardTitleKey]
                  : null;

              return (
                <Box
                  key={getRowKey ? getRowKey(row, index) : index}
                  sx={{
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    bgcolor: "#ffffff",
                    overflow: "hidden",
                  }}
                >
                  {cardTitle ? (
                    <Box
                      sx={{
                        px: "12px",
                        py: "10px",
                        bgcolor: "#f3f4f6",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {cardTitle}
                      </Typography>
                    </Box>
                  ) : null}

                  <Box
                    sx={{
                      px: "12px",
                      py: "10px",
                      display: "grid",
                      gridTemplateColumns: "92px 1fr",
                      rowGap: "8px",
                      columnGap: "8px",
                    }}
                  >
                    {columns.map((column) => {
                      const value = renderValue
                        ? renderValue(row, column)
                        : row[column.key];

                      return (
                        <Box
                          key={column.key}
                          sx={{
                            display: "contents",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "#374151",
                              lineHeight: 1.5,
                            }}
                          >
                            {column.label}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: "14px",
                              color: "#111827",
                              lineHeight: 1.5,
                              whiteSpace: column.mobileWhiteSpace || "normal",
                              wordBreak: "break-word",
                            }}
                          >
                            {value || "-"}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}