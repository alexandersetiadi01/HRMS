import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  getPayrollItems,
  getPayrollRanges,
  getPayrollSalaryBanks,
} from "../../API/payroll";

const EMPTY_FORM = {
  payroll_range_id: "",
  effective_from: "",
  effective_to: "",
  salary_type: "月薪制",
  welfare_fee_deduct_type: "不扣",
  salary_bank_id: "",
  bank_branch_code: "",
  bank_account_no: "",
  print_payslip_enabled: true,
  status: "啟用",
  remarks: "",
};

let salaryItemRowSequence = 0;

function createSalaryItemRow(itemType, item = null) {
  salaryItemRowSequence += 1;

  return {
    row_id: item?.salary_item_id
      ? `saved-${item.salary_item_id}`
      : `new-${Date.now()}-${salaryItemRowSequence}`,
    salary_item_id:
      Number(item?.salary_item_id || 0) || null,
    payroll_item_id:
      Number(item?.payroll_item_id || 0) || "",
    item_type:
      item?.item_type || itemType,
    amount:
      item?.amount === null ||
      item?.amount === undefined
        ? ""
        : String(item.amount),
  };
}

function createSalaryItemState(recordItems) {
  if (!Array.isArray(recordItems)) {
    return [];
  }

  return recordItems.map((item) =>
    createSalaryItemRow(
      item?.item_type === "扣項"
        ? "扣項"
        : "加項",
      item,
    ),
  );
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function getEmployeeName(employee) {
  return (
    employee?.display_name ||
    employee?.english_name ||
    employee?.email ||
    `員工 #${employee?.employee_id || "--"}`
  );
}

function normalizeDate(value) {
  if (!value || value === "0000-00-00") {
    return "";
  }

  return String(value).slice(0, 10);
}

function createFormState(record) {
  if (!record) {
    return { ...EMPTY_FORM };
  }

  return {
    payroll_range_id:
      record.payroll_range_id || "",
    effective_from: normalizeDate(
      record.effective_from,
    ),
    effective_to: normalizeDate(
      record.effective_to,
    ),
    salary_type:
      record.salary_type || "月薪制",
    welfare_fee_deduct_type:
      record.welfare_fee_deduct_type || "不扣",
    salary_bank_id:
      record.salary_bank_id || "",
    bank_branch_code:
      record.bank_branch_code || "",
    bank_account_no:
      record.bank_account_no || "",
    print_payslip_enabled:
      Number(record.print_payslip_enabled) !== 0,
    status: record.status || "啟用",
    remarks: record.remarks || "",
  };
}

export default function SalaryRecordFormDialog({
  open,
  employee,
  record = null,
  recordItems = [],
  saving = false,
  saveError = "",
  onSubmit,
  onClose,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [ranges, setRanges] = useState([]);
  const [banks, setBanks] = useState([]);
  const [payrollItems, setPayrollItems] =
    useState([]);
  const [salaryItems, setSalaryItems] =
    useState([]);
  const [optionsLoading, setOptionsLoading] =
    useState(false);
  const [optionsError, setOptionsError] =
    useState("");
  const [validationError, setValidationError] =
    useState("");

  const editing = Boolean(record?.salary_record_id);

  const selectedBank = useMemo(
    () =>
      banks.find(
        (bank) =>
          Number(bank.salary_bank_id) ===
          Number(form.salary_bank_id),
      ) || null,
    [banks, form.salary_bank_id],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(createFormState(record));
    setSalaryItems(
      createSalaryItemState(recordItems),
    );
    setValidationError("");
    setOptionsError("");
  }, [open, record, recordItems]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let active = true;

    async function loadOptions() {
      setOptionsLoading(true);
      setOptionsError("");

      try {
        const [
          rangeResult,
          bankResult,
          payrollItemResult,
        ] = await Promise.all([
          getPayrollRanges({
            status: "啟用",
          }),
          getPayrollSalaryBanks({
            status: "啟用",
          }),
          getPayrollItems(),
        ]);

        if (!active) {
          return;
        }

        setRanges(
          Array.isArray(rangeResult)
            ? rangeResult
            : [],
        );

        setBanks(
          Array.isArray(bankResult)
            ? bankResult
            : [],
        );

        setPayrollItems(
          Array.isArray(payrollItemResult)
            ? payrollItemResult.filter(
                (item) =>
                  item.status === "啟用" &&
                  ["加項", "扣項"].includes(
                    item.item_type,
                  ),
              )
            : [],
        );
      } catch (requestError) {
        if (!active) {
          return;
        }

        setOptionsError(
          getErrorMessage(
            requestError,
            "無法讀取薪資範圍、薪轉銀行或薪資科目選項。",
          ),
        );
      } finally {
        if (active) {
          setOptionsLoading(false);
        }
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [open]);

  function handleFieldChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setValidationError("");
  }

  function handlePrintPayslipChange(event) {
    setForm((current) => ({
      ...current,
      print_payslip_enabled:
        event.target.checked,
    }));
  }

    function getAvailablePayrollItems(itemType) {
    return payrollItems.filter(
      (item) => item.item_type === itemType,
    );
  }

  function handleAddSalaryItem(itemType) {
    setSalaryItems((current) => [
      ...current,
      createSalaryItemRow(itemType),
    ]);

    setValidationError("");
  }

  function handleSalaryItemChange(
    rowId,
    field,
    value,
  ) {
    setSalaryItems((current) =>
      current.map((item) =>
        item.row_id === rowId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );

    setValidationError("");
  }

  function handleRemoveSalaryItem(rowId) {
    setSalaryItems((current) =>
      current.filter(
        (item) => item.row_id !== rowId,
      ),
    );

    setValidationError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.payroll_range_id) {
      setValidationError("請選擇薪資範圍。");
      return;
    }

    if (!form.effective_from) {
      setValidationError("請填寫生效開始日期。");
      return;
    }

    if (
      form.effective_to &&
      form.effective_to < form.effective_from
    ) {
      setValidationError(
        "生效結束日期不可早於生效開始日期。",
      );
      return;
    }

    if (!employee?.employee_id) {
      setValidationError("找不到要設定的員工。");
      return;
    }

    const incompleteItem = salaryItems.find(
      (item) =>
        !item.payroll_item_id ||
        item.amount === "" ||
        item.amount === null ||
        Number.isNaN(Number(item.amount)),
    );

    if (incompleteItem) {
      setValidationError(
        "請完整選擇每一筆薪資科目並填寫金額。",
      );
      return;
    }

    const invalidAmountItem = salaryItems.find(
      (item) => Number(item.amount) < 0,
    );

    if (invalidAmountItem) {
      setValidationError(
        "薪資科目金額不可小於 0。",
      );
      return;
    }

    const selectedPayrollItemIds =
      salaryItems.map((item) =>
        Number(item.payroll_item_id),
      );

    if (
      new Set(selectedPayrollItemIds).size !==
      selectedPayrollItemIds.length
    ) {
      setValidationError(
        "同一個薪資科目不可重複加入。",
      );
      return;
    }

    onSubmit?.({
      payroll_range_id: Number(
        form.payroll_range_id,
      ),
      effective_from: form.effective_from,
      effective_to: form.effective_to || null,
      salary_type: form.salary_type,
      welfare_fee_deduct_type:
        form.welfare_fee_deduct_type,
      salary_bank_id: form.salary_bank_id
        ? Number(form.salary_bank_id)
        : null,
      bank_branch_code:
        form.bank_branch_code.trim(),
      bank_account_no:
        form.bank_account_no.trim(),
      print_payslip_enabled:
        form.print_payslip_enabled ? 1 : 0,
      status: form.status,
      remarks: form.remarks.trim(),
      salary_items: salaryItems.map(
        (item) => ({
          salary_item_id:
            item.salary_item_id || null,
          payroll_item_id: Number(
            item.payroll_item_id,
          ),
          amount: Number(item.amount),
          item_type: item.item_type,
        }),
      ),
    });
  }

  const fieldSx = {
    "& .MuiInputBase-root": {
      bgcolor: "#ffffff",
    },
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit,
        sx: {
          width: {
            xs: "calc(100% - 24px)",
            sm: "calc(100% - 48px)",
          },
          maxHeight: "calc(100% - 48px)",
          m: {
            xs: "12px",
            sm: "24px",
          },
          borderRadius: "6px",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: {
            xs: "16px",
            sm: "22px",
          },
          py: "16px",
        }}
      >
        <Typography
          component="div"
          sx={{
            color: "#111827",
            fontSize: {
              xs: "17px",
              sm: "20px",
            },
            fontWeight: 700,
          }}
        >
          {editing
            ? "編輯員工薪資資料"
            : "新增員工薪資資料"}
        </Typography>

        <Typography
          component="div"
          sx={{
            mt: "3px",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          {getEmployeeName(employee)}
          {employee?.employee_no
            ? `（${employee.employee_no}）`
            : ""}
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          px: {
            xs: "14px",
            sm: "22px",
          },
          py: "18px",
          bgcolor: "#f8fafc",
        }}
      >
        {optionsLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: "64px",
            }}
          >
            <CircularProgress size={36} />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: "18px",
            }}
          >
            {optionsError ? (
              <Alert severity="error">
                {optionsError}
              </Alert>
            ) : null}

            {validationError ? (
              <Alert severity="warning">
                {validationError}
              </Alert>
            ) : null}

            {saveError ? (
              <Alert severity="error">
                {saveError}
              </Alert>
            ) : null}

            <Box>
              <Typography
                sx={{
                  mb: "12px",
                  color: "#334155",
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                基本薪資設定
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    sm:
                      "repeat(2, minmax(0, 1fr))",
                  },
                  gap: {
                    xs: "14px",
                    sm: "16px",
                  },
                }}
              >
                <FormControl
                  required
                  fullWidth
                  size="small"
                  sx={fieldSx}
                >
                  <InputLabel id="salary-range-label">
                    薪資範圍
                  </InputLabel>

                  <Select
                    labelId="salary-range-label"
                    name="payroll_range_id"
                    value={form.payroll_range_id}
                    label="薪資範圍"
                    onChange={handleFieldChange}
                  >
                    {ranges.map((range) => (
                      <MenuItem
                        key={range.payroll_range_id}
                        value={
                          range.payroll_range_id
                        }
                      >
                        {range.range_name ||
                          range.range_code ||
                          `薪資範圍 #${range.payroll_range_id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl
                  required
                  fullWidth
                  size="small"
                  sx={fieldSx}
                >
                  <InputLabel id="salary-type-label">
                    薪資類型
                  </InputLabel>

                  <Select
                    labelId="salary-type-label"
                    name="salary_type"
                    value={form.salary_type}
                    label="薪資類型"
                    onChange={handleFieldChange}
                  >
                    <MenuItem value="月薪制">
                      月薪制
                    </MenuItem>

                    <MenuItem value="時薪制">
                      時薪制
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  required
                  name="effective_from"
                  label="生效開始日期"
                  type="date"
                  size="small"
                  fullWidth
                  value={form.effective_from}
                  onChange={handleFieldChange}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                />

                <TextField
                  name="effective_to"
                  label="生效結束日期"
                  type="date"
                  size="small"
                  fullWidth
                  value={form.effective_to}
                  onChange={handleFieldChange}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min:
                      form.effective_from ||
                      undefined,
                  }}
                  sx={fieldSx}
                />

                <FormControl
                  fullWidth
                  size="small"
                  sx={fieldSx}
                >
                  <InputLabel id="welfare-fee-label">
                    福利金扣款方式
                  </InputLabel>

                  <Select
                    labelId="welfare-fee-label"
                    name="welfare_fee_deduct_type"
                    value={
                      form.welfare_fee_deduct_type
                    }
                    label="福利金扣款方式"
                    onChange={handleFieldChange}
                  >
                    <MenuItem value="不扣">
                      不扣
                    </MenuItem>

                    <MenuItem value="固定金額">
                      固定金額
                    </MenuItem>

                    <MenuItem value="依比例">
                      依比例
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControl
                  required
                  fullWidth
                  size="small"
                  sx={fieldSx}
                >
                  <InputLabel id="record-status-label">
                    狀態
                  </InputLabel>

                  <Select
                    labelId="record-status-label"
                    name="status"
                    value={form.status}
                    label="狀態"
                    onChange={handleFieldChange}
                  >
                    <MenuItem value="啟用">
                      啟用
                    </MenuItem>

                    <MenuItem value="停用">
                      停用
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography
                sx={{
                  mb: "12px",
                  color: "#334155",
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                薪轉資料
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    sm:
                      "repeat(2, minmax(0, 1fr))",
                  },
                  gap: {
                    xs: "14px",
                    sm: "16px",
                  },
                }}
              >
                <FormControl
                  fullWidth
                  size="small"
                  sx={{
                    ...fieldSx,
                    gridColumn: {
                      xs: "auto",
                      sm: "1 / -1",
                    },
                  }}
                >
                  <InputLabel id="salary-bank-label">
                    薪轉銀行
                  </InputLabel>

                  <Select
                    labelId="salary-bank-label"
                    name="salary_bank_id"
                    value={form.salary_bank_id}
                    label="薪轉銀行"
                    onChange={handleFieldChange}
                  >
                    <MenuItem value="">
                      不指定
                    </MenuItem>

                    {banks.map((bank) => (
                      <MenuItem
                        key={bank.salary_bank_id}
                        value={bank.salary_bank_id}
                      >
                        {bank.bank_code
                          ? `${bank.bank_code}－`
                          : ""}
                        {bank.bank_name ||
                          `銀行 #${bank.salary_bank_id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  name="bank_branch_code"
                  label="分行代碼"
                  size="small"
                  fullWidth
                  value={form.bank_branch_code}
                  onChange={handleFieldChange}
                  placeholder={
                    selectedBank?.branch_code || ""
                  }
                  sx={fieldSx}
                />

                <TextField
                  name="bank_account_no"
                  label="薪轉帳號"
                  size="small"
                  fullWidth
                  value={form.bank_account_no}
                  onChange={handleFieldChange}
                  inputProps={{
                    inputMode: "numeric",
                    autoComplete: "off",
                  }}
                  sx={fieldSx}
                />
              </Box>
            </Box>

            <Divider />

            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: {
                    xs: "flex-start",
                    sm: "center",
                  },
                  justifyContent: "space-between",
                  flexDirection: {
                    xs: "column",
                    sm: "row",
                  },
                  gap: "8px",
                  mb: "14px",
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: "#334155",
                      fontSize: "15px",
                      fontWeight: 700,
                    }}
                  >
                    薪資科目
                  </Typography>

                  <Typography
                    sx={{
                      mt: "2px",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    設定此員工固定使用的加項及扣項。
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color: "#64748b",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  共 {salaryItems.length} 項
                </Typography>
              </Box>

              {["加項", "扣項"].map(
                (itemType) => {
                  const typeItems =
                    salaryItems.filter(
                      (item) =>
                        item.item_type ===
                        itemType,
                    );

                  const positive =
                    itemType === "加項";

                  return (
                    <Box
                      key={itemType}
                      sx={{
                        mb:
                          itemType === "加項"
                            ? "16px"
                            : 0,
                        p: {
                          xs: "12px",
                          sm: "16px",
                        },
                        border: "1px solid",
                        borderColor: positive
                          ? "#bbf7d0"
                          : "#fecaca",
                        borderRadius: "6px",
                        bgcolor: positive
                          ? "#f0fdf4"
                          : "#fef2f2",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                          gap: "10px",
                          mb:
                            typeItems.length > 0
                              ? "12px"
                              : 0,
                        }}
                      >
                        <Typography
                          sx={{
                            color: positive
                              ? "#166534"
                              : "#991b1b",
                            fontSize: "14px",
                            fontWeight: 700,
                          }}
                        >
                          {itemType}
                          （{typeItems.length}）
                        </Typography>

                        <Button
                          type="button"
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() =>
                            handleAddSalaryItem(
                              itemType,
                            )
                          }
                          disabled={
                            getAvailablePayrollItems(
                              itemType,
                            ).length === 0
                          }
                          sx={{
                            bgcolor: "#ffffff",
                            whiteSpace: "nowrap",
                          }}
                        >
                          新增{itemType}
                        </Button>
                      </Box>

                      {typeItems.length === 0 ? (
                        <Typography
                          sx={{
                            color: "#64748b",
                            fontSize: "13px",
                          }}
                        >
                          尚未加入任何{itemType}科目。
                        </Typography>
                      ) : (
                        <Box
                          sx={{
                            display: "grid",
                            gap: "10px",
                          }}
                        >
                          {typeItems.map(
                            (salaryItem) => (
                              <Box
                                key={
                                  salaryItem.row_id
                                }
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: {
                                    xs:
                                      "minmax(0, 1fr) 42px",
                                    sm:
                                      "minmax(0, 1.6fr) minmax(150px, 0.8fr) 42px",
                                  },
                                  gap: "10px",
                                  alignItems: "center",
                                  p: "10px",
                                  border:
                                    "1px solid #e2e8f0",
                                  borderRadius: "5px",
                                  bgcolor: "#ffffff",
                                }}
                              >
                                <FormControl
                                  required
                                  fullWidth
                                  size="small"
                                  sx={{
                                    ...fieldSx,
                                    gridColumn: {
                                      xs: "1 / -1",
                                      sm: "auto",
                                    },
                                  }}
                                >
                                  <InputLabel>
                                    薪資科目
                                  </InputLabel>

                                  <Select
                                    value={
                                      salaryItem.payroll_item_id
                                    }
                                    label="薪資科目"
                                    onChange={(
                                      event,
                                    ) =>
                                      handleSalaryItemChange(
                                        salaryItem.row_id,
                                        "payroll_item_id",
                                        event.target
                                          .value,
                                      )
                                    }
                                  >
                                    {getAvailablePayrollItems(
                                      itemType,
                                    ).map(
                                      (
                                        payrollItem,
                                      ) => (
                                        <MenuItem
                                          key={
                                            payrollItem.payroll_item_id
                                          }
                                          value={
                                            payrollItem.payroll_item_id
                                          }
                                          disabled={salaryItems.some(
                                            (
                                              currentItem,
                                            ) =>
                                              currentItem.row_id !==
                                                salaryItem.row_id &&
                                              Number(
                                                currentItem.payroll_item_id,
                                              ) ===
                                                Number(
                                                  payrollItem.payroll_item_id,
                                                ),
                                          )}
                                        >
                                          {payrollItem.item_code
                                            ? `${payrollItem.item_code}－`
                                            : ""}
                                          {payrollItem.item_name}
                                        </MenuItem>
                                      ),
                                    )}
                                  </Select>
                                </FormControl>

                                <TextField
                                  required
                                  label="固定金額"
                                  type="number"
                                  size="small"
                                  fullWidth
                                  value={
                                    salaryItem.amount
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    handleSalaryItemChange(
                                      salaryItem.row_id,
                                      "amount",
                                      event.target
                                        .value,
                                    )
                                  }
                                  inputProps={{
                                    min: 0,
                                    step: "0.01",
                                    inputMode:
                                      "decimal",
                                  }}
                                  sx={fieldSx}
                                />

                                <IconButton
                                  type="button"
                                  aria-label={`刪除${itemType}科目`}
                                  onClick={() =>
                                    handleRemoveSalaryItem(
                                      salaryItem.row_id,
                                    )
                                  }
                                  sx={{
                                    width: "42px",
                                    height: "42px",
                                    color: "#dc2626",
                                    border:
                                      "1px solid #fecaca",
                                    borderRadius:
                                      "5px",
                                  }}
                                >
                                  <DeleteOutlineIcon />
                                </IconButton>
                              </Box>
                            ),
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                },
              )}
            </Box>

            <Divider />

            <Box>
              <TextField
                name="remarks"
                label="備註"
                multiline
                minRows={3}
                fullWidth
                value={form.remarks}
                onChange={handleFieldChange}
                sx={fieldSx}
              />

              <FormControlLabel
                sx={{
                  mt: "10px",
                  ml: 0,
                }}
                control={
                  <Checkbox
                    checked={
                      form.print_payslip_enabled
                    }
                    onChange={
                      handlePrintPayslipChange
                    }
                  />
                }
                label="允許列印薪資單"
              />
            </Box>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: {
            xs: "16px",
            sm: "22px",
          },
          py: "12px",
        }}
      >
        <Button
          type="button"
          variant="outlined"
          onClick={onClose}
          disabled={saving}
        >
          取消
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={
            saving ||
            optionsLoading ||
            Boolean(optionsError)
          }
          sx={{
            minWidth: "96px",
          }}
        >
          {saving ? (
            <CircularProgress
              size={22}
              color="inherit"
            />
          ) : editing ? (
            "儲存變更"
          ) : (
            "下一步"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}