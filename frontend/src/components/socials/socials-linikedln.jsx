// FRONTEND CODE (Updated LinkedInUpload component)
// ================================================

import React, { useRef, useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router-dom";

const LinkedInUpload = ({ darkMode }) => {
  const [file, setFile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("cvisionary:user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserName(parsedUser.name || "");
    }
  }, []);

  // Auto-upload PDF when file is selected
  const uploadPDF = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const response = await fetch('http://localhost:8080/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse PDF');
      }

      const data = await response.json();
      console.log(data); // Console log the response
      setParsedData(data);
      
    } catch (err) {
      setError('Error parsing PDF: ' + err.message);
      console.log({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    uploadPDF(e);
  };

  const handleAnalyze = () => {
    if (!file) {
      alert("Please upload your LinkedIn PDF first.");
      return;
    }
    if (!parsedData) {
      alert("PDF is still being processed. Please wait.");
      return;
    }
    setIsOpen(true);
  };

  // Theme classes
  const bgClass = darkMode ? "bg-[#0a0a23]" : "bg-white";
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const subTextClass = darkMode ? "text-gray-400" : "text-gray-600";
  const borderClass = darkMode
    ? "border-gray-600 hover:border-blue-500"
    : "border-blue-300 hover:border-blue-500";
  const btnBg = darkMode
    ? "bg-[#1e1e40] text-white hover:bg-[#2a2a5c]"
    : "bg-blue-100 text-blue-900 hover:bg-blue-200";
  const analyzeBtn = darkMode
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-blue-500 hover:bg-blue-600 text-white";
  const modalBg = darkMode ? "bg-[#1E1B3A] text-white" : "bg-white text-gray-900";
  const modalTitle = darkMode ? "text-blue-400" : "text-blue-700";
  const cardBorder = darkMode ? "border-gray-600" : "border-blue-200";

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${bgClass} ${textClass} px-4 transition-colors duration-300`}
    >
      {/* Go to Dashboard Button */}
      <div className="absolute top-24 right-6">
        <button
          onClick={() => navigate("/dashboard")}
          className={`${analyzeBtn} font-semibold py-2 px-6 rounded-lg transition-colors duration-300`}
        >
          Go to Dashboard
        </button>
      </div>
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-start leading-tight ">
          Hello {userName && `, ${userName}`} !! Upload Your LinkedIn PDF
        </h1>
        <p className={`mb-6 ${subTextClass}`}>
          Upload your LinkedIn PDF to extract your experience, education, and
          achievements.
        </p>

        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${borderClass}`}
        >
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <div className="text-4xl mb-2">📄</div>
          <p className="text-lg font-semibold">
            {loading ? "Processing PDF..." : 
             file ? `Uploaded: ${file.name}` : 
             "Drag and drop or browse to upload"}
          </p>
          <p className={`text-sm ${subTextClass}`}>Supported format: PDF</p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={loading}
            className={`mt-4 px-5 py-2 rounded-lg font-medium transition ${btnBg} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Processing...' : 'Browse Files'}
          </button>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={handleAnalyze}
            disabled={!parsedData || loading}
            className={`${analyzeBtn} font-semibold py-2 px-6 rounded-lg transition-colors duration-300 ${(!parsedData || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Analyze LinkedIn Scrap
          </button>
        </div>
      </div>

      {/* Modal for Extracted Data */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel
            className={`${modalBg} p-6 rounded-xl w-full max-w-2xl shadow-xl`}
          >
            <Dialog.Title className={`text-2xl font-bold mb-4 ${modalTitle}`}>
              LinkedIn Insights
            </Dialog.Title>

            <div className="space-y-4">
              {parsedData && (
                <>
                  <div>
                    <p className={`font-semibold mb-1 ${modalTitle}`}>Extracted Text:</p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg max-h-60 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{parsedData.text}</pre>
                    </div>
                  </div>
                  <div>
                    <p className={`font-semibold mb-1 ${modalTitle}`}>File Info:</p>
                    <p className="text-sm">Pages: {parsedData.pages}</p>
                    <p className="text-sm">Size: {parsedData.size} bytes</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className={`${analyzeBtn} mt-6 w-full py-3 rounded-xl font-semibold transition-transform transform hover:scale-105`}
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default LinkedInUpload;