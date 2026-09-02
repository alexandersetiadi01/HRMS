import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import {
  createPayrollItem,
  deletePayrollItem,
  getPayrollItems,
  updatePayrollItem,
} from "../../API/payroll";
import FormDialog from "../../Components/FormDialog";
import ResponsiveAttendanceTable from "../Attendance/AttendanceForm/ResponsiveAttendanceTable";

const MAIN_CATEGORIES = [
  "基本薪資",
  "固定津貼",
  "獎金",
  "加班費",
  "請假扣款",
  "保險費",
  "所得稅",
  "補充保費",
  "其他加項",
  "其他扣項",
  "與薪資無關",
];

const ITEM_TYPES = ["加項", "扣項", "中性"];
const TAXABLE_TYPES = ["應稅", "免稅", "與稅無關"];

const INCOME_TAX_FORMATS = [
  ["", "不適用"],
  ["50固定薪資", "50 固定薪資"],
  ["50非固定薪資", "50 非固定薪資"],
  ["9A執行業務所得", "9A 執行業務所得"],
  [
    "9B稿費版稅等七項所得",
    "9B 稿費、版稅等七項所得",
  ],
  [
    "91競技競賽及機會中獎獎金",
    "91 競技競賽及機會中獎獎金",
  ],
  ["92其他所得", "92 其他所得"],
  ["93退職所得", "93 退職所得"],
  ["94員工認股所得", "94 員工認股所得"],
  ["54股利或盈餘所得", "54 股利或盈餘所得"],
];

const SUPPLEMENTARY_PREMIUM_TYPES = [
  ["", "不適用"],
  ["是", "是"],
  ["否_兼職仍計算", "否（兼職薪資仍計算）"],
  ["與補充保費無關", "與補充保費無關"],
  ["獎金", "獎金"],
  ["兼職薪資", "兼職薪資"],
  ["執行業務收入", "執行業務收入"],
];

const PRORATE_METHODS = [
  ["", "不適用"],
  ["依比例給付", "依比例給付"],
  ["全額給付", "全額給付"],
  ["不給付", "不給付"],
];

const PRORATE_DENOMINATORS = [
  ["", "不適用"],
  ["日曆日", "日曆日"],
  ["30日", "30日"],
];

const PRORATE_NUMERATORS = [
  ["", "不適用"],
  ["實際在職天數", "實際在職天數"],
  [
    "30日扣除不在職天數",
    "30日扣除不在職天數",
  ],
];

const ROUNDING_METHODS = [
  ["", "不適用"],
  ["四捨五入", "四捨五入"],
  ["無條件進位", "無條件進位"],
  ["無條件捨去", "無條件捨去"],
  ["不處理", "不處理"],
];

const ROUNDING_PRECISIONS = [
  ["", "不適用"],
  ["0", "整數"],
  ["1", "小數點後一位"],
  ["2", "小數點後二位"],
  ["3", "小數點後三位"],
  ["4", "小數點後四位"],
];

const HOURLY_RATE_INCLUSIONS = [
  ["not_include", "不納入"],
  [
    "salary_adjustment_only",
    "只計入薪資異動單金額",
  ],
  [
    "salary_and_items",
    "同時納入薪資異動單與加扣項金額",
  ],
];

const TABLE_COLUMNS = [
  { key: "item_label", label: "科目代碼／名稱", width: "2fr" },
  { key: "main_category", label: "主分類", width: "1.2fr" },
  { key: "item_type", label: "類型", width: "0.8fr" },
  { key: "status", label: "狀態", width: "0.8fr" },
  { key: "actions", label: "操作", width: "132px" },
];

const EMPTY_FORM = {
  item_code: "",
  item_name: "",
  item_name_en: "",
  main_category: "基本薪資",
  item_type: "加項",
  taxable_type: "應稅",
  income_tax_format: "",
  supplementary_premium_type: "",
  prorate_method: "",
  prorate_denominator: "",
  prorate_numerator: "",
  rounding_method: "",
  rounding_precision: "",
  hourly_rate_inclusion: "not_include",
  is_system_item: false,
  status: "啟用",
};

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function toBoolean(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1"
  );
}

function normalizeHourlyRateInclusion(value) {
  const values = {
    "": "not_include",
    不納入: "not_include",
    not_include: "not_include",
    只計入薪資異動單金額:
      "salary_adjustment_only",
    salary_adjustment_only:
      "salary_adjustment_only",
    同時納入薪資異動單與加扣項金額:
      "salary_and_items",
    salary_and_items: "salary_and_items",
  };

  return (
    values[String(value || "").trim()] ||
    "not_include"
  );
}

