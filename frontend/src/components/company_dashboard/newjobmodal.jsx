import React, { useState } from 'react';
import { X } from 'lucide-react';

const NewJobModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    category: '',
    jobType: '',
    stipend: ''
  });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSave(formData);
    setFormData({
      title: '',
      description: '',
      company: '',
      location: '',
      category: '',
      jobType: '',
      stipend: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 ">
      <div className="bg-[#1a1a2e] p-8 rounded-lg shadow-lg w-full max-w-lg text-white relative">
        <button onClick={onClose} className="flex items-center justify-center  ">
          <X size={24} />
        </button>
        <h2 className="text-2xl mb-4 font-bold">Create New Job</h2>

        <div className="space-y-4">
          {['title', 'description', 'company', 'location', 'category', 'jobType', 'stipend'].map((field) => (
            <input 
              key={field}
              name={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={formData[field]}
              onChange={handleChange}
              className="w-full p-3 rounded bg-[#2a2a40] border border-gray-600 outline-none"
            />
          ))}
        </div>

        <button onClick={handleSubmit} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-3 rounded font-semibold">
          Save Job
        </button>
      </div>
    </div>
  );
};

export default NewJobModal;
