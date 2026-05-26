import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { SocketProvider } from "./context/SocketContext";

const savedTheme = localStorage.getItem("sd_theme");
const initialTheme = savedTheme === "green" || savedTheme === "dark" ? "green" : "cream";
document.documentElement.setAttribute("data-theme", initialTheme);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppSettingsProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AppSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
