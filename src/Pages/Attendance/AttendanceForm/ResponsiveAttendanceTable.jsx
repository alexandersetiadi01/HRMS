import { isValidElement, useEffect, useMemo, useState } from "react";
import { Box, Chip, Pagination, Typography } from "@mui/material";

function isActionColumn(column) {
  const key = String(column?.key || "").toLowerCase();
  return key === "action" || key === "actions" || column?.label === "操作";
}

function isStatusColumn(column) {
  const key = String(column?.key || "").toLowerCase();
  return (
    key === "status" ||
    key.endsWith("_status") ||
    String(column?.label || "").includes("狀態")
  );
}

function getStatusBackground(value) {
  const status = String(value || "")
    .trim()
    .toLowerCase();

  if (
    ["停用", "inactive", "disabled"].some(
      (item) => status === item.toLowerCase(),
    )
  ) {
    return "#6b7280";
  }

  if (
    [
      "已核准",
      "核准",
      "正常",
      "完成",
      "已完成",
      "生效中",
      "生效",
      "有效",
      "成功",
      "啟用",
      "已發布",
      "approved",
      "active",
      "completed",
      "success",
    ].some((item) => status.includes(item.toLowerCase()))
  ) {
    return "#16a34a";
  }

  if (
    [
      "已駁回",
      "駁回",
      "拒絕",
      "已取消",
      "取消",
      "已撤銷",
      "撤銷",
      "失敗",
      "無效",
      "rejected",
      "cancelled",
      "canceled",
      "revoked",
      "failed",
      "invalid",
    ].some((item) => status.includes(item.toLowerCase()))
  ) {
    return "#dc2626";
  }

  if (
    [
      "草稿",
      "待審核",
      "待處理",
      "待確認",
      "處理中",
      "審核中",
      "未完成",
      "異常",
      "遲到",
      "早退",
      "缺上班卡",
      "缺下班卡",
      "缺勤",
      "曠職",
      "draft",
      "pending",
      "processing",
      "reviewing",
    ].some((item) => status.includes(item.toLowerCase()))
  ) {
    return "#d97706";
  }

  if (
    [
      "已送出",
      "已提交",
      "申請中",
      "請假",
      "加班",
      "submitted",
      "applying",
    ].some((item) => status.includes(item.toLowerCase()))
  ) {
    return "#2563eb";
  }

  return "#6b7280";
}

function renderStatusValue(value) {
  if (isValidElement(value)) return value;

  const label = String(value || "").trim();
  if (!label || label === "-") return "-";

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: "26px",
        maxWidth: "100%",
        bgcolor: getStatusBackground(label),
        color: "#ffffff",
        fontSize: "13px",
        fontWeight: 600,
        "& .MuiChip-label": {
          px: "10px",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      }}
    />
  );
}

