import React, { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import WelcomeSectionCompany from "../components/company_dashboard/welcome";
import NewJobModal from "../components/company_dashboard/newjobmodal";
import JobsList from "../components/company_dashboard/joblist";
import Footer from "@/components/dashboard/footer";
import { getInitialDarkMode, setDarkModePreference } from "@/utils/theme";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const CompanyDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSaveJob = (newJob) => {
    setJobs((prevJobs) => [...prevJobs, newJob]);
  };

  const [darkMode, setDarkMode] = useState(getInitialDarkMode());

  const handleSetDarkMode = (value) => {
    setDarkMode(value);
    setDarkModePreference(value);
  };
  

  const token = window.localStorage.getItem("tokenCV");
        const decoded = jwtDecode(token);
        
  
  const fetchJobs = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_DEV_URL}jobs/all?userId=${decoded.userId}`)
    console.log(response)
    setJobs(response.data.jobs) 
  } catch (error) {
    console.error(error.message)
  }
}

  useEffect(()=>{
    fetchJobs()
  },[])

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <div className="min-h-screen bg-white dark:bg-[#0d0b22] transition-colors duration-300">
        <Navbar
          isLoggedIn={true}
          darkMode={darkMode}
          setDarkMode={handleSetDarkMode}
        />
        <WelcomeSectionCompany darkMode={darkMode} />
        <div
          className={`flex justify-center items-center px-10 mb-8 transition-colors duration-300 ${
            darkMode ? "bg-[#0d0b22]" : "bg-white"
          }`}
          style={{ minHeight: "120px" }} 
        >
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded"
            onClick={() => setModalOpen(true)}
          >
            + Create New Job
          </button>
        </div>
        <NewJobModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveJob}
          darkMode={darkMode}
        />
        <JobsList jobs={jobs} darkMode={darkMode} />

        <Footer darkMode={darkMode} />
      </div>
    </div>
  );
};

export default CompanyDashboard;
