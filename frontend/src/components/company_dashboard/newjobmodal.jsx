import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const NewJobModal = ({ isOpen, onClose, onSave, darkMode }) => {
  const [userId, setuserId] = useState("")

  const token = window.localStorage.getItem("tokenCV");
      const decoded = jwtDecode(token);
      console.log("jwt:", decoded);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [jobType, setJobType] = useState('');
  const [stipend, setStipend] = useState('');

  const handleSubmit = async(e) => {
    e.preventDefault()

    try {
      const response=await axios.post(`${import.meta.env.VITE_DEV_URL}jobs/create`,{userId:decoded.userId,
        JobTitle:title,
      JobDescription:description,
      CompanyName:company,
      Location :location,
      Cateogory:category,
      JobType :jobType,
      Stipend:stipend
    })

      console.log(response)
    } catch (error) {
      console.error(error)

      
    }

    
    setTitle('');
    setDescription('');
    setCompany('');
    setLocation('');
    setCategory('');
    setJobType('');
    setStipend('');

    onClose();
  };

  if (!isOpen) return null;

  const modalBg = darkMode ? "bg-[#1a1a2e] text-white" : "bg-white text-[#1a1a2e]";
  const inputBg = darkMode ? "bg-[#2a2a40] border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-[#1a1a2e]";
  const buttonBg = darkMode
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div
        className={`p-8 rounded-2xl shadow-2xl w-full max-w-lg relative border transition-all duration-300 ${
          darkMode
            ? "border-[#23234a] bg-gradient-to-br from-[#1a1a2e] via-[#23234a] to-[#22223b]"
            : "border-gray-200 bg-gradient-to-br from-white via-blue-50 to-white"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Close"
        >
          <X size={28} />
        </button>
        <h2
          className={`text-3xl mb-6 font-extrabold tracking-tight text-center ${
            darkMode ? "text-white" : "text-[#1a1a2e]"
          }`}
        >
          Create New Job
        </h2>

        <div className="space-y-4">
          <input
            name="title"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full p-3 rounded outline-none border ${inputBg}`}
          />
          <input
            name="description"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full p-3 rounded outline-none border ${inputBg}`}
          />
          <input
            name="company"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={`w-full p-3 rounded outline-none border ${inputBg}`}
          />
          <input
            name="location"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`w-full p-3 rounded outline-none border ${inputBg}`}
          />
          <input
            name="category"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full p-3 rounded outline-none border ${inputBg}`}
          />
          <input
            name="jobType"
            placeholder="Job Type"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className={`w-full p-3 rounded outline-none border ${inputBg}`}
          />
          <input
            name="stipend"
            placeholder="Stipend"
            value={stipend}
            onChange={(e) => setStipend(e.target.value)}
            className={`w-full p-3 rounded outline-none border ${inputBg}`}
          />
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full mt-8 py-3 rounded-lg font-semibold shadow-md transition-all duration-200 transform hover:scale-[1.03] active:scale-100 ${buttonBg}`}
        >
          Save Job
        </button>
      </div>
    </div>
  );
};

export default NewJobModal;
