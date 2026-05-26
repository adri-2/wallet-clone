import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Buffer } from "buffer";

// Provide a global Buffer for libs that expect Node's Buffer in the browser
if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}
if (typeof globalThis !== "undefined") {
  globalThis.Buffer = Buffer;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
