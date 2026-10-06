import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: { fontSize: 14, borderRadius: 8 },
        success: { iconTheme: { primary: "#16a34a", secondary: "white" } },
        error: { iconTheme: { primary: "#dc2626", secondary: "white" } },
      }}
    />
    <App />
  </React.StrictMode>
);
