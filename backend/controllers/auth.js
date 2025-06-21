import User from '../models/auth_user.js';
import bycrypt from 'bcryptjs'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()


const registerUser = async (req, res) => {
  const { username, useremail, userpassword, role } = req.body;
  console.log(username, useremail, userpassword, role)
  try {
    try {

      const checkuserEmail = await User.findOne({ userEmail: useremail });
      if (checkuserEmail) {
        return res.json({
          success: false,
          message: "Email already exists",
        })
      }
      const checkuserName = await User.findOne({ userName: username });
      if (checkuserName) {
        return res.json({
          success: false,
          message: " Username already exists",
        })
      }

      const salt = await bycrypt.genSalt(10);
      const hashedPassword = await bycrypt.hash(userpassword, salt);

      const newUser = await User.create({
        userName: username,
        userEmail: useremail,
        userPassword: hashedPassword,
        role: role,
      })

      const accessToken = jwt.sign({
        userId:newUser._id,
        username : username,
        
        useremail : useremail
      } ,
       process.env.JWT_SECRET, 
       {expiresIn: '1d'}
      );

      if (newUser) {
        return res.status(201).json({
          success: true,
          message: "User registered successfully",
          accessToken: accessToken
        })
      }
    }
    catch (error) {
      console.log(error);
      return res.json({
        success: false,
        message: "User is not registered",
      })
    }
  }

  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    })
  }
}

const loginController = async (req, res) => {
  try {
    try {
      const { useremail, userpassword , role } = req.body;

      const checkuser = await User.findOne({ userEmail: useremail });


      if (!checkuser || checkuser.role !== role) {
        return res.status(401).json({ success: false, message: "Invalid credentials or role" });
      }

      if (!checkuser) {
        return res.status(404).json({
          success: false,
          message: "User Not Found"
        })
      }
      const checkPassword = await bycrypt.compare(userpassword, checkuser.userPassword)
      if (!checkPassword) {
        return res.json({
          success: false,
          message: "Invalid Password"
        })
      }

      const accessToken = jwt.sign({
        userId:checkuser._id,
        username: checkuser.userName,
        userId: checkuser._id,
        useremail: checkuser.userEmail
      },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        accessToken: accessToken,
        user: checkuser
      })


    }
    catch (error) {
      console.log(error);
      return res.status(400).json({
        success: false,
        message: "User is not logged in "
      })
    }
  }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    })
  }
}

const findUser=async(req,res)=>{
  const {userEmail}=req.body
  console.log(userEmail)
  try {
    const checkuser = await User.findOne({ userEmail: userEmail });
    console.log(checkuser)
    res.json(checkuser)
  } catch (error) {
    console.error(error)
    res.json("Some Error Occured")
  }
}




export { registerUser, loginController ,findUser};