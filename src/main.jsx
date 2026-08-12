import React from "react";
import ReactDOM from "react-dom/client";
import {
  createTheme,
  ThemeProvider,
} from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import DismissibleAlertAction from "./Components/DismissibleAlertAction";
import "./index.css";

const theme = createTheme({
  components: {
    MuiAlert: {
      defaultProps: {
        action: <DismissibleAlertAction />,
      },
      styleOverrides: {
        root: {
          "&:has(.hrms-alert-dismissed)": {
            display: "none",
          },
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);