function itemToForm(item) {
  return {
    item_code: String(item?.item_code || ""),
    item_name: String(item?.item_name || ""),
    item_name_en: String(
      item?.item_name_en || "",
    ),
    main_category: String(
      item?.main_category || "基本薪資",
    ),
    item_type: String(
      item?.item_type || "加項",
    ),
    taxable_type: String(
      item?.taxable_type || "應稅",
    ),
    income_tax_format: String(
      item?.income_tax_format || "",
    ),
    supplementary_premium_type: String(
      item?.supplementary_premium_type || "",
    ),
    prorate_method: String(
      item?.prorate_method || "",
    ),
    prorate_denominator: String(
      item?.prorate_denominator || "",
    ),
    prorate_numerator: String(
      item?.prorate_numerator || "",
    ),
    rounding_method: String(
      item?.rounding_method || "",
    ),
    rounding_precision:
      item?.rounding_precision === null ||
      item?.rounding_precision === undefined
        ? ""
        : String(item.rounding_precision),
    hourly_rate_inclusion:
      normalizeHourlyRateInclusion(
        item?.hourly_rate_inclusion,
      ),
    is_system_item: toBoolean(
      item?.is_system_item,
    ),
    status: String(item?.status || "啟用"),
  };
}

function buildPayload(form) {
  return {
    ...form,
    item_code: form.item_code.trim(),
    item_name: form.item_name.trim(),
    item_name_en: form.item_name_en.trim(),
    rounding_precision:
      form.rounding_precision === ""
        ? null
        : Number(form.rounding_precision),
    is_system_item: form.is_system_item
      ? 1
      : 0,
  };
}

function getOptionLabel(
  options,
  value,
  fallback = "不適用",
) {
  return (
    options.find(
      ([optionValue]) =>
        optionValue === String(value || ""),
    )?.[1] || fallback
  );
}

function StatusChip({ value }) {
  const enabled = value === "啟用";

  return (
    <Chip
      label={enabled ? "啟用" : "停用"}
      size="small"
      color={enabled ? "success" : "default"}
      variant="outlined"
    />
  );
}

