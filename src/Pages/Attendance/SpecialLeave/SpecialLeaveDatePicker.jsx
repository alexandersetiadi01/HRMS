import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export default function SpecialLeaveDatePicker({
  value,
  onChange,
  approvedDateSet = new Set(),
  holidayDateSet = new Set(),
  isMobile,
  width = "170px",
}) {
  const pickerValue = value && dayjs(value).isValid() ? dayjs(value) : null;

  const shouldDisableSpecialLeaveDate = (dateValue) => {
    if (!dateValue || !dayjs(dateValue).isValid()) {
      return false;
    }

    const weekday = dayjs(dateValue).day();

    if (weekday === 0 || weekday === 6) {
      return true;
    }

    const dateKey = dayjs(dateValue).format("YYYY-MM-DD");

    return approvedDateSet.has(dateKey) || holidayDateSet.has(dateKey);
  };

  return (
    <DatePicker
      value={pickerValue}
      onChange={onChange}
      format="YYYY-MM-DD"
      shouldDisableDate={shouldDisableSpecialLeaveDate}
      slotProps={{
        textField: {
          size: "small",
          sx: {
            width: isMobile ? "100%" : width,
            minWidth: isMobile ? "100%" : width,
            "& .MuiInputBase-root": {
              height: "40px",
            },
            "& .MuiInputBase-input": {
              px: "12px",
              py: "8px",
              fontSize: "15px",
              minWidth: 0,
            },
          },
        },
        field: {
          clearable: false,
        },
      }}
    />
  );
}