import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import { buildEmptyMenuItem } from "./OrderSystemHelpers";

export default function MenuItemsInput({
  value = [],
  onChange,
  disabled = false,
}) {
  const rows = value.length > 0 ? value : [buildEmptyMenuItem()];

  const updateRow = (index, field, fieldValue) => {
    const nextRows = rows.map((row, rowIndex) => {
      if (rowIndex !== index) {
        return row;
      } 

      return {
        ...row,
        [field]: fieldValue,
      };
    });

    onChange(nextRows);
  };

  const addRow = () => {
    onChange([...rows, buildEmptyMenuItem()]);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) {
      onChange([buildEmptyMenuItem()]);
      return;
    }

    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <Box>
      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#111827",
          marginBottom: "8px",
        }}
      >
        品項
      </Typography>

      <Stack spacing={1.5}>
        {rows.map((row, index) => (
          <Stack
            key={index}
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
          >
            <TextField
              fullWidth
              size="small"
              label="品項名稱"
              value={row.menu_name || ""}
              disabled={disabled}
              onChange={(event) =>
                updateRow(index, "menu_name", event.target.value)
              }
            />

            <TextField
              size="small"
              label="價格"
              type="number"
              value={row.price ?? ""}
              disabled={disabled}
              onChange={(event) =>
                updateRow(index, "price", event.target.value)
              }
              sx={{
                width: {
                  xs: "100%",
                  sm: "140px",
                },
              }}
              inputProps={{
                min: 0,
              }}
            />

            <Stack
              direction="row"
              spacing={0.5}
              justifyContent={{
                xs: "flex-end",
                sm: "center",
              }}
            >
              <IconButton
                size="small"
                disabled={disabled}
                onClick={() => removeRow(index)}
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        ))}

        <Button
          variant="outlined"
          size="small"
          disabled={disabled}
          startIcon={<AddIcon />}
          onClick={addRow}
          sx={{
            alignSelf: "flex-start",
            borderRadius: "10px",
            textTransform: "none",
          }}
        >
          新增品項
        </Button>
      </Stack>
    </Box>
  );
}