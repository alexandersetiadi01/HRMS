import * as XLSX from "xlsx";

function normalizeFileName(
  value,
  fallback = "薪資報表",
) {
  const normalized = String(
    value || fallback,
  )
    .trim()
    .replace(
      /[\\/:*?"<>|]/g,
      "-",
    );

  return normalized || fallback;
}

function normalizeSheetName(
  value,
  fallback = "報表",
) {
  const normalized = String(
    value || fallback,
  )
    .trim()
    .replace(
      /[\\/?*[\]:]/g,
      "-",
    )
    .slice(0, 31);

  return normalized || fallback;
}

function getColumnWidth(
  header,
  rows,
  field,
  minimumWidth,
) {
  const contentWidths = rows.map(
    (row) =>
      String(
        row?.[field] ?? "",
      ).length,
  );

  return Math.min(
    40,
    Math.max(
      minimumWidth,
      String(header).length + 2,
      ...contentWidths,
    ),
  );
}

function appendBlankRows(
  rows,
  count,
) {
  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    rows.push([]);
  }
}

export function exportPayrollReportExcel({
  reportName,
  fileName,
  sheetName,
  metadata = [],
  columns,
  rows,
  summary = [],
}) {
  if (
    !Array.isArray(columns)
    || columns.length === 0
  ) {
    throw new Error(
      "Excel 報表欄位尚未設定。",
    );
  }

  const normalizedRows =
    Array.isArray(rows)
      ? rows
      : [];

  const worksheetRows = [
    [reportName],
  ];

  if (
    Array.isArray(metadata)
    && metadata.length > 0
  ) {
    metadata.forEach(
      ({
        label,
        value,
      }) => {
        worksheetRows.push([
          label,
          value ?? "",
        ]);
      },
    );
  }

  appendBlankRows(
    worksheetRows,
    1,
  );

  const headerRowIndex =
    worksheetRows.length;

  worksheetRows.push(
    columns.map(
      (column) =>
        column.label,
    ),
  );

  normalizedRows.forEach(
    (row) => {
      worksheetRows.push(
        columns.map(
          (column) => {
            if (
              typeof column.value
              === "function"
            ) {
              return column.value(
                row,
              );
            }

            return (
              row?.[
                column.field
              ] ?? ""
            );
          },
        ),
      );
    },
  );

  if (
    Array.isArray(summary)
    && summary.length > 0
  ) {
    appendBlankRows(
      worksheetRows,
      1,
    );

    summary.forEach(
      ({
        label,
        value,
      }) => {
        worksheetRows.push([
          label,
          value ?? "",
        ]);
      },
    );
  }

  const worksheet =
    XLSX.utils.aoa_to_sheet(
      worksheetRows,
    );

  const finalColumnIndex =
    Math.max(
      0,
      columns.length - 1,
    );

  worksheet["!merges"] = [
    {
      s: {
        r: 0,
        c: 0,
      },
      e: {
        r: 0,
        c: finalColumnIndex,
      },
    },
  ];

  worksheet["!cols"] =
    columns.map(
      (column) => ({
        wch:
          column.width
          || getColumnWidth(
            column.label,
            normalizedRows,
            column.field,
            12,
          ),
      }),
    );

  worksheet["!autofilter"] = {
    ref:
      XLSX.utils.encode_range({
        s: {
          r:
            headerRowIndex,
          c:
            0,
        },
        e: {
          r:
            headerRowIndex
            + normalizedRows.length,
          c:
            finalColumnIndex,
        },
      }),
  };

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    normalizeSheetName(
      sheetName
      || reportName,
    ),
  );

  XLSX.writeFile(
    workbook,
    `${normalizeFileName(
      fileName
      || reportName,
    )}.xlsx`,
    {
      compression: true,
    },
  );
}