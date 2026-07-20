import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RemoveIcon from "@mui/icons-material/Remove";

import {
  buildEmptyEmployeeOrder,
  buildEmptyOrderDetail,
  formatCurrency,
} from "./OrderSystemHelpers";

function getEmployeeLabel(employee) {
  const employeeNo = employee?.employee_no || "";
  const displayName = employee?.display_name || "";

  return [employeeNo, displayName].filter(Boolean).join(" ");
}

function getMenuLabel(menu) {
  const menuName = menu?.menu_name || "";
  const price = Number(menu?.price || 0);

  if (!menuName) {
    return "";
  }

  return `${menuName} / $${formatCurrency(price)}`;
}

function getMenuPrice(menuId, menus) {
  const targetMenu = menus.find((menu) => {
    return Number(menu.menu_id) === Number(menuId);
  });

  return Number(targetMenu?.price || 0);
}

export default function OrderMenuItemRows({
  value = [],
  employees = [],
  menus = [],
  onChange,
  disabled = false,
}) {
  const rows = value.length > 0 ? value : [buildEmptyEmployeeOrder()];

  const updateEmployeeRow = (employeeIndex, field, fieldValue) => {
    const nextRows = rows.map((row, rowIndex) => {
      if (rowIndex !== employeeIndex) {
        return row;
      }

      return {
        ...row,
        [field]: fieldValue,
      };
    });

    onChange(nextRows);
  };

  const updateDetailRow = (employeeIndex, detailIndex, field, fieldValue) => {
    const nextRows = rows.map((row, rowIndex) => {
      if (rowIndex !== employeeIndex) {
        return row;
      }

      const details = Array.isArray(row.details)
        ? row.details
        : [buildEmptyOrderDetail()];

      return {
        ...row,
        details: details.map((detail, currentDetailIndex) => {
          if (currentDetailIndex !== detailIndex) {
            return detail;
          }

          return {
            ...detail,
            [field]: fieldValue,
          };
        }),
      };
    });

    onChange(nextRows);
  };

  const addEmployeeRow = () => {
    onChange([...rows, buildEmptyEmployeeOrder()]);
  };

  const removeEmployeeRow = (employeeIndex) => {
    if (rows.length <= 1) {
      onChange([buildEmptyEmployeeOrder()]);
      return;
    }

    onChange(rows.filter((_, rowIndex) => rowIndex !== employeeIndex));
  };

  const addDetailRow = (employeeIndex) => {
    const nextRows = rows.map((row, rowIndex) => {
      if (rowIndex !== employeeIndex) {
        return row;
      }

      const details = Array.isArray(row.details)
        ? row.details
        : [buildEmptyOrderDetail()];

      return {
        ...row,
        details: [...details, buildEmptyOrderDetail()],
      };
    });

    onChange(nextRows);
  };

  const removeDetailRow = (employeeIndex, detailIndex) => {
    const nextRows = rows.map((row, rowIndex) => {
      if (rowIndex !== employeeIndex) {
        return row;
      }

      const details = Array.isArray(row.details)
        ? row.details
        : [buildEmptyOrderDetail()];

      if (details.length <= 1) {
        return {
          ...row,
          details: [buildEmptyOrderDetail()],
        };
      }

      return {
        ...row,
        details: details.filter(
          (_, currentDetailIndex) => currentDetailIndex !== detailIndex,
        ),
      };
    });

    onChange(nextRows);
  };

  return (
    <Stack spacing={2}>
      {rows.map((row, employeeIndex) => {
        const details = Array.isArray(row.details)
          ? row.details
          : [buildEmptyOrderDetail()];

        return (
          <Box
            key={employeeIndex}
            sx={{
              border: "1px solid #d8d8d8",
              borderRadius: "4px",
              p: { xs: "10px", sm: "14px" },
              bgcolor: "#ffffff",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={{ xs: 1, sm: 0 }}
              sx={{ mb: "12px" }}
            >
              <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
                員工訂購
              </Typography>

              <Button
                variant="outlined"
                size="small"
                disabled={disabled}
                onClick={() => removeEmployeeRow(employeeIndex)}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  minWidth: "90px",
                  height: "30px",
                  fontSize: "13px",
                }}
              >
                移除此員工
              </Button>
            </Stack>

            <Stack spacing={1.2}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "120px minmax(0, 1fr)",
                    md: "150px minmax(0, 1fr)",
                  },
                  columnGap: "10px",
                  rowGap: { xs: "6px", sm: 0 },
                  alignItems: "center",
                }}
              >
                <Typography sx={{ fontSize: "14px" }}>*員工</Typography>

                <TextField
                  select
                  fullWidth
                  size="small"
                  value={row.employee_id || ""}
                  disabled={disabled}
                  onChange={(event) =>
                    updateEmployeeRow(
                      employeeIndex,
                      "employee_id",
                      event.target.value,
                    )
                  }
                >
                  <MenuItem value="">請選擇員工</MenuItem>
                  {employees.map((employee) => (
                    <MenuItem
                      key={employee.employee_id}
                      value={employee.employee_id}
                    >
                      {getEmployeeLabel(employee)}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "120px minmax(0, 1fr)",
                    md: "150px minmax(0, 1fr)",
                  },
                  columnGap: "10px",
                  rowGap: { xs: "6px", sm: 0 },
                  alignItems: "center",
                }}
              >
                <Typography sx={{ fontSize: "14px" }}>付款狀態</Typography>

                <TextField
                  select
                  fullWidth
                  size="small"
                  value={row.payment_status || "未付款"}
                  disabled={disabled}
                  onChange={(event) =>
                    updateEmployeeRow(
                      employeeIndex,
                      "payment_status",
                      event.target.value,
                    )
                  }
                >
                  <MenuItem value="未付款">未付款</MenuItem>
                  <MenuItem value="已付款">已付款</MenuItem>
                  <MenuItem value="已取消">已取消</MenuItem>
                </TextField>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "120px minmax(0, 1fr)",
                    md: "150px minmax(0, 1fr)",
                  },
                  columnGap: "10px",
                  rowGap: { xs: "6px", sm: 0 },
                  alignItems: "flex-start",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    pt: { xs: 0, sm: "8px" },
                  }}
                >
                  備註
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  value={row.note || ""}
                  disabled={disabled}
                  onChange={(event) =>
                    updateEmployeeRow(employeeIndex, "note", event.target.value)
                  }
                />
              </Box>

              <Stack spacing={1}>
                {details.map((detail, detailIndex) => {
                  const quantity = Number(detail.quantity || 0);
                  const price = getMenuPrice(detail.menu_id, menus);
                  const subtotal = price * quantity;

                  return (
                    <Box
                      key={detailIndex}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "minmax(0, 1fr) 84px 34px 34px",
                          sm: "minmax(0, 1fr) 82px 82px 34px 34px",
                          md: "minmax(0, 1fr) 90px 90px 38px 38px",
                        },
                        gap: "8px",
                        alignItems: "center",
                        border: {
                          xs: "1px solid #e5e7eb",
                          sm: "none",
                        },
                        borderRadius: { xs: "4px", sm: 0 },
                        p: { xs: "8px", sm: 0 },
                      }}
                    >
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={detail.menu_id || ""}
                        disabled={disabled}
                        sx={{
                          gridColumn: { xs: "1 / -1", sm: "auto" },
                          minWidth: 0,
                        }}
                        onChange={(event) =>
                          updateDetailRow(
                            employeeIndex,
                            detailIndex,
                            "menu_id",
                            event.target.value,
                          )
                        }
                      >
                        <MenuItem value="">請選擇品項</MenuItem>
                        {menus.map((menu) => (
                          <MenuItem key={menu.menu_id} value={menu.menu_id}>
                            {getMenuLabel(menu)}
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        size="small"
                        type="number"
                        value={detail.quantity ?? 1}
                        disabled={disabled}
                        inputProps={{ min: 1, "aria-label": "數量" }}
                        onChange={(event) =>
                          updateDetailRow(
                            employeeIndex,
                            detailIndex,
                            "quantity",
                            event.target.value,
                          )
                        }
                      />

                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 700,
                          textAlign: {
                            xs: "right",
                            md: "right",
                          },
                          whiteSpace: "nowrap",
                        }}
                      >
                        ${formatCurrency(subtotal)}
                      </Typography>

                      <IconButton
                        size="small"
                        disabled={disabled}
                        onClick={() => addDetailRow(employeeIndex)}
                        sx={{
                          justifySelf: "center",
                          border: "1px solid #d8d8d8",
                          borderRadius: "4px",
                          width: "34px",
                          height: "34px",
                        }}
                      >
                        <AddIcon sx={{ fontSize: "18px" }} />
                      </IconButton>

                      <IconButton
                        size="small"
                        disabled={disabled}
                        onClick={() =>
                          removeDetailRow(employeeIndex, detailIndex)
                        }
                        sx={{
                          justifySelf: "center",
                          border: "1px solid #d8d8d8",
                          borderRadius: "4px",
                          width: "34px",
                          height: "34px",
                        }}
                      >
                        <RemoveIcon sx={{ fontSize: "18px" }} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          </Box>
        );
      })}

      <Button
        variant="outlined"
        disabled={disabled}
        onClick={addEmployeeRow}
        sx={{
          alignSelf: { xs: "stretch", sm: "flex-start" },
          width: { xs: "100%", sm: "auto" },
          fontSize: "14px",
        }}
      >
        新增員工訂購
      </Button>
    </Stack>
  );
}
