import { useState } from "react";
import ChatWindow from "../components/resume_builder/chatwindow";
import LivePreview from "../components/resume_builder/live";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import { getInitialDarkMode, setDarkModePreference } from "@/utils/theme";

// Mock user data - replace with actual user context or props as needed
const mockUser = {
  username: "JohnDoe", // Replace with actual username from auth/user context
};

export default function Resume_builder() {
  const [hasStarted, setHasStarted] = useState(false);
  const [livePreview, setLivePreview] = useState("");
  const [darkMode, setDarkMode] = useState(getInitialDarkMode());

  const handleStart = () => {
    setHasStarted(true);
  };

  const handleSetDarkMode = (value) => {
    setDarkMode(value);
    setDarkModePreference(value);
  };

  // Theme colors matching dashboard/landing
  const bgClass = darkMode ? "bg-[#101124]" : "bg-[#f7f8fa]";
  const textClass = darkMode ? "text-white" : "text-[#181A2A]";
  const headingClass = darkMode ? "text-white" : "text-[#181A2A]";
  const subTextClass = darkMode ? "text-gray-300" : "text-[#4B5563]";

  return (
    <div
      className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}
    >
      <Navbar
        isLoggedIn={true}
        darkMode={darkMode}
        setDarkMode={handleSetDarkMode}
      />
      <AnimatePresence>
        {!hasStarted ? (
          <motion.div
            className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-4rem)] px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ flex: 1 }}
          >
            <div className="flex flex-col items-center justify-center w-full h-full flex-1">
              <h1 className={`text-5xl md:text-6xl font-bold text-center mb-6 drop-shadow-lg ${headingClass}`}>
                Welcome to CVisionary, <span className="block">{mockUser.username}</span>
              </h1>
              <p className={`text-xl md:text-2xl text-center mb-10 max-w-2xl ${subTextClass}`}>
                Craft a standout resume that showcases your skills and helps you land your dream job.
              </p>
              <button
                className="mt-2 px-10 py-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-full text-xl shadow-lg transition-colors duration-300"
                onClick={handleStart}
              >
                Start Building
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="flex h-[calc(100vh-4rem)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`w-1/2 border-r ${darkMode ? "border-[#23243a]" : "border-[#e5e7eb]"} overflow-y-auto`}>
              <ChatWindow darkMode={darkMode} setLivePreview={setLivePreview} />
            </div>
            <div className="w-1/2 overflow-y-auto">
              <LivePreview
                prompt={""}
                previewContent={livePreview}
                darkMode={darkMode}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}