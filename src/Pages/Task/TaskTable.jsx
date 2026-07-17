import { Box, Typography } from "@mui/material";
import { StatusPill } from "./TaskUtils";

export default function TaskTable({
  columns,
  rows,
  emptyText,
  selectedIds,
  onToggleSelected,
  onRowClick,
}) {
  return (
    <Box sx={{ border: "1px solid #d3d3d3", bgcolor: "#ffffff" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: columns
            .map((item) => item.width || "1fr")
            .join(" "),
          minHeight: "38px",
          alignItems: "center",
          background: "linear-gradient(to bottom, #f7f7f7, #dddddd)",
          borderBottom: "1px solid #d3d3d3",
        }}
      >
        {columns.map((column) => (
          <Box
            key={column.key}
            sx={{
              px: "12px",
              minHeight: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRight: column.withDivider ? "1px solid #d3d3d3" : "none",
            }}
          >
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#333333",
                textAlign: "center",
              }}
            >
              {column.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {rows.length === 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: columns
              .map((item) => item.width || "1fr")
              .join(" "),
            minHeight: "42px",
            alignItems: "center",
          }}
        >
          <Box sx={{ px: "12px", py: "10px" }}>
            <Typography sx={{ fontSize: "15px", color: "#333333" }}>
              {emptyText}
            </Typography>
          </Box>
        </Box>
      ) : (
        rows.map((row, rowIndex) => (
          <Box
            key={row.id || rowIndex}
            onClick={() => onRowClick(row)}
            sx={{
              display: "grid",
              gridTemplateColumns: columns
                .map((item) => item.width || "1fr")
                .join(" "),
              minHeight: "50px",
              alignItems: "center",
              borderBottom: (
                rowIndex === rows.length - 1
                  ? "none"
                  : "1px solid #d3d3d3"
              ),
              cursor: "pointer",
              bgcolor: row.isHighlighted
                ? "#fff7cc"
                : "transparent",
              "&:hover": {
                bgcolor: row.isHighlighted
                  ? "#fff1a8"
                  : "#fafafa",
              },
            }}
          >
            {columns.map((column) => (
              <Box
                key={column.key}
                sx={{
                  px: "12px",
                  py: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    column.align === "center" ? "center" : "flex-start",
                }}
              >
                {column.type === "statusPill" ? (
                  <StatusPill value={row[column.key]} />
                ) : column.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    onChange={(event) => {
                      event.stopPropagation();
                      onToggleSelected(row.id);
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      minWidth: 0,
                    }}
                  >
                    {column.key === "title"
                      && row.isUnreadNotification ? (
                        <Box
                          component="span"
                          aria-label="未讀指派事項"
                          sx={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            bgcolor: "#ef4444",
                            flexShrink: 0,
                          }}
                        />
                      ) : null}

                    <Typography
                      sx={{
                        fontSize: "15px",
                        color: (
                          column.cellSx?.color
                          || "#333333"
                        ),
                        textAlign: (
                          column.align
                          || "left"
                        ),
                        whiteSpace: (
                          column.wrap === false
                            ? "nowrap"
                            : "normal"
                        ),
                        overflow: (
                          column.wrap === false
                            ? "hidden"
                            : "visible"
                        ),
                        textOverflow: (
                          column.wrap === false
                            ? "ellipsis"
                            : "clip"
                        ),
                        wordBreak: "break-word",
                      }}
                    >
                      {row[column.key] || "-"}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        ))
      )}
    </Box>
  );
}