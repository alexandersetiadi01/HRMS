import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { LabelCell, renderDateField } from "../../Components/GlobalComponent";
import Countries from "../../Components/Countries.json";

const rows = [
  ["姓", ""],
  ["名", ""],
  ["英文姓名", ""],
  ["國籍", ""],
  ["性別", ""],
  ["兵役狀態", ""],
  ["役別", ""],
  ["兵役期間", "-"],
  ["證件類型", ""],
  ["證件號碼", ""],
  ["證件到期日", ""],
  ["證件類型2", ""],
  ["證件號碼2", ""],
  ["證件到期日2", ""],
  ["證件類型3", ""],
  ["證件號碼3", ""],
  ["證件到期日3", ""],
  ["入境時間", ""],
  ["生日", ""],
  ["婚姻狀態", ""],
];

const textFieldSx = {
  "& .MuiInputBase-root": {
    height: "38px",
    fontSize: "15px",
    bgcolor: "#ffffff",
  },
  "& .MuiOutlinedInput-input": {
    px: "12px",
    py: "8px",
  },
};

const dialogLabelSx = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  pt: 0,
  pr: "4px",
  fontSize: "15px",
  color: "#374151",
  whiteSpace: "nowrap",
  lineHeight: 1.2,
};

const SELECT_MENU_PROPS = {
  PaperProps: {
    sx: {
      maxHeight: 240,
    },
  },
  MenuListProps: {
    sx: {
      py: 0,
    },
  },
};

const NATIONALITY_OPTIONS = Countries;

const MILITARY_TYPE_OPTIONS = [
  "軍官役",
  "士官役",
  "士兵役",
  "替代役",
  "志願役",
];

const DOCUMENT_TYPE_OPTIONS = [
  "台灣身分證",
  "護照",
  "台灣居留證",
  "其他國家身分證件",
];

function renderSelectOptions(options, includeEmpty = false) {
  const list = includeEmpty ? ["", ...options] : options;

  return list.map((option) => (
    <MenuItem key={option || "__empty__"} value={option}>
      {option || " "}
    </MenuItem>
  ));
}

