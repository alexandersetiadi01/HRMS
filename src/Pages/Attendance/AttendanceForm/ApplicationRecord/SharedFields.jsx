import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import {
  ACTION_BUTTON_SX,
  COMMON_SELECT_MENU_PROPS,
  COMMON_SELECT_SX,
} from "./Options";

export function FilterRow({ children, withDivider = false }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "stretch", sm: "center" },
        gap: "18px",
        flexWrap: "wrap",
        pb: withDivider ? "10px" : 0,
        borderBottom: withDivider ? "1px solid #d1d5db" : "none",
      }}
    >
      {children}
    </Box>
  );
}

export function SelectField({
  label,
  required = false,
  value,
  onChange,
  options,
  minWidth = "186px",
  displayEmpty = false,
  menuProps = COMMON_SELECT_MENU_PROPS,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        gap: { xs: "8px", sm: "10px" },
        width: { xs: "100%", sm: "auto" },
        minWidth: { xs: "100%", sm: "auto" },
      }}
    >
      <Typography
        sx={{
          fontSize: "15px",
          color: "#111827",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        {required ? (
          <Box component="span" sx={{ color: "#ef4444", mr: "2px" }}>
            *
          </Box>
        ) : null}
        {label}
      </Typography>

      <Select
        size="small"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        displayEmpty={displayEmpty}
        MenuProps={menuProps}
        sx={{
          minWidth: { xs: "100%", sm: minWidth },
          width: { xs: "100%", sm: "auto" },
          ...COMMON_SELECT_SX,
        }}
      >
        {options.map((item) => (
          <MenuItem
            key={`${label}-${item.value}-${item.label}`}
            value={item.value}
          >
            {item.label}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export function YearMonthField({
  year,
  onYearChange,
  yearOptions,
  month,
  onMonthChange,
  monthOptions,
  required = false,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        gap: { xs: "8px", sm: "10px" },
        width: { xs: "100%", sm: "auto" },
      }}
    >
      <Typography
        sx={{
          fontSize: "15px",
          color: "#111827",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        {required ? (
          <Box component="span" sx={{ color: "#ef4444", mr: "2px" }}>
            *
          </Box>
        ) : null}
        年度/月份
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: { xs: "100%", sm: "auto" },
        }}
      >
        <Select
          size="small"
          value={year}
          onChange={(event) => onYearChange(event.target.value)}
          sx={{
            minWidth: { xs: 0, sm: "74px" },
            width: { xs: "100%", sm: "74px" },
            ...COMMON_SELECT_SX,
          }}
        >
          {yearOptions.map((item) => (
            <MenuItem key={`year-${item}`} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>

        <Typography sx={{ fontSize: "18px", color: "#6b7280" }}>/</Typography>

        <Select
          size="small"
          value={month}
          onChange={(event) => onMonthChange(event.target.value)}
          sx={{
            minWidth: { xs: 0, sm: "76px" },
            width: { xs: "100%", sm: "76px" },
            ...COMMON_SELECT_SX,
          }}
        >
          {monthOptions.map((item) => (
            <MenuItem key={`month-${item}`} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );
}

export function FilterActions({ children }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        width: { xs: "100%", sm: "auto" },
        ml: { xs: 0, sm: "auto" },
        justifyContent: { xs: "flex-start", sm: "flex-end" },
      }}
    >
      {children}
    </Box>
  );
}

export function ActionButtons({ onClear }) {
  return (
    <FilterActions>
      <Button variant="outlined" sx={ACTION_BUTTON_SX}>
        搜尋
      </Button>

      <Button variant="outlined" onClick={onClear} sx={ACTION_BUTTON_SX}>
        清空
      </Button>
    </FilterActions>
  );
}

export function SimpleTable({ columns }) {
  const totalMinWidth = columns.reduce(
    (sum, column) => sum + (column.minWidth || 120),
    0,
  );

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={{ minWidth: `${totalMinWidth}px` }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: columns
              .map((item) => `${item.minWidth || 120}px`)
              .join(" "),
            minHeight: "40px",
            alignItems: "center",
            bgcolor: "#d4d4d4",
            px: "12px",
          }}
        >
          {columns.map((column) => (
            <Typography
              key={column.label}
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

        <Box
          sx={{
            minHeight: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: "12px",
            borderBottom: "1px solid #d1d5db",
          }}
        >
          <Typography sx={{ fontSize: "15px", color: "#111827" }}>
            查無資料
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function MobileSectionTitle({ children }) {
  return (
    <Typography
      sx={{
        display: { xs: "block", md: "none" },
        fontSize: "20px",
        fontWeight: 700,
        color: "#111827",
        mb: "12px",
      }}
    >
      {children}
    </Typography>
  );
}