import {
  Box,
  Collapse,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import BasicInformationTab from "./BasicInformationTab";
import ContactInformationTab from "./ContactInformationTab";
import EducationCertificateTab from "./EducationCertificateTab";
import JobExperienceTab from "./JobExperienceTab";
import WorkExperienceTab from "./WorkExperienceTab";
import YearExperienceTab from "./YearExperienceTab";

function TabPanel({ value, index, children }) {
  return (
    <Box sx={{ display: value === index ? "block" : "none", pt: "12px" }}>
      {value === index ? children : null}
    </Box>
  );
}

export default function AccountTabs({ profile }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const sections = [
    {
      label: "基本資料",
      content: <BasicInformationTab profile={profile} />,
      disabled: false,
    },
    {
      label: "通訊資料",
      content: <ContactInformationTab profile={profile} />,
      disabled: false,
    },
    {
      label: "學歷證照",
      content: <EducationCertificateTab profile={profile} />,
      disabled: false,
    },
    {
      label: "工作經歷",
      content: <JobExperienceTab profile={profile} />,
      disabled: false,
    },
    {
      label: "年資",
      content: <YearExperienceTab profile={profile} />,
      disabled: false,
    },
    {
      label: "職務經歷",
      content: <WorkExperienceTab profile={profile} />,
      disabled: false,
    },
  ];

  const [tab, setTab] = useState(0);
  const [openSections, setOpenSections] = useState({
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  });

  const toggleSection = (index, disabled) => {
    if (disabled) return;

    setOpenSections((prev) => {
      const isCurrentlyOpen = !!prev[index];

      const next = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});

      if (!isCurrentlyOpen) {
        next[index] = true;
      }

      return next;
    });
  };

  if (isMobile) {
    return (
      <Box>
        {sections.map((section, index) => {
          const isOpen = !!openSections[index];

          return (
            <Box
              key={section.label}
              sx={{
                borderTop: index === 0 ? "1px solid #ececec" : "none",
                borderBottom: "1px solid #ececec",
              }}
            >
              <Box
                onClick={() => toggleSection(index, section.disabled)}
                sx={{
                  minHeight: "72px",
                  px: "16px",
                  py: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: section.disabled ? "not-allowed" : "pointer",
                  opacity: section.disabled ? 0.45 : 1,
                  bgcolor: "#ffffff",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {section.label}
                </Typography>

                {isOpen ? (
                  <ExpandMoreIcon sx={{ fontSize: "32px", color: "#d1d5db" }} />
                ) : (
                  <KeyboardArrowRightIcon
                    sx={{ fontSize: "32px", color: "#d1d5db" }}
                  />
                )}
              </Box>

              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <Box sx={{ pb: "12px" }}>{section.content}</Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(e, newValue) => setTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: "36px",
          "& .MuiTabs-indicator": {
            display: "none",
          },
          "& .MuiTab-root": {
            minHeight: "36px",
            minWidth: "unset",
            px: "12px",
            py: "8px",
            mr: "2px",
            borderRadius: "4px 4px 0 0",
            fontSize: "14px",
            fontWeight: 700,
            color: "#111827",
            textTransform: "none",
            bgcolor: "transparent",
          },
          "& .Mui-selected": {
            bgcolor: "#efefef",
          },
        }}
      >
        <Tab label="基本資料" />
        <Tab label="通訊資料" />
        <Tab label="學歷證照" />
        <Tab label="工作經歷" disabled />
        <Tab label="年資" />
        <Tab label="職務經歷" />
      </Tabs>

      <Box
        sx={{
          height: "6px",
          bgcolor: "#efefef",
          mt: "4px",
        }}
      />

      <TabPanel value={tab} index={0}>
        <BasicInformationTab profile={profile} />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <ContactInformationTab profile={profile} />
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <EducationCertificateTab profile={profile} />
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <JobExperienceTab profile={profile} />
      </TabPanel>

      <TabPanel value={tab} index={4}>
        <YearExperienceTab profile={profile} />
      </TabPanel>

      <TabPanel value={tab} index={5}>
        <WorkExperienceTab profile={profile} />
      </TabPanel>
    </Box>
  );
}