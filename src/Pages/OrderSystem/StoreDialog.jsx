import { useEffect, useMemo, useState } from "react";

import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import MenuItemsInput from "./MenuItemsInput";

import CityCountyData from "../../assets/CityCountyData.json";

import {
  buildEmptyStoreForm,
  getStoreMenus,
  normalizeStorePayload,
} from "./OrderSystemHelpers";

const STORE_CATEGORY_OPTIONS = [
  "便當",
  "蛋糕",
  "禮品",
  "飲料",
  "中式",
  "其他",
  "南洋",
  "麵包",
  "麵食",
  "冰品",
  "日式",
  "餅類",
  "早餐",
  "素食",
  "小吃",
  "西式",
];

function FieldRow({ required = false, label, children, alignStart = false }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "90px minmax(0, 1fr)",
        columnGap: "10px",
        alignItems: alignStart ? "flex-start" : "center",
      }}
    >
      <Typography
        sx={{
          fontSize: "15px",
          color: "#333333",
          pt: alignStart ? "8px" : 0,
          textAlign: "right",
        }}
      >
        {required ? (
          <Box component="span" sx={{ color: "#ff0000", mr: "3px" }}>
            *
          </Box>
        ) : null}
        {label}
      </Typography>

      <Box>{children}</Box>
    </Box>
  );
}

export default function StoreDialog({
  open,
  mode = "create",
  initialValue = null,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(buildEmptyStoreForm());

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!initialValue) {
      setForm(buildEmptyStoreForm());
      return;
    }

    setForm({
      store_name: initialValue.store_name || "",
      branch_name: initialValue.branch_name || "",
      phone: initialValue.phone || "",
      country: initialValue.country || "台灣",
      city: initialValue.city || "",
      district: initialValue.district || "",
      address: initialValue.address || "",
      categories: Array.isArray(initialValue.categories)
        ? initialValue.categories
            .map((category) => {
              if (typeof category === "string") {
                return category;
              }

              return category?.category_name || "";
            })
            .filter(Boolean)
        : [],
      menu_items: getStoreMenus(initialValue),
    });
  }, [open, initialValue]);

  const cityOptions = useMemo(() => {
    return CityCountyData.map((item) => item.CityName);
  }, []);

  const districtOptions = useMemo(() => {
    const city = CityCountyData.find((item) => item.CityName === form.city);

    if (!city) {
      return [];
    }

    return city.AreaList.map((area) => area.AreaName);
  }, [form.city]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleCategory = (categoryName) => {
    setForm((previous) => {
      const current = Array.isArray(previous.categories)
        ? previous.categories
        : [];

      const exists = current.includes(categoryName);

      return {
        ...previous,
        categories: exists
          ? current.filter((item) => item !== categoryName)
          : [...current, categoryName],
      };
    });
  };

  const handleSubmit = () => {
    onSubmit(normalizeStorePayload(form));
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "4px",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "20px",
          fontWeight: 700,
          px: "24px",
          py: "16px",
        }}
      >
        {mode === "update" ? "編輯店家" : "新增店家"}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          px: "24px",
          py: "18px",
        }}
      >
        <Stack spacing={2}>
          <FieldRow required label="店名">
            <TextField
              fullWidth
              size="small"
              value={form.store_name}
              onChange={(event) =>
                updateField("store_name", event.target.value)
              }
            />
          </FieldRow>

          <FieldRow label="分店">
            <TextField
              fullWidth
              size="small"
              value={form.branch_name}
              onChange={(event) =>
                updateField("branch_name", event.target.value)
              }
            />
          </FieldRow>

          <FieldRow label="電話">
            <TextField
              fullWidth
              size="small"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </FieldRow>

          <FieldRow required label="類別" alignStart>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                columnGap: "46px",
                rowGap: "2px",
                maxWidth: "760px",
              }}
            >
              {STORE_CATEGORY_OPTIONS.map((categoryName) => (
                <FormControlLabel
                  key={categoryName}
                  control={
                    <Checkbox
                      size="small"
                      checked={form.categories.includes(categoryName)}
                      onChange={() => toggleCategory(categoryName)}
                    />
                  }
                  label={categoryName}
                  sx={{
                    m: 0,
                    "& .MuiFormControlLabel-label": {
                      fontSize: "15px",
                    },
                  }}
                />
              ))}
            </Box>
          </FieldRow>

          <FieldRow required label="地址">
            <Stack spacing={1}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  select
                  size="small"
                  value={form.country}
                  onChange={(event) =>
                    updateField("country", event.target.value)
                  }
                  sx={{ flex: 1 }}
                >
                  <MenuItem value="台灣">台灣</MenuItem>
                </TextField>

                <Autocomplete
                  options={cityOptions}
                  value={form.city}
                  onChange={(_, value) => {
                    updateField("city", value || "");
                    updateField("district", "");
                  }}
                  sx={{ flex: 1 }}
                  renderInput={(params) => (
                    <TextField {...params} size="small" placeholder="縣市" />
                  )}
                />

                <Autocomplete
                  options={districtOptions}
                  value={form.district}
                  onChange={(_, value) => updateField("district", value || "")}
                  sx={{ flex: 1 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="鄉鎮區域"
                    />
                  )}
                />
              </Stack>

              <TextField
                fullWidth
                size="small"
                placeholder="請輸入地址"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
              />
            </Stack>
          </FieldRow>

          <Box
            sx={{
              borderTop: "1px solid #e5e7eb",
              pt: "18px",
              mt: "8px",
            }}
          >
            <MenuItemsInput
              value={form.menu_items}
              onChange={(value) => updateField("menu_items", value)}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          padding: "16px 24px",
        }}
      >
        <Button disabled={loading} onClick={onClose}>
          取消
        </Button>

        <Button
          variant="contained"
          disabled={loading}
          onClick={handleSubmit}
          sx={{
            boxShadow: "none",
          }}
        >
          {mode === "update" ? "儲存更新" : "建立店家"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
