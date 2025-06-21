import { Router } from "express";
import {  createProfile, getProfileData, githubdata, githubRepo, githubScrapper } from "../controllers/SocialConnectController.js";

const ScrapperRouter=Router()

ScrapperRouter.get("/github",githubScrapper)
ScrapperRouter.get("/github/repos",githubRepo)
ScrapperRouter.post("/github/data",githubdata)
ScrapperRouter.post("/linkedin/data",createProfile)
ScrapperRouter.post("/linkedin/profile",getProfileData)




export default ScrapperRouter;