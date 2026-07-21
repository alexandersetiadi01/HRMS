import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { StatusPill } from "./TaskUtils";

export default function TaskTable({
  columns,
  rows,
  emptyText,
  selectedIds,
  onToggleSelected,
  onRowClick,
}) {
  const theme = useTheme();
  const useCardLayout = useMediaQuery(
    theme.breakpoints.down("md"),
  );

  const renderCell = (column, row, compact = false) => {
    if (column.type === "statusPill") {
      return <StatusPill value={row[column.key]} />;
    }

    if (column.type === "checkbox") {
      return (
        <input
          type="checkbox"
          aria-label={`選取${row.title || "此項目"}`}
          checked={selectedIds.includes(row.id)}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onChange={(event) => {
            event.stopPropagation();
            onToggleSelected(row.id);
          }}
        />
      );
    }

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: 0,
        }}
      >
        {column.key === "title" &&
        row.isUnreadNotification ? (
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
            minWidth: 0,
            fontSize: compact
              ? {
                  xs: "14px",
                  sm: "15px",
                }
              : "15px",
            color: column.cellSx?.color || "#333333",
            textAlign: compact
              ? "left"
              : column.align || "left",
            whiteSpace:
              !compact && column.wrap === false
                ? "nowrap"
                : "normal",
            overflow:
              !compact && column.wrap === false
                ? "hidden"
                : "visible",
            textOverflow:
              !compact && column.wrap === false
                ? "ellipsis"
                : "clip",
            overflowWrap: "anywhere",
          }}
        >
          {row[column.key] || "-"}
        </Typography>
      </Box>
    );
  };

  if (useCardLayout) {
    if (rows.length === 0) {
      return (
        <Box
          sx={{
            border: "1px solid #d3d3d3",
            borderRadius: "6px",
            bgcolor: "#ffffff",
            px: "14px",
            py: "22px",
          }}
        >
          <Typography
            sx={{
              fontSize: {
                xs: "14px",
                sm: "15px",
              },
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            {emptyText}
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: "grid",
          gap: {
            xs: "10px",
            sm: "12px",
          },
        }}
      >
        {rows.map((row, rowIndex) => (
          <Box
            key={row.id || rowIndex}
            onClick={() => onRowClick(row)}
            sx={{
              border: "1px solid #d3d3d3",
              borderRadius: "6px",
              bgcolor: row.isHighlighted
                ? "#fff7cc"
                : "#ffffff",
              overflow: "hidden",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              "&:hover": {
                bgcolor: row.isHighlighted
                  ? "#fff1a8"
                  : "#fafafa",
              },
            }}
          >
            {columns.map((column, columnIndex) => (
              <Box
                key={column.key}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "88px minmax(0, 1fr)",
                    sm: "140px minmax(0, 1fr)",
                  },
                  alignItems: "stretch",
                  borderBottom:
                    columnIndex === columns.length - 1
                      ? "none"
                      : "1px solid #e5e7eb",
                }}
              >
                <Typography
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: {
                      xs: "8px",
                      sm: "10px",
                    },
                    py: "10px",
                    bgcolor: "#f7f7f7",
                    fontSize: {
                      xs: "12px",
                      sm: "13px",
                    },
                    fontWeight: 700,
                    color: "#475569",
                    wordBreak: "keep-all",
                  }}
                >
                  {column.mobileLabel || column.label}
                </Typography>

                <Box
                  sx={{
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    px: {
                      xs: "10px",
                      sm: "12px",
                    },
                    py: "10px",
                  }}
                >
                  {renderCell(column, row, true)}
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      <Box
        sx={{
          minWidth: "760px",
          border: "1px solid #d3d3d3",
          bgcolor: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: columns
              .map((item) => item.width || "1fr")
              .join(" "),
            minHeight: "38px",
            alignItems: "center",
            background:
              "linear-gradient(to bottom, #f7f7f7, #dddddd)",
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
                borderRight: column.withDivider
                  ? "1px solid #d3d3d3"
                  : "none",
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
              minHeight: "42px",
              px: "12px",
              py: "10px",
            }}
          >
            <Typography
              sx={{
                fontSize: "15px",
                color: "#333333",
              }}
            >
              {emptyText}
            </Typography>
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
                borderBottom:
                  rowIndex === rows.length - 1
                    ? "none"
                    : "1px solid #d3d3d3",
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
                    minWidth: 0,
                    px: "12px",
                    py: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      column.align === "center"
                        ? "center"
                        : "flex-start",
                  }}
                >
                  {renderCell(column, row)}
                </Box>
              ))}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}