function BasicInformationEditDialog({ open, onClose }) {
  const theme = useTheme();
  const isDialogMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    englishName: "",
    nationality: "台灣",
    gender: "",
    militaryStatus: "",
    militaryType: "",
    militaryStartDate: "",
    militaryEndDate: "",
    idType1: "",
    idNumber1: "",
    idExpiry1: "",
    idType2: "",
    idNumber2: "",
    idExpiry2: "",
    idType3: "",
    idNumber3: "",
    idExpiry3: "",
    entryDate: "",
    birthday: "",
    maritalStatus: "",
    amendmentReason: "",
    attachment: null,
  });

  const setField = (key) => (event) => {
    const value =
      key === "attachment"
        ? event.target.files?.[0] || null
        : event.target.value;

    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const formGridTemplateColumns = isDialogMobile
    ? "98px minmax(0, 1fr)"
    : "140px minmax(0, 1fr)";

  const labelSx = {
    ...dialogLabelSx,
    ...(isDialogMobile
      ? {
          fontSize: "14px",
          justifyContent: "flex-end",
          pr: "8px",
        }
      : {}),
  };

  const commonRadioLabelSx = {
    fontSize: isDialogMobile ? "14px" : "14px",
    lineHeight: 1.2,
  };

  const commonRadioControlSx = {
    p: "4px",
  };

  const genderGroupSx = isDialogMobile
    ? {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 72px))",
        columnGap: "16px",
        rowGap: "8px",
        alignItems: "center",
      }
    : {
        display: "grid",
        gridTemplateColumns: "repeat(2, 72px)",
        columnGap: "20px",
        rowGap: "8px",
        alignItems: "center",
      };

  const militaryStatusGroupSx = isDialogMobile
    ? {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 88px))",
        columnGap: "0px",
        rowGap: "8px",
        alignItems: "center",
      }
    : {
        display: "grid",
        gridTemplateColumns: "repeat(4, 88px)",
        columnGap: "4px",
        rowGap: "8px",
        alignItems: "center",
      };

  const maritalStatusGroupSx = isDialogMobile
    ? {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 88px))",
        columnGap: "0px",
        rowGap: "8px",
        alignItems: "center",
      }
    : {
        display: "grid",
        gridTemplateColumns: "repeat(2, 88px)",
        columnGap: "8px",
        rowGap: "8px",
        alignItems: "center",
      };

  const radioItemSx = {
    m: 0,
    width: "100%",
    alignItems: "center",
    "& .MuiFormControlLabel-label": {
      display: "block",
      width: "100%",
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={isDialogMobile}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: isDialogMobile ? "100%" : "900px",
          maxWidth: isDialogMobile ? "100%" : "95vw",
          height: isDialogMobile ? "100%" : "auto",
          maxHeight: isDialogMobile ? "100%" : "calc(100vh - 32px)",
          m: 0,
          borderRadius: 0,
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          height: isDialogMobile ? "64px" : "70px",
          px: isDialogMobile ? "12px" : "12px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#1e88cf",
          color: "#ffffff",
        }}
      >
        <Typography
          sx={{
            fontSize: isDialogMobile ? "16px" : "18px",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          申請修改資料
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            p: 0,
            color: "#ffffff",
          }}
        >
          <CloseIcon sx={{ fontSize: isDialogMobile ? "22px" : "24px" }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: isDialogMobile ? "20px" : "14px",
          py: "12px",
          bgcolor: "#f3f3f3",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: formGridTemplateColumns,
            columnGap: isDialogMobile ? "0px" : "16px",
            rowGap: "10px",
            alignItems: "center",
          }}
        >
          <LabelCell required sx={labelSx}>
            姓：
          </LabelCell>
          <TextField
            value={form.lastName}
            onChange={setField("lastName")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell required sx={labelSx}>
            名：
          </LabelCell>
          <TextField
            value={form.firstName}
            onChange={setField("firstName")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell sx={labelSx}>英文姓名：</LabelCell>
          <TextField
            value={form.englishName}
            onChange={setField("englishName")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell required sx={labelSx}>
            國籍：
          </LabelCell>
          <TextField
            select
            value={form.nationality}
            onChange={setField("nationality")}
            fullWidth
            sx={textFieldSx}
            SelectProps={{ MenuProps: SELECT_MENU_PROPS }}
          >
            {renderSelectOptions(NATIONALITY_OPTIONS)}
          </TextField>

          <LabelCell required sx={labelSx}>
            性別：
          </LabelCell>
          <RadioGroup
            row={!isDialogMobile}
            value={form.gender}
            onChange={setField("gender")}
            sx={genderGroupSx}
          >
            <FormControlLabel
              value="男"
              control={<Radio size="small" sx={commonRadioControlSx} />}
              label={<Typography sx={commonRadioLabelSx}>男</Typography>}
              sx={radioItemSx}
            />
            <FormControlLabel
              value="女"
              control={<Radio size="small" sx={commonRadioControlSx} />}
              label={<Typography sx={commonRadioLabelSx}>女</Typography>}
              sx={radioItemSx}
            />
          </RadioGroup>

          <LabelCell sx={labelSx}>兵役狀態：</LabelCell>
          <RadioGroup
            row={!isDialogMobile}
            value={form.militaryStatus}
            onChange={setField("militaryStatus")}
            sx={militaryStatusGroupSx}
          >
            <FormControlLabel
              value="役畢"
              control={<Radio size="small" sx={commonRadioControlSx} />}
              label={<Typography sx={commonRadioLabelSx}>役畢</Typography>}
              sx={radioItemSx}
            />
            <FormControlLabel
              value="免役"
              control={<Radio size="small" sx={commonRadioControlSx} />}
              label={<Typography sx={commonRadioLabelSx}>免役</Typography>}
              sx={radioItemSx}
            />
            <FormControlLabel
              value="未役"
              control={<Radio size="small" sx={commonRadioControlSx} />}
              label={<Typography sx={commonRadioLabelSx}>未役</Typography>}
              sx={radioItemSx}
            />
            <FormControlLabel
              value="服役中"
              control={<Radio size="small" sx={commonRadioControlSx} />}
              label={<Typography sx={commonRadioLabelSx}>服役中</Typography>}
              sx={radioItemSx}
            />
          </RadioGroup>

          <LabelCell sx={labelSx}>役別：</LabelCell>
          <TextField
            select
            value={form.militaryType}
            onChange={setField("militaryType")}
            fullWidth
            sx={textFieldSx}
            SelectProps={{ MenuProps: SELECT_MENU_PROPS }}
          >
            {renderSelectOptions(MILITARY_TYPE_OPTIONS, true)}
          </TextField>

          <LabelCell sx={labelSx}>兵役開始時間：</LabelCell>
          <Box sx={{ width: "100%", minWidth: 0 }}>
            {renderDateField(
              form.militaryStartDate,
              setField("militaryStartDate"),
            )}
          </Box>

          <LabelCell sx={labelSx}>兵役結束時間：</LabelCell>
          <Box sx={{ width: "100%", minWidth: 0 }}>
            {renderDateField(form.militaryEndDate, setField("militaryEndDate"))}
          </Box>

          <LabelCell required sx={labelSx}>
            證件類型：
          </LabelCell>
          <TextField
            select
            value={form.idType1}
            onChange={setField("idType1")}
            fullWidth
            sx={textFieldSx}
            SelectProps={{ MenuProps: SELECT_MENU_PROPS }}
          >
            {renderSelectOptions(DOCUMENT_TYPE_OPTIONS)}
          </TextField>

          <LabelCell required sx={labelSx}>
            證件號碼：
          </LabelCell>
          <TextField
            value={form.idNumber1}
            onChange={setField("idNumber1")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell sx={labelSx}>證件到期日：</LabelCell>
          <Box sx={{ width: "100%", minWidth: 0 }}>
            {renderDateField(form.idExpiry1, setField("idExpiry1"))}
          </Box>

          <LabelCell sx={labelSx}>證件類型2：</LabelCell>
          <TextField
            select
            value={form.idType2}
            onChange={setField("idType2")}
            fullWidth
            sx={textFieldSx}
            SelectProps={{ MenuProps: SELECT_MENU_PROPS }}
          >
            {renderSelectOptions(DOCUMENT_TYPE_OPTIONS, true)}
          </TextField>

          <LabelCell sx={labelSx}>證件號碼2：</LabelCell>
          <TextField
            value={form.idNumber2}
            onChange={setField("idNumber2")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell sx={labelSx}>證件到期日2：</LabelCell>
          <Box sx={{ width: "100%", minWidth: 0 }}>
            {renderDateField(form.idExpiry2, setField("idExpiry2"))}
          </Box>

          <LabelCell sx={labelSx}>證件類型3：</LabelCell>
          <TextField
            select
            value={form.idType3}
            onChange={setField("idType3")}
            fullWidth
            sx={textFieldSx}
            SelectProps={{ MenuProps: SELECT_MENU_PROPS }}
          >
            {renderSelectOptions(DOCUMENT_TYPE_OPTIONS, true)}
          </TextField>

          <LabelCell sx={labelSx}>證件號碼3：</LabelCell>
          <TextField
            value={form.idNumber3}
            onChange={setField("idNumber3")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell sx={labelSx}>證件到期日3：</LabelCell>
          <Box sx={{ width: "100%", minWidth: 0 }}>
            {renderDateField(form.idExpiry3, setField("idExpiry3"))}
          </Box>

          <LabelCell sx={labelSx}>入境時間：</LabelCell>
          <Box sx={{ width: "100%", minWidth: 0 }}>
            {renderDateField(form.entryDate, setField("entryDate"))}
          </Box>

          <LabelCell required sx={labelSx}>
            生日：
          </LabelCell>
          <Box sx={{ width: "100%", minWidth: 0 }}>
            {renderDateField(form.birthday, setField("birthday"))}
          </Box>

          <LabelCell sx={labelSx}>婚姻狀態：</LabelCell>
          <RadioGroup
            row={!isDialogMobile}
            value={form.maritalStatus}
            onChange={setField("maritalStatus")}
            sx={maritalStatusGroupSx}
          >
            <FormControlLabel
              value="已婚"
              control={<Radio size="small" sx={commonRadioControlSx} />}
              label={<Typography sx={commonRadioLabelSx}>已婚</Typography>}
              sx={radioItemSx}
            />
            <FormControlLabel
              value="未婚"
              control={<Radio size="small" sx={commonRadioControlSx} />}
              label={<Typography sx={commonRadioLabelSx}>未婚</Typography>}
              sx={radioItemSx}
            />
          </RadioGroup>
        </Box>

        <Box
          sx={{
            mt: "18px",
            pt: "14px",
            borderTop: "1px solid #dddddd",
            display: "grid",
            gridTemplateColumns: formGridTemplateColumns,
            columnGap: isDialogMobile ? "0px" : "16px",
            rowGap: "10px",
            alignItems: "center",
          }}
        >
          <LabelCell required sx={labelSx}>
            修改原因：
          </LabelCell>
          <TextField
            value={form.amendmentReason}
            onChange={setField("amendmentReason")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell sx={labelSx}>上傳證明文件：</LabelCell>

          <Box sx={{ minWidth: 0 }}>
            <TextField
              fullWidth
              type="file"
              onChange={setField("attachment")}
              inputProps={{
                accept: ".doc,.docx,.txt,.pdf,.jpg,.jpeg,.png",
              }}
              sx={{
                "& .MuiInputBase-root": {
                  height: "38px",
                  bgcolor: "#ffffff",
                  fontSize: "13px",
                },
                "& .MuiOutlinedInput-input": {
                  px: "10px",
                  py: "8px",
                },
                "& input[type='file']": {
                  minWidth: 0,
                  width: "100%",
                },
                "& input[type='file']::file-selector-button": {
                  marginRight: "8px",
                  height: "24px",
                },
              }}
            />
          </Box>

          <Box />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "12px",
                color: "#9ca3af",
                lineHeight: 1.8,
                wordBreak: "break-word",
              }}
            >
              * 格式限Microsoft Office文件、TXT純文字、壓縮檔、PDF
              <br />* 檔案大小限制為 300KB
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: isDialogMobile ? "12px" : "14px",
          py: "12px",
          bgcolor: "#f3f3f3",
          justifyContent: "flex-end",
          gap: "8px",
          flexShrink: 0,
          borderTop: isDialogMobile ? "1px solid #dddddd" : "none",
          position: isDialogMobile ? "sticky" : "static",
          bottom: 0,
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            minWidth: "54px",
            height: "30px",
            fontSize: "13px",
            bgcolor: "primary",
            boxShadow: "none",
          }}
        >
          確定
        </Button>

        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            minWidth: "54px",
            height: "30px",
            fontSize: "13px",
            color: "#ffff",
            bgcolor: "#ff0404",
            border: "none",
          }}
        >
          取消
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function BasicInformationTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [openEditDialog, setOpenEditDialog] = useState(false);

  if (isMobile) {
    return (
      <Box sx={{ bgcolor: "#ffffff" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            px: "12px",
            pt: "8px",
          }}
        >
          <IconButton size="small" onClick={() => setOpenEditDialog(true)}>
            <EditIcon sx={{ fontSize: "18px", color: "#111827" }} />
          </IconButton>
        </Box>

        <Box
          sx={{
            mx: "12px",
            overflow: "hidden",
          }}
        >
          {rows.map(([label, value], index) => (
            <Box
              key={label}
              sx={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                borderBottom:
                  index !== rows.length - 1 ? "1px solid #e5e7eb" : "none",
              }}
            >
              <Box
                sx={{
                  bgcolor: "#f3f4f6",
                  px: "10px",
                  py: "10px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  {label}
                </Typography>
              </Box>

              <Box
                sx={{
                  px: "12px",
                  py: "10px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "15px",
                    color: "#111827",
                    wordBreak: "break-word",
                  }}
                >
                  {value || "-"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <BasicInformationEditDialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: "#f5f5f5",
        p: { xs: "16px", md: "18px 24px" },
        minHeight: "560px",
      }}
    >
      <IconButton
        size="small"
        onClick={() => setOpenEditDialog(true)}
        sx={{
          position: "absolute",
          right: "12px",
          top: "12px",
        }}
      >
        <EditIcon sx={{ fontSize: "18px", color: "#111827" }} />
      </IconButton>

      <Box
        sx={{
          width: "100%",
          maxWidth: "460px",
          mx: "auto",
          display: "grid",
          rowGap: "10px",
        }}
      >
        {rows.map(([label, value]) => (
          <Box
            key={label}
            sx={{
              display: "grid",
              gridTemplateColumns: "140px minmax(0, 1fr)",
              columnGap: "16px",
              alignItems: "start",
            }}
          >
            <Typography
              sx={{
                fontSize: "16px",
                color: "#1f2937",
                textAlign: "right",
              }}
            >
              {label}：
            </Typography>

            <Typography
              sx={{
                fontSize: "16px",
                color: "#1f2937",
                wordBreak: "break-word",
              }}
            >
              {value || ""}
            </Typography>
          </Box>
        ))}
      </Box>

      <BasicInformationEditDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
      />
    </Box>
  );
}
