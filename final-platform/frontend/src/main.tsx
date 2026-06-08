import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import { applyThemeClass, loadThemePreference } from "./lib/theme";
import "./index.css";

applyThemeClass(loadThemePreference());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
