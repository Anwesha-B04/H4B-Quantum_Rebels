import React from 'react';

const JobsList = ({ jobs }) => {
  return (
    <div className="bg-[#0d0b22] min-h-screen">
      <div className="text-white text-center py-12 mt-16 bg-[#0d0b22]">
        <h1 className="text-4xl font-bold mb-4">Past Job Postings</h1>
        <p className="text-lg text-gray-400">Explore, Edit, Update and Delete each job</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-10">
        {jobs.map((job, idx) => (
          <div key={idx} className="bg-[#0d0b22] p-6 rounded-xl cursor-pointer
                shadow-[0_0_20px_rgba(59,130,246,0.2)]
                hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]
                transition-all duration-300">
            <h3 className="text-2xl text-white font-bold mb-2">{job.title}</h3>
            <p className="text-md  text-white mb-1">{job.company}</p>
            <p className="text-md text-white mb-1">{job.location}</p>
            <p className="text-md text-white  mb-1">{job.jobType} | ₹{job.stipend}</p>
            <p className="text-md text-white mt-2">{job.description.slice(0, 80)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobsList;
