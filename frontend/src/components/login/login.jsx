import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginImage from "../../assets/images/login.jpg";
import auth, { githubProvider, googleProvider, signInWithPopup } from "../../firebase";
import axios from "axios";
import { useUser } from "@civic/auth/react";
import { getAuth, signOut as firebaseSignOut } from "firebase/auth"; 

const Login = () => {
  const [useremail, setemail] = useState("");
  const [userpassword, setpassword] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState("");

  const navigate = useNavigate();

  const { user, signIn, isAuthenticated, isLoading } = useUser();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userInfo = {
        name: result.user.displayName,
        picture: result.user.photoURL,
      };
      localStorage.setItem("cvisionary:user", JSON.stringify(userInfo));
      navigate("/dashboard");
    } catch (err) {
      console.error("Google login error:", err.message);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const userInfo = {
        name: result.user.displayName,
        picture: result.user.photoURL,
      };
      localStorage.setItem("cvisionary:user", JSON.stringify(userInfo));
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/account-exists-with-different-credential") {
        alert("Account exists with another login method. Try Google.");
      } else {
        console.error("GitHub login error:", err.message);
        alert("GitHub login failed. Please try again.");
      }
    }
  };

  const handleCivicLogin = async () => {
    try {
      

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
    try {
      const response = await axios.post(`${import.meta.env.VITE_DEV_URL}auth/login`, {
        useremail,
        userpassword,
      });

      if (response.data.success) {
        localStorage.setItem("tokenCV", response.data.accessToken);
        localStorage.setItem(
          "cvisionary:user",
          JSON.stringify({ name: useremail, picture: "" }) // Optional avatar
        );
        navigate("/dashboard");
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
      setemail("");
      setpassword("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1c] flex items-center justify-center px-4 ">
      <div className="bg-[#1a1a2e] text-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden w-full max-w-4xl">
        
        <div className="flex-1 p-10">
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-400 mb-6">Login to your CVisionary account</p>

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
            <div>
              <label className="block mb-1 text-sm font-medium">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={useremail}
                onChange={(e) => setemail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#2a2a40] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={userpassword}
                onChange={(e) => setpassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#2a2a40] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-right mt-1">
                <a href="#" className="text-sm text-blue-400 hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition duration-300 py-2 rounded-md font-semibold"
            >
              Login
            </button>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </form>

          <div className="my-6 flex items-center gap-2 text-gray-500 text-sm">
            <hr className="flex-1 border-gray-700" />
            OR
            <hr className="flex-1 border-gray-700" />
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-row gap-4">
              <button
                onClick={handleGithubLogin}
                className="w-full bg-white text-black py-2 rounded-md hover:opacity-90 transition duration-300 font-medium"
              >
                Login with GitHub
              </button>

              <button
                onClick={handleGoogleLogin}
                className="w-full bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 transition duration-300 font-medium"
              >
                Login with Google
              </button>
            </div>
            <button
              onClick={handleCivicLogin}
              className="w-full bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 transition duration-300 font-medium"
            >
              Login with Civic
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{" "}
            <a href="/register" className="text-blue-400 hover:underline">
              Sign up
            </a>
          </p>
        </div>

        
        <div className="hidden md:flex items-center justify-center bg-[#202030] w-full md:w-1/2">
          <img
            src={LoginImage}
            alt="CVisionary Logo"
            className="object-cover w-full h-full max-w-md max-h-md rounded-r-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
