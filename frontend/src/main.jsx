import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { CivicAuthProvider } from "@civic/auth/react"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CivicAuthProvider clientId={import.meta.env.VITE_CIVIC_AUTH_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CivicAuthProvider>
  </React.StrictMode>
);