function ItemTypeChip({ value }) {
  const color =
    value === "加項"
      ? "success"
      : value === "扣項"
        ? "error"
        : "default";

  return (
    <Chip
      label={value || "-"}
      size="small"
      color={color}
      variant="outlined"
    />
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel>{label}</InputLabel>

      <Select
        label={label}
        value={value}
        onChange={onChange}
      >
        {options.map((option) => {
          const [optionValue, optionLabel] =
            Array.isArray(option)
              ? option
              : [option, option];

          return (
            <MenuItem
              key={`${label}-${optionValue}`}
              value={optionValue}
            >
              {optionLabel}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}

function SectionTitle({ children }) {
  return (
    <Typography
      sx={{
        gridColumn: "1 / -1",
        mt: "6px",
        pb: "6px",
        borderBottom: "1px solid #e5e7eb",
        color: "#1f2937",
        fontSize: "15px",
        fontWeight: 700,
      }}
    >
      {children}
    </Typography>
  );
}

function ItemFormDialog({
  open,
  item,
  onClose,
  onSaved,
}) {
  const [form, setForm] =
    useState(EMPTY_FORM);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      item
        ? itemToForm(item)
        : { ...EMPTY_FORM },
    );
    setSubmitting(false);
    setError("");
  }, [open, item]);

  function setField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.item_code.trim() ||
      !form.item_name.trim()
    ) {
      setError(
        "請填寫科目代碼與科目名稱。",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (item?.payroll_item_id) {
        await updatePayrollItem(
          item.payroll_item_id,
          buildPayload(form),
        );
      } else {
        await createPayrollItem(
          buildPayload(form),
        );
      }

      onSaved(
        item
          ? "薪資科目已更新。"
          : "薪資科目已新增。",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          item
            ? "更新薪資科目失敗。"
            : "新增薪資科目失敗。",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={
        submitting ? undefined : onClose
      }
      fullWidth
      maxWidth="md"
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        {item
          ? "編輯薪資科目"
          : "新增薪資科目"}
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: "16px",
          }}
        >
          {error ? (
            <Alert
              severity="error"
              sx={{ gridColumn: "1 / -1" }}
            >
              {error}
            </Alert>
          ) : null}

          <SectionTitle>
            基本資料
          </SectionTitle>

          <TextField
            label="科目代碼"
            size="small"
            required
            value={form.item_code}
            onChange={(event) =>
              setField(
                "item_code",
                event.target.value,
              )
            }
            helperText="例如：BASE_SALARY、MEAL_ALLOWANCE、OT_NORMAL"
          />

          <TextField
            label="科目名稱"
            size="small"
            required
            value={form.item_name}
            onChange={(event) =>
              setField(
                "item_name",
                event.target.value,
              )
            }
          />

          <TextField
            label="英文名稱"
            size="small"
            value={form.item_name_en}
            onChange={(event) =>
              setField(
                "item_name_en",
                event.target.value,
              )
            }
            helperText="員工薪資單可顯示中英文名稱"
          />

          <SelectField
            label="主分類"
            value={form.main_category}
            onChange={(event) =>
              setField(
                "main_category",
                event.target.value,
              )
            }
            options={MAIN_CATEGORIES}
          />

          <SelectField
            label="科目類型"
            value={form.item_type}
            onChange={(event) =>
              setField(
                "item_type",
                event.target.value,
              )
            }
            options={ITEM_TYPES}
          />

          <SelectField
            label="狀態"
            value={form.status}
            onChange={(event) =>
              setField(
                "status",
                event.target.value,
              )
            }
            options={["啟用", "停用"]}
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.is_system_item}
                onChange={(event) =>
                  setField(
                    "is_system_item",
                    event.target.checked,
                  )
                }
              />
            }
            label="系統科目（建立後不可刪除，只能停用）"
            sx={{
              gridColumn: "1 / -1",
              m: 0,
            }}
          />

          <SectionTitle>
            所得稅與補充保費
          </SectionTitle>

          <SelectField
            label="所得稅類型"
            value={form.taxable_type}
            onChange={(event) =>
              setField(
                "taxable_type",
                event.target.value,
              )
            }
            options={TAXABLE_TYPES}
          />

          <SelectField
            label="所得稅格式"
            value={form.income_tax_format}
            onChange={(event) =>
              setField(
                "income_tax_format",
                event.target.value,
              )
            }
            options={INCOME_TAX_FORMATS}
          />

          <Box
            sx={{
              gridColumn: {
                xs: "auto",
                sm: "1 / -1",
              },
            }}
          >
            <SelectField
              label="補充保費設定"
              value={
                form.supplementary_premium_type
              }
              onChange={(event) =>
                setField(
                  "supplementary_premium_type",
                  event.target.value,
                )
              }
              options={
                SUPPLEMENTARY_PREMIUM_TYPES
              }
            />
          </Box>

          <SectionTitle>
            破月計算規則
          </SectionTitle>

          <SelectField
            label="破月計算方式"
            value={form.prorate_method}
            onChange={(event) =>
              setField(
                "prorate_method",
                event.target.value,
              )
            }
            options={PRORATE_METHODS}
          />

          <SelectField
            label="破月分母"
            value={form.prorate_denominator}
            onChange={(event) =>
              setField(
                "prorate_denominator",
                event.target.value,
              )
            }
            options={PRORATE_DENOMINATORS}
          />

          <SelectField
            label="破月分子"
            value={form.prorate_numerator}
            onChange={(event) =>
              setField(
                "prorate_numerator",
                event.target.value,
              )
            }
            options={PRORATE_NUMERATORS}
          />

          <SelectField
            label="小數點規則"
            value={form.rounding_method}
            onChange={(event) =>
              setField(
                "rounding_method",
                event.target.value,
              )
            }
            options={ROUNDING_METHODS}
          />

          <SelectField
            label="小數點位數"
            value={form.rounding_precision}
            onChange={(event) =>
              setField(
                "rounding_precision",
                event.target.value,
              )
            }
            options={ROUNDING_PRECISIONS}
          />

          <SectionTitle>
            時薪計算
          </SectionTitle>

          <Box
            sx={{ gridColumn: "1 / -1" }}
          >
            <SelectField
              label="時薪計算納入方式"
              value={
                form.hourly_rate_inclusion
              }
              onChange={(event) =>
                setField(
                  "hourly_rate_inclusion",
                  event.target.value,
                )
              }
              options={
                HOURLY_RATE_INCLUSIONS
              }
            />
          </Box>

          <Alert
            severity="info"
            sx={{ gridColumn: "1 / -1" }}
          >
            時薪納入方式會影響請假扣款、加班費及不休假代金的平均時薪計算。
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: "24px",
          py: "14px",
        }}
      >
        <Button
          onClick={onClose}
          disabled={submitting}
        >
          取消
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
        >
          {submitting
            ? "儲存中…"
            : "儲存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DetailField({ label, children }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: "12px",
        border: "1px solid #e5e7eb",
        borderRadius: "5px",
        bgcolor: "#f8fafc",
      }}
    >
      <Typography sx={{ color: "#7b8794", fontSize: "12px" }}>
        {label}
      </Typography>

      <Box
        sx={{
          mt: "4px",
          color: "#1f2937",
          fontSize: "14px",
          fontWeight: 600,
          overflowWrap: "anywhere",
        }}
      >
        {children || "-"}
      </Box>
    </Box>
  );
}

