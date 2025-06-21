import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const JOBS = [
  {
    title: "Senior Software Engineer",
    location: "Remote",
    status: "Active",
    applicants: 25,
    views: 150,
    link: "#",
  },
  {
    title: "Product Manager",
    location: "New York, NY",
    status: "Active",
    applicants: 15,
    views: 100,
    link: "#",
  },
  {
    title: "UX Designer",
    location: "San Francisco, CA",
    status: "Closed",
    applicants: 50,
    views: 200,
    link: "#",
  },
  {
    title: "Data Analyst",
    location: "Chicago, IL",
    status: "Active",
    applicants: 30,
    views: 180,
    link: "#",
  },
  {
    title: "Marketing Specialist",
    location: "Los Angeles, CA",
    status: "Closed",
    applicants: 40,
    views: 220,
    link: "#",
  },
];

const CompanyDashboard = ({ darkMode }) => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName);
  }, []);

  return (
    <div
      className={`min-h-screen w-full pb-16 ${
        darkMode ? "bg-[#0d0b22] text-white" : "bg-white text-[#18181b]"
      }`}
    >
      {/* Navbar */}
      <nav
        className={`w-full border-b ${
          darkMode ? "border-[#23233a] bg-[#0d0b22]" : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-black dark:bg-white inline-block" />
            <span className="font-bold text-xl">JobFinder</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/company-dashboard"
              className={`text-sm font-medium ${
                darkMode
                  ? "text-gray-200 hover:text-white"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              Dashboard
            </Link>
            <button
              className={`px-5 py-2 rounded-full font-semibold text-sm shadow ${
                darkMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              } transition`}
            >
              Post Job
            </button>
            <button
              className={`px-5 py-2 rounded-full font-semibold text-sm ${
                darkMode
                  ? "bg-[#23233a] text-white hover:bg-[#35355a]"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              } transition`}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 mt-14">
        <h1 className="text-4xl font-bold mb-8">
          Welcome back{userName ? `, ${userName}` : ""}
        </h1>
        <h2 className="text-2xl font-semibold mb-4">Your Jobs</h2>
        <div
          className={`overflow-x-auto rounded-2xl border ${
            darkMode
              ? "border-[#23233a] bg-[#16162a]"
              : "border-gray-200 bg-white"
          }`}
        >
          <table className="min-w-full text-left">
            <thead>
              <tr
                className={`text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <th className="py-4 px-6 font-medium">Job Title</th>
                <th className="py-4 px-6 font-medium">Location</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Applicants</th>
                <th className="py-4 px-6 font-medium">Views</th>
                <th className="py-4 px-6 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {JOBS.map((job) => (
                <tr
                  key={job.title}
                  className={`border-t ${
                    darkMode
                      ? "border-[#23233a] hover:bg-[#23233a]"
                      : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <td className="py-4 px-6 whitespace-nowrap">{job.title}</td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <a
                      href={job.link}
                      className={`underline ${
                        darkMode
                          ? "text-blue-400 hover:text-blue-200"
                          : "text-blue-600 hover:text-blue-800"
                      }`}
                    >
                      {job.location}
                    </a>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-5 py-1 rounded-full text-sm font-semibold ${
                        job.status === "Active"
                          ? darkMode
                            ? "bg-[#23233a] text-white"
                            : "bg-gray-100 text-gray-700"
                          : darkMode
                          ? "bg-[#23233a] text-gray-400"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">{job.applicants}</td>
                  <td className="py-4 px-6">{job.views}</td>
                  <td className="py-4 px-6">
                    <a
                      href="#"
                      className={`font-semibold underline ${
                        darkMode
                          ? "text-gray-300 hover:text-white"
                          : "text-gray-600 hover:text-black"
                      }`}
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Post a New Job */}
        <div className="mt-12 text-left">
          <h3 className="text-xl font-bold mb-4">Post a New Job</h3>
          <button
            className={`block mx-auto px-8 py-3 rounded-full font-semibold text-lg shadow ${
              darkMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-500 text-white hover:bg-blue-600"
            } transition`}
          >
            Post Job
          </button>
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboard;