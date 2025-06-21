import React from "react";

const JobsList = ({ jobs, darkMode }) => {
  return (
    <div
      className={`transition-colors duration-300 -mt-12 min-h-screen px-4 py-10 ${
        darkMode ? "bg-[#0d0b22]" : "bg-white"
      }`} 
    >
      <div
        className={`text-center mb-10 transition-colors duration-300 ${
          darkMode ? "text-white" : "text-gray-900"
        }`}
      >
        <h1 className="text-4xl font-bold mb-4">Past Job Postings</h1>
        <p
          className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          Explore, Edit, Update and Delete each job
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-10">
        {jobs.map((job, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-xl cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300
              ${
                darkMode
                  ? "bg-[#1c1b2a] text-white" // ✅ Optional: set card background in dark mode
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
          >
            <h3 className="text-2xl font-bold mb-2">{job.JobTitle}</h3>
            <p className="text-md mb-1">{job.CompanyName}</p>
            <p className="text-md mb-1">{job.Location}</p>
            <p className="text-md mb-1">
              {job.JobType} | ₹{job.Stipend}
            </p>
            <p className="text-md mt-2">{job.JobDescription.slice(0, 80)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobsList;
