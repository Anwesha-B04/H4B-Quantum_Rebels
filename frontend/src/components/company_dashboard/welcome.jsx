import React, { useEffect, useState } from 'react';

const WelcomeSectionCompany = ({ darkMode }) => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem("cvisionary:user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserName(parsedUser.name || "");
    }
  }, []);

  return (
    <div className={`text-center py-12 mt-16 transition-colors duration-300 ${darkMode ? "bg-[#0d0b22] text-white" : "bg-white text-gray-900"}`}>
      <h1 className="text-4xl font-bold mb-4">Welcome back, {userName} </h1>
      <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Manage your job postings and find great candidates</p>
    </div>
  );
};

export default WelcomeSectionCompany;