function ItemDetailDialog({ item, onClose }) {
  return (
    <FormDialog
      open={Boolean(item)}
      title="薪資科目詳細資料"
      submitLabel="關閉"
      cancelLabel=""
      maxWidth="md"
      onClose={onClose}
      onSubmit={onClose}
    >
      {item ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: "12px",
          }}
        >
          <DetailField label="科目代碼">
            {item.item_code || "-"}
          </DetailField>

          <DetailField label="科目名稱">
            {item.item_name || "-"}
          </DetailField>

          <DetailField label="英文名稱">
            {item.item_name_en || "-"}
          </DetailField>

          <DetailField label="主分類">
            {item.main_category || "-"}
          </DetailField>

          <DetailField label="類型">
            <ItemTypeChip value={item.item_type} />
          </DetailField>

          <DetailField label="狀態">
            <StatusChip value={item.status} />
          </DetailField>

          <DetailField label="系統科目">
            {toBoolean(item.is_system_item) ? "是" : "否"}
          </DetailField>

          <DetailField label="所得稅類型">
            {item.taxable_type || "-"}
          </DetailField>

          <DetailField label="所得稅格式">
            {getOptionLabel(INCOME_TAX_FORMATS, item.income_tax_format)}
          </DetailField>

          <DetailField label="補充保費設定">
            {getOptionLabel(
              SUPPLEMENTARY_PREMIUM_TYPES,
              item.supplementary_premium_type,
            )}
          </DetailField>

          <DetailField label="破月計算方式">
            {getOptionLabel(PRORATE_METHODS, item.prorate_method)}
          </DetailField>

          <DetailField label="破月分母">
            {getOptionLabel(PRORATE_DENOMINATORS, item.prorate_denominator)}
          </DetailField>

          <DetailField label="破月分子">
            {getOptionLabel(PRORATE_NUMERATORS, item.prorate_numerator)}
          </DetailField>

          <DetailField label="小數點規則">
            {getOptionLabel(ROUNDING_METHODS, item.rounding_method)}
          </DetailField>

          <DetailField label="小數點位數">
            {getOptionLabel(
              ROUNDING_PRECISIONS,
              item.rounding_precision === null ||
                item.rounding_precision === undefined
                ? ""
                : String(item.rounding_precision),
            )}
          </DetailField>

          <DetailField label="時薪計算納入方式">
            {getOptionLabel(
              HOURLY_RATE_INCLUSIONS,
              normalizeHourlyRateInclusion(item.hourly_rate_inclusion),
            )}
          </DetailField>
        </Box>
      ) : null}
    </FormDialog>
  );
}

export default function PayrollItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] =
    useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("全部");
  const [typeFilter, setTypeFilter] =
    useState("全部");
  const [statusFilter, setStatusFilter] =
    useState("全部");

  const [formOpen, setFormOpen] =
    useState(false);
  const [editingItem, setEditingItem] =
    useState(null);
  const [detailItem, setDetailItem] =
    useState(null);
  const [deleteTarget, setDeleteTarget] =
    useState(null);
  const [deleting, setDeleting] =
    useState(false);

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const data = await getPayrollItems();

      setItems(
        Array.isArray(data) ? data : [],
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "讀取薪資科目失敗。",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !keyword ||
        [
          item.item_code,
          item.item_name,
          item.item_name_en,
          item.main_category,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(keyword),
        );

      const matchesCategory =
        categoryFilter === "全部" ||
        item.main_category ===
          categoryFilter;

      const matchesType =
        typeFilter === "全部" ||
        item.item_type === typeFilter;

      const matchesStatus =
        statusFilter === "全部" ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    items,
    search,
    categoryFilter,
    typeFilter,
    statusFilter,
  ]);
  function renderTableValue(item, column) {
    switch (column.key) {
      case "item_label":
        return (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "#1f2937",
                fontSize: "14px",
                fontWeight: 700,
                overflowWrap: "anywhere",
              }}
            >
              {item.item_name || "-"}
            </Typography>

            <Typography
              sx={{
                mt: "2px",
                color: "#64748b",
                fontSize: "12px",
                overflowWrap: "anywhere",
              }}
            >
              {item.item_code || "-"}
            </Typography>
          </Box>
        );

      case "main_category":
        return item.main_category || "-";

      case "item_type":
        return <ItemTypeChip value={item.item_type} />;

      case "status":
        return <StatusChip value={item.status} />;

      case "actions":
        return (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <Tooltip title="查看詳細資料">
              <IconButton
                size="small"
                aria-label="查看薪資科目詳細資料"
                onClick={() => setDetailItem(item)}
                sx={{ color: "#475569" }}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="編輯">
              <IconButton
                size="small"
                aria-label="編輯薪資科目"
                onClick={() => openEditDialog(item)}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="刪除／停用">
              <IconButton
                size="small"
                color="error"
                aria-label="刪除或停用薪資科目"
                onClick={() => setDeleteTarget(item)}
              >
                <DeleteOutlineOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );

      default:
        return item[column.key] || "-";
    }
  }
  function openCreateDialog() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEditDialog(item) {
    setEditingItem(item);
    setFormOpen(true);
  }

  async function handleSaved(
    successMessage,
  ) {
    setFormOpen(false);
    setEditingItem(null);
    setMessage(successMessage);

    await loadItems();
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const result =
        await deletePayrollItem(
          deleteTarget.payroll_item_id,
        );

      setDeleteTarget(null);

      setMessage(
        result?.message ||
          (result?.disabled
            ? "薪資科目已停用。"
            : "薪資科目已刪除。"),
      );

      await loadItems();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "刪除或停用薪資科目失敗。",
        ),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "360px",
        p: {
          xs: "14px",
          sm: "18px",
          md: "22px",
        },
        border: "1px solid #dfe4e8",
        borderRadius: "5px",
        bgcolor: "#ffffff",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "stretch",
            sm: "center",
          },
          justifyContent: "space-between",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: "12px",
          mb: "18px",
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#111827",
              fontSize: {
                xs: "18px",
                sm: "20px",
              },
              fontWeight: 700,
            }}
          >
            薪資科目
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#7b8794",
              fontSize: "13px",
            }}
          >
            管理薪資科目、稅務設定、破月規則及時薪計算納入方式
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          新增薪資科目
        </Button>
      </Box>

      {error ? (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: "14px" }}
        >
          {error}
        </Alert>
      ) : null}

      {message ? (
        <Alert
          severity="success"
          onClose={() => setMessage("")}
          sx={{ mb: "14px" }}
        >
          {message}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "2fr repeat(3, minmax(130px, 1fr)) auto",
          },
          gap: "10px",
          mb: "16px",
        }}
      >
        <TextField
          size="small"
          label="搜尋科目"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          InputProps={{
            startAdornment: (
              <SearchIcon
                sx={{
                  mr: "8px",
                  color: "#94a3b8",
                }}
              />
            ),
          }}
        />

        <SelectField
          label="主分類"
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(
              event.target.value,
            )
          }
          options={[
            "全部",
            ...MAIN_CATEGORIES,
          ]}
        />

        <SelectField
          label="類型"
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
          options={[
            "全部",
            ...ITEM_TYPES,
          ]}
        />

        <SelectField
          label="狀態"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value,
            )
          }
          options={[
            "全部",
            "啟用",
            "停用",
          ]}
        />

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadItems}
          disabled={loading}
        >
          重新整理
        </Button>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: "56px",
          }}
        >
          <CircularProgress size={34} />
        </Box>
      ) : (
        <ResponsiveAttendanceTable
          columns={TABLE_COLUMNS}
          rows={filteredItems}
          getRowKey={(item) => item.payroll_item_id}
          emptyText="沒有符合條件的薪資科目。"
          renderValue={renderTableValue}
          pagination
          rowsPerPage={10}
          desktopMinWidth="100%"
        />
      )}

      <ItemFormDialog
        open={formOpen}
        item={editingItem}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onSaved={handleSaved}
      />

      <ItemDetailDialog
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={
          deleting
            ? undefined
            : () => setDeleteTarget(null)
        }
      >
        <DialogTitle
          sx={{
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          刪除或停用薪資科目
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#475569",
              fontSize: "14px",
            }}
          >
            確定要處理「
            {deleteTarget?.item_name}（
            {deleteTarget?.item_code}
            ）」嗎？系統科目或已有薪資資料的科目會改為停用；只有未使用的自訂科目會永久刪除。
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: "24px",
            pb: "18px",
          }}
        >
          <Button
            onClick={() =>
              setDeleteTarget(null)
            }
            disabled={deleting}
          >
            取消
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting
              ? "處理中…"
              : "確認處理"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}