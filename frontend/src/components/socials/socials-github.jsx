import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { FaGithub } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const GithubConnect = ({ darkMode }) => {
  const [githubUsername, setgithubUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const token = window.localStorage.getItem("tokenCV");
  const decoded = jwtDecode(token);
  console.log("jwt:", decoded);
  const [userId, setuserId] = useState("");

  // useEffect( () => {
  //   fetchdata()
  // }, []);

  // const fetchdata=async()=>{
  //   try {
  //     const response = await axios.get(
  //       ${import.meta.env.VITE_DEV_URL}auth/getuser,
  //       {
  //         userEmail:decoded.useremail
  //       }
  //     );

  //     console.log(response)
  //     setuserId(response._id)
  //   } catch (error) {
  //     console.error(error);
  //     alert("Some Error Occured");
  //   }
  //}
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  const [avatar, setavatar] = useState("");
  const [bio, setbio] = useState("");
  const [followers, setfollowers] = useState("");
  const [following, setfollowing] = useState("");
  const [repos, setrepos] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("cvisionary:user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserName(parsedUser.name || "");
    }
  }, []);

  const bgClass = darkMode ? "bg-[#0a0a23]" : "bg-white";
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const inputBg = darkMode ? "bg-[#1E1B3A] text-white" : "bg-blue-100 text-gray-900";
  const inputFocus = darkMode ? "focus:ring-blue-500" : "focus:ring-blue-600";
  const btnBg = darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white";
  const btnShadow = darkMode
    ? "shadow-[0_0_10px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.8)]"
    : "shadow-[0_0_10px_rgba(59,130,246,0.15)] hover:shadow-[0_0_20px_rgba(30,41,59,0.45)]";
  const modalBg = darkMode ? "bg-[#1E1B3A] text-white" : "bg-white text-gray-900";
  const modalCard = darkMode ? "bg-[#2a2752]" : "bg-blue-100";

  const handleScrape = async (e) => {
    e.preventDefault();


    console.log("Scraping data for:", githubUsername);

    if (!githubUsername.trim()) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_DEV_URL}Scrapper/github`,
        { params: { githubUsername } }
      );

      console.log("Scraped Data:", response.data);


      if (response.data.success) {
        console.log("Github Data Scraped successfully");
        setavatar(response.data.avatar);
        setbio(response.data.bio);
        setfollowers(response.data.followers);
        setfollowing(response.data.following);
        setrepos(response.data.repos);
        setData(response.data.data);
        setIsOpen(true);
      }
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_DEV_URL}Scrapper/github/data`,
          {
            userId: decoded.userId,
            userName: githubUsername,
            avatar,
            bio,
            followers,
            following,
            repos,
          }
        );
        console.log(response);
      } catch (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} flex flex-col items-center justify-center px-4 transition-colors duration-300`}>
      <div className="absolute top-24 right-6">
        <button
          onClick={() => navigate("/dashboard")}
          className={`${btnBg} font-semibold py-2 px-6 rounded-lg transition-colors duration-300`}
        >
          Go to Dashboard
        </button>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center leading-tight">
        Hello{userName && `, ${userName}`}
      </h1>

      <div className="w-full max-w-xl text-center">
        <h2 className="text-2xl font-semibold mt-6 mb-6">Connect Your Github Profile</h2>

        <input
          type="text"
          placeholder="Enter GitHub Username"
          className={`w-full p-4 rounded-xl ${inputBg} focus:outline-none ${inputFocus} transition mb-6`}
          value={githubUsername}
          onChange={(e) => setgithubUsername(e.target.value)}
        />

        {showWarning && (
          <p className="text-red-500 text-sm mb-4 font-medium">
            Please enter a GitHub username.
          </p>
        )}

        <button
          onClick={handleScrape}
          className={`${btnBg} w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition duration-300 ease-in-out ${btnShadow} transform hover:scale-105`}
        >
          <FaGithub size={20} /> Scrape Preview
        </button>
      </div>

      {/* Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className={`${modalBg} p-6 rounded-xl shadow-xl mt-16 w-full max-w-2xl h-full max-h-[80vh] overflow-y-auto`}>
            <Dialog.Title className="text-2xl font-bold mb-4">GitHub Preview</Dialog.Title>

            {data && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <img src={data.avatar} alt="avatar" className="w-20 h-20 rounded-full border-2 border-blue-400" />
                  <div>
                    <h3 className="text-xl font-semibold">{data.name} (@{data.username})</h3>
                    <p className={darkMode ? "text-gray-300" : "text-gray-700"}>{data.bio}</p>
                    <p className={darkMode ? "text-sm text-gray-400" : "text-sm text-gray-500"}>Location: {data.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`${modalCard} p-4 rounded-lg`}><p className="font-bold">Repositories:</p><p>{data.repos}</p></div>
                  <div className={`${modalCard} p-4 rounded-lg`}><p className="font-bold">Followers:</p><p>{data.followers}</p></div>
                  <div className={`${modalCard} p-4 rounded-lg`}><p className="font-bold">Following:</p><p>{data.following}</p></div>
                </div>

                {data.pinned && data.pinned.length > 0 && (
                  <div className={`${modalCard} p-4 rounded-lg`}>
                    <p className="font-bold mb-1">Pinned Repositories:</p>
                    <ul className="list-disc ml-5">
                      {data.pinned.map((repo, idx) => (
                        <li key={idx}>
                          <p>{repo.url}</p>  {/* Replaced link with plain text */}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className={`${btnBg} mt-6 w-full py-3 rounded-xl font-semibold transition-transform transform hover:scale-105`}
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default GithubConnect;