export default function ResponsiveAttendanceTable({
  columns = [],
  rows = [],
  emptyText = "查無資料",
  getRowKey,
  desktopMinWidth = "100%",
  mobileCardTitleKey = "",
  renderValue,
  headerBg = "#d4d4d4",
  pagination = false,
  rowsPerPage = 10,
  mergeColumns = [],
  fitToContainer = false,
}) {
  const [page, setPage] = useState(1);

  const desktopGridTemplate = columns
    .map((column) => {
      const width = String(column.width || "1fr");

      if (fitToContainer && /^(\d*\.?\d+)fr$/.test(width)) {
        return `minmax(0, ${width})`;
      }

      return width;
    })
    .join(" ");

  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));

  useEffect(() => {
    setPage(1);
  }, [rows, rowsPerPage]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const visibleRows = useMemo(() => {
    if (!pagination) {
      return rows;
    }

    const start = (page - 1) * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [pagination, page, rows, rowsPerPage]);

  const mergeMap = useMemo(() => {
    const map = new Map();

    mergeColumns.forEach((columnKey) => {
      let startIndex = 0;

      while (startIndex < visibleRows.length) {
        const currentValue = visibleRows[startIndex]?.[columnKey];
        let endIndex = startIndex + 1;

        while (
          endIndex < visibleRows.length &&
          visibleRows[endIndex]?.[columnKey] === currentValue
        ) {
          endIndex += 1;
        }

        map.set(`${columnKey}:${startIndex}`, endIndex - startIndex);

        for (let index = startIndex + 1; index < endIndex; index += 1) {
          map.set(`${columnKey}:${index}`, 0);
        }

        startIndex = endIndex;
      }
    });

    return map;
  }, [mergeColumns, visibleRows]);

  const hasMergedColumns = mergeColumns.length > 0;

  return (
    <Box>
      {/* Desktop / Tablet */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Box
          sx={{
            width: "100%",
            minWidth: 0,
            overflowX: fitToContainer ? "hidden" : "auto",
          }}
        >
          <Box
            sx={{
              width: "100%",
              minWidth: fitToContainer ? 0 : desktopMinWidth,
            }}
          >
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
                    minWidth: 0,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#111827",
                    whiteSpace: fitToContainer ? "normal" : "nowrap",
                    overflowWrap: fitToContainer ? "anywhere" : "normal",
                    lineHeight: 1.4,
                    textAlign:
                      isActionColumn(column) || isStatusColumn(column)
                        ? "center"
                        : "left",
                  }}
                >
                  {column.label}
                </Typography>
              ))}
            </Box>

            {visibleRows.length === 0 ? (
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
            ) : hasMergedColumns ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: desktopGridTemplate,
                  gridTemplateRows: `repeat(${visibleRows.length}, minmax(49px, auto))`,
                  px: "12px",
                }}
              >
                {visibleRows.flatMap((row, rowIndex) =>
                  columns.map((column, columnIndex) => {
                    const mergeKey = `${column.key}:${rowIndex}`;
                    const mergeSpan = mergeColumns.includes(column.key)
                      ? mergeMap.get(mergeKey)
                      : 1;

                    if (mergeSpan === 0) {
                      return null;
                    }

                    const value = renderValue
                      ? renderValue(row, column)
                      : row[column.key];
                    const actionColumn = isActionColumn(column);
                    const statusColumn = isStatusColumn(column);
                    const content = statusColumn
                      ? renderStatusValue(value)
                      : value || "-";

                    return (
                      <Box
                        key={`${getRowKey ? getRowKey(row, rowIndex) : rowIndex}-${column.key}`}
                        sx={{
                          minWidth: 0,
                          maxWidth: "100%",
                          gridColumn: columnIndex + 1,
                          gridRow:
                            mergeSpan > 1
                              ? `${rowIndex + 1} / span ${mergeSpan}`
                              : rowIndex + 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            actionColumn || statusColumn
                              ? "center"
                              : "flex-start",
                          py: "14px",
                          borderBottom: "1px solid #d1d5db",
                          bgcolor: "#ffffff",
                          overflow: fitToContainer ? "hidden" : "visible",
                          overflowWrap: fitToContainer ? "anywhere" : "normal",
                          fontSize: "15px",
                          fontWeight: 400,
                          color: "#111827",
                          whiteSpace: column.desktopWhiteSpace || "normal",
                          lineHeight: 1.5,
                          ...(actionColumn
                            ? {
                                "& .MuiIconButton-root": {
                                  color: "#757575",
                                },
                                "& .MuiIconButton-root:hover": {
                                  color: "#757575",
                                },
                                "& .MuiIconButton-root.Mui-focusVisible": {
                                  color: "#757575",
                                },
                              }
                            : {}),
                        }}
                      >
                        {content}
                      </Box>
                    );
                  }),
                )}
              </Box>
            ) : (
              visibleRows.map((row, index) => (
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
                    const actionColumn = isActionColumn(column);
                    const statusColumn = isStatusColumn(column);
                    const content = statusColumn
                      ? renderStatusValue(value)
                      : value || "-";

                    return (
                      <Box
                        key={column.key}
                        sx={{
                          minWidth: 0,
                          maxWidth: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            actionColumn || statusColumn
                              ? "center"
                              : "flex-start",
                          overflow: fitToContainer ? "hidden" : "visible",
                          overflowWrap: fitToContainer ? "anywhere" : "normal",
                          fontSize: "15px",
                          color: "#111827",
                          whiteSpace: column.desktopWhiteSpace || "normal",
                          lineHeight: 1.5,
                          ...(actionColumn
                            ? {
                                "& .MuiIconButton-root": {
                                  color: "#757575",
                                },
                                "& .MuiIconButton-root:hover": {
                                  color: "#757575",
                                },
                                "& .MuiIconButton-root.Mui-focusVisible": {
                                  color: "#757575",
                                },
                              }
                            : {}),
                        }}
                      >
                        {content}
                      </Box>
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
        {visibleRows.length === 0 ? (
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
            {visibleRows.map((row, index) => {
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
                      const statusColumn = isStatusColumn(column);
                      const content = statusColumn
                        ? renderStatusValue(value)
                        : value || "-";

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

                          <Box
                            sx={{
                              minWidth: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent:
                                isActionColumn(column) || statusColumn
                                  ? "flex-start"
                                  : "flex-start",
                              fontSize: "14px",
                              color: "#111827",
                              lineHeight: 1.5,
                              whiteSpace: column.mobileWhiteSpace || "normal",
                              wordBreak: "break-word",
                            }}
                          >
                            {content}
                          </Box>
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

      {pagination && rows.length > rowsPerPage ? (
        <Box
          sx={{
            mt: "16px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Pagination
            page={page}
            count={pageCount}
            onChange={(_, value) => setPage(value)}
            shape="rounded"
            size="small"
          />
        </Box>
      ) : null}
    </Box>
  );
}
