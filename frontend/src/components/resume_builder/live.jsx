import React from "react";
import ReactMarkdown from "react-markdown";

export default function LivePreview({ previewContent, darkMode }) {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className={`text-2xl font-bold mb-4 ${darkMode ? "text-white" : "text-[#181A2A]"}`}>Live Preview</h2>

      <div
        className={`
          max-w-[800px] mx-auto p-8 rounded-lg shadow-lg h-full
          ${darkMode 
            ? "bg-[#181a2a] text-white"
            : "bg-white text-[#181A2A] border border-[#e5e7eb]"}
        `}
      >
        {previewContent ? (
          <div className="prose dark:prose-invert lg:prose-lg">
            <ReactMarkdown>{previewContent}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-center text-gray-500">
            Your resume preview will appear here as you chat with CVisionary.
          </p>
        )}
      </div>
    </div>
  );
}