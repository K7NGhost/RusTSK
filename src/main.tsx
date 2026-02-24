import React from "react";
import ReactDOM from "react-dom/client";
import { GlobalStyles, StyledEngineProvider } from "@mui/material";
import App from "./App";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <App />
    </StyledEngineProvider>
  </React.StrictMode>,
);
