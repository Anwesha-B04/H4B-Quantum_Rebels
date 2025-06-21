import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomeSection from "./components/dashboard/welcome";
import CompanyDashboard from "./components/company_dashboard/company-dashboard";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomeSection darkMode={darkMode} />} />
        <Route path="/company-dashboard" element={<CompanyDashboard darkMode={darkMode} />} />
      </Routes>
      {/* Optional: Dark mode toggle */}
      <button
        onClick={() => setDarkMode((d) => !d)}
        className="fixed bottom-6 right-6 px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-800 text-black dark:text-white shadow"
      >
        Toggle {darkMode ? "Light" : "Dark"} Mode
      </button>
    </Router>
  );
}

export default App;