import React, { useEffect, useState } from 'react';

const WelcomeSectionCompany = () => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem("cvisionary:user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserName(parsedUser.name || "");
    }
  }, []);

  return (
    <div className="text-white text-center py-12 mt-16 bg-[#0d0b22]">
      <h1 className="text-4xl font-bold mb-4">Welcome back, {userName} 👋</h1>
      <p className="text-lg text-gray-400">Manage your job postings and find great candidates</p>
    </div>
  );
};

export default WelcomeSectionCompany;
