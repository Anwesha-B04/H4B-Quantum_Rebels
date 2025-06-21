import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterImage from "../../assets/images/login.jpg";
import auth, {
  googleProvider,
  githubProvider,
  signInWithPopup,
} from "../../firebase"; 
import axios from "axios";
import { useUser } from "@civic/auth/react";
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";


const Register = () => {
  const navigate = useNavigate();

  
  const [username, setName] = useState("");
  const [useremail, setEmail] = useState("");
  const [userpassword, setPassword] = useState("");
  const [role, setRole] = useState("");

  const { user, signIn, isAuthenticated, isLoading } = useUser();

  const [Error, setError] = useState("")

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Sign Up successful: ", result.user);

      localStorage.setItem("userName", result.user.displayName);
      navigate("/dashboard");
    } catch (error) {
      console.error("Google Sign Up error: ", error.message);
    }
  };

  const handleGithubSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      console.log("GitHub Sign Up successful: ", result.user);
      
      localStorage.setItem("userName", result.user.displayName);
      navigate("/dashboard");
    } catch (error) {
      console.error("GitHub Sign Up error: ", error.message);
    }
  };

  const handleCivicLogin = async () => {
    try {
      
      await firebaseSignOut(getAuth());

      await signIn(); 
      if (user) {
        const userInfo = {
          name: user.name || user.id || "CivicUser",
          picture: user.picture || "",
        };
        localStorage.setItem("cvisionary:user", JSON.stringify(userInfo));
        navigate("/dashboard");
      } else {
        alert("Civic login did not return user info.");
      }
    } catch (err) {
      console.error("Civic login failed:", err);
      alert("Civic login failed. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form Data:", { username, useremail, userpassword });
    try {
      const response = await axios.post(`${import.meta.env.VITE_DEV_URL}auth/register`, { username, useremail, userpassword ,role})
      console.log(response)
      setError(response.data.message)
      if (response.data.success) {
        localStorage.setItem("tokenCV", response.data.accessToken);
        console.log("Registration successful:", response.data.message);
        if(role=="company"){
          navigate("/company-dashboard")
        }else{

          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message)

    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1c] flex items-center justify-center px-4">
      <div className="bg-[#1a1a2e] text-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden w-full max-w-4xl">
        
        <div className="hidden md:flex items-center justify-center bg-[#202030] w-full md:w-1/2">
          <img
            src={RegisterImage}
            alt="CVisionary Logo"
            className="object-cover w-full h-full max-w-md max-h-md rounded-r-2xl"
          />
        </div>

        
        <div className="flex-1 p-10">
          <h2 className="text-3xl font-bold mb-2">Create an Account</h2>
          <p className="text-gray-400 mb-6">Join the CVisionary platform</p>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Select Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#2a2a40] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="" disabled>
                -- Choose a role --
              </option>
              <option value="applicant">Applicant</option>
              <option value="company">Company</option>
            </select>
          </div>


          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="flex flex-row gap-4">
              <div >
                <label className="block mb-1 text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-[#2a2a40] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={username}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 bg-[#2a2a40] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={useremail}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-[#2a2a40] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={userpassword}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition duration-300 py-2 rounded-md font-semibold"
            >
              Sign Up
            </button>
            <h3 className="text-red-700">{Error}</h3>
          </form>

          <div className="my-6 flex items-center gap-2 text-gray-500 text-sm">
            <hr className="flex-1 border-gray-700" />
            OR
            <hr className="flex-1 border-gray-700" />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleGoogleSignUp}
              className="flex-1 bg-white text-black py-2 rounded-md hover:opacity-90 transition duration-300 font-medium"
            >
              Sign Up with Google
            </button>
            <button
              onClick={handleGithubSignUp}
              className="flex-1 bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800 transition duration-300 font-medium"
            >
              Sign Up with GitHub
            </button>


          </div>

          <button
            onClick={handleCivicLogin}
            className="w-full mt-4 bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 transition duration-300 font-medium"
          >
            Register with Civic
          </button>
          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-blue-400 hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
