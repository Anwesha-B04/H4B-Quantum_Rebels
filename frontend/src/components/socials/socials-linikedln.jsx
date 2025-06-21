// FRONTEND CODE (Updated LinkedInUpload component)
// ================================================

import React, { useRef, useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";


const parseResumeWithGemini = async (resumeText, apiKey) => {


  try {
    const prompt = `
You are an expert resume parser. Parse the following resume text and return ONLY a valid JSON object with this exact structure:

{
  "personalInfo": {
    "name": "Full Name",
    "title": "Job Title/Role",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "City, State, Country",
    "linkedin": "LinkedIn URL",
    "portfolio": "Portfolio/Website URL"
  },
  "summary": "Professional summary or objective",
  "skills": ["skill1", "skill2", "skill3"],
  "languages": [
    {"language": "English", "proficiency": "Native"},
    {"language": "Spanish", "proficiency": "Intermediate"}
  ],
  "experience": [
    {
      "position": "Job Title",
      "company": "Company Name",
      "duration": "Start Date - End Date",
      "location": "City, State",
      "description": "Job description and achievements"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School/University Name",
      "duration": "Start Year - End Year",
      "location": "City, State"
    }
  ],
  "certifications": ["Certification 1", "Certification 2"]
}

Critical Requirements:
1. Return ONLY the JSON object, no explanations or markdown
2. If any field is missing, use empty string "" or empty array []
3. Extract information accurately from the resume
4. Ensure valid JSON format
5. Parse all sections thoroughly

Resume text:
${resumeText}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();

      throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {

      throw new Error('Invalid response structure from Gemini API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text.trim();

    // Clean the response to extract JSON
    let jsonText = aiResponse;

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    // Parse and validate JSON
    const parsedData = JSON.parse(jsonText);

    // Validate structure
    const validatedData = validateResumeStructure(parsedData);

    return {
      success: true,
      data: validatedData,
      error: null
    };

  } catch (error) {

    console.error('Resume parsing error:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }

};

const validateResumeStructure = (data) => {
  return {
    personalInfo: {
      name: data.personalInfo?.name || "",
      title: data.personalInfo?.title || "",
      email: data.personalInfo?.email || "",
      phone: data.personalInfo?.phone || "",
      location: data.personalInfo?.location || "",
      linkedin: data.personalInfo?.linkedin || "",
      portfolio: data.personalInfo?.portfolio || ""
    },
    summary: data.summary || "",
    skills: Array.isArray(data.skills) ? data.skills.filter(skill => skill && skill.trim()) : [],
    languages: Array.isArray(data.languages) ? data.languages.map(lang => ({
      language: lang.language || lang,
      proficiency: lang.proficiency || "Not specified"
    })) : [],
    experience: Array.isArray(data.experience) ? data.experience.map(exp => ({
      position: exp.position || "",
      company: exp.company || "",
      duration: exp.duration || "",
      location: exp.location || "",
      description: exp.description || ""
    })) : [],
    education: Array.isArray(data.education) ? data.education.map(edu => ({
      degree: edu.degree || "",
      institution: edu.institution || "",
      duration: edu.duration || "",
      location: edu.location || ""
    })) : [],
    certifications: Array.isArray(data.certifications) ? data.certifications.filter(cert => cert && cert.trim()) : []
  };
};


const LinkedInUpload = ({ darkMode }) => {
  const [file, setFile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [generatedText, setgeneratedText] = useState("");
  const [Logs, setLogs] = useState("");

  // ADD NEW STATE for parsed Gemini output:
  const [finalParsedData, setFinalParsedData] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("cvisionary:user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserName(parsedUser.name || "");
    }
  }, []);

  const uploadPDF = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a valid PDF file");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      const response = await fetch("http://localhost:8080/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to parse PDF");
      }

      const data = await response.json();
      console.log(data);
      setParsedData(data);
      setgeneratedText(data.text);
    } catch (err) {
      setError("Error parsing PDF: " + err.message);
      console.log({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    uploadPDF(e);
  };

  const token = window.localStorage.getItem("tokenCV");
  const decoded = jwtDecode(token);
  console.log("jwt:", decoded);

  const handleAnalyze = async () => {
    setLoading(true);
    const parsedResume = await parseResumeWithGemini(
      generatedText,
      import.meta.env.VITE_GEMINI_API_KEY
    );
    setLoading(false);
    console.log(parsedResume);

    if (parsedResume.success) {
      // Save parsed data to state for rendering
      setFinalParsedData(parsedResume.data);
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_DEV_URL}Scrapper/linkedin/data`,
        {
          userId: decoded.userId,
          fullname: parsedResume.data.personalInfo.name,
          headline: parsedResume.data.personalInfo.title,
          summary: parsedResume.data.summary,
          experience: parsedResume.data.experience,
          skills: parsedResume.data.skills,
          certifications: parsedResume.data.certifications,
          education: parsedResume.data.education,
          source: "Linkedin",
        }
      );

      console.log(response.data);
      setLogs(response.data.message);
    } catch (error) {
      console.error(error);
    }
  };

  // All your UI and styling remains unchanged below
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
    <div className={`min-h-screen flex items-center justify-center ${bgClass} ${textClass} px-4 transition-colors duration-300`}>
      <div className="absolute top-24 right-6">
        <button onClick={() => navigate("/dashboard")} className={`${analyzeBtn} font-semibold py-2 px-6 rounded-lg transition-colors duration-300`}>
          Go to Dashboard
        </button>
      </div>

      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-start leading-tight ">
          Hello {userName && `, ${userName}`} !! Upload Your LinkedIn PDF
        </h1>
        <p className={`mb-6 ${subTextClass}`}>
          Upload your LinkedIn PDF to extract your experience, education, and achievements.
        </p>

        <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${borderClass}`}>
          <input type="file" accept="application/pdf" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
          <div className="text-4xl mb-2">📄</div>
          <p className="text-lg font-semibold">
            {loading ? "Processing PDF..." : file ? `Uploaded: ${file.name}` : "Drag and drop or browse to upload"}
          </p>
          <p className={`text-sm ${subTextClass}`}>Supported format: PDF</p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button onClick={() => fileInputRef.current.click()} disabled={loading} className={`mt-4 px-5 py-2 rounded-lg font-medium transition ${btnBg} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
            {loading ? "Processing..." : "Browse Files"}
          </button>
        </div>

        <div className="mt-6 text-right">
          <button onClick={handleAnalyze} disabled={!parsedData || loading} className={`${analyzeBtn} font-semibold py-2 px-6 rounded-lg transition-colors duration-300 ${!parsedData || loading ? "opacity-50 cursor-not-allowed" : ""}`}>
            Analyze LinkedIn Scrap
          </button>
        </div>
        <h3 className="text-blue-600 text-center">{Logs}</h3>

        {/* Render the Gemini Parsed Data */}
        {finalParsedData && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4 text-blue-500">Parsed LinkedIn Data</h2>

            <div className="mb-4">
              <h3 className="font-semibold text-xl text-blue-400 mb-4">Personal Info:</h3>
              <p >Name: {finalParsedData.personalInfo.name}</p>
              <p>Title: {finalParsedData.personalInfo.title}</p>
              <p>Email: {finalParsedData.personalInfo.email}</p>
              <p>Phone: {finalParsedData.personalInfo.phone}</p>
              <p>Location: {finalParsedData.personalInfo.location}</p>
              <p>LinkedIn: {finalParsedData.personalInfo.linkedin}</p>
              <p>Portfolio: {finalParsedData.personalInfo.portfolio}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-xl text-blue-400 mb-4">Summary:</h3>
              <p>{finalParsedData.summary}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-xl text-blue-400 mb-4">Skills:</h3>
              <ul className="list-disc ml-6">
                {finalParsedData.skills.map((skill, idx) => (
                  <li key={idx}>{skill}</li>
                ))}
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-xl text-blue-400 mb-4">Languages:</h3>
              <ul className="list-disc ml-6">
                {finalParsedData.languages.map((lang, idx) => (
                  <li key={idx}>{lang.language} ({lang.proficiency})</li>
                ))}
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-xl text-blue-400 mb-4">Certifications:</h3>
              <ul className="list-disc ml-6">
                {finalParsedData.certifications.map((cert, idx) => (
                  <li key={idx}>{cert}</li>
                ))}
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-xl text-blue-400 mb-4">Education:</h3>
              <ul className="list-disc ml-6">
                {finalParsedData.education.map((edu, idx) => (
                  <li key={idx}>{edu.degree} - {edu.institution} ({edu.duration})</li>
                ))}
              </ul>
            </div>

            {finalParsedData.experience.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-xl text-blue-400 mb-4">Experience:</h3>
                <ul className="list-disc ml-6">
                  {finalParsedData.experience.map((exp, idx) => (
                    <li key={idx}>{exp.position} at {exp.company} ({exp.duration})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Your existing Modal remains unchanged */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className={`${modalBg} p-6 rounded-xl w-full max-w-2xl shadow-xl`}>
            <Dialog.Title className={`text-2xl font-bold mb-4 ${modalTitle}`}>LinkedIn Insights</Dialog.Title>

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

            <button onClick={() => setIsOpen(false)} className={`${analyzeBtn} mt-6 w-full py-3 rounded-xl font-semibold transition-transform transform hover:scale-105`}>
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default LinkedInUpload;