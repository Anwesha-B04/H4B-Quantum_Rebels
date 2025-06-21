import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/auth.js";
import { registerUser, loginController, findUser } from "../controllers/auth.js";
import Auth_User from "../models/auth_user.js";

const UserRouter = Router();

UserRouter.post("/register", registerUser);
UserRouter.post("/login", loginController);
UserRouter.get("/getUser",findUser);

UserRouter.get("/getusers", async (req, res) => {
    const users = await Auth_User.find();
    return res.status(200).json({ users: users, message: "User Found" })
})

UserRouter.get("/applicant/dashboard", protect, authorizeRoles("applicant"), (req, res) => {
    res.json({
        success: true,
        message: "Applicant Dashboard Access Granted"
    });
});

UserRouter.get("/company/dashboard", protect, authorizeRoles("company"), (req, res) => {
    res.json({
        success: true,
        message: "Company Dashboard Access Granted"
    });
});


export default UserRouter;