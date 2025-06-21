import { useState } from "react";
import ChatWindow from "../components/resume_builder/chatwindow";
import LivePreview from "../components/resume_builder/live";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import { getInitialDarkMode, setDarkModePreference } from "@/utils/theme";

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

  const bgClass = darkMode ? "bg-gray-900" : "bg-white";
  const textClass = darkMode ? "text-white" : "text-gray-900";

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
            className="flex items-center justify-center h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">
                Welcome to CVisionary
              </h2>
              <p className="mb-4">Start building your resume by chatting with your AI assistant.</p>
              <button
                className="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-300"
                onClick={handleStart}
              >
                Start Building
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="flex h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-1/2 border-r border-gray-700 overflow-y-auto">
              <ChatWindow
      
                darkMode={darkMode}
                setLivePreview={setLivePreview}
              />
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
