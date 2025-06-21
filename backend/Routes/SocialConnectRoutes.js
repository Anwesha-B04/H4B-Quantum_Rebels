import { Router } from "express";
import {  githubdata, githubRepo, githubScrapper, linkedinData } from "../controllers/SocialConnectController.js";

const ScrapperRouter=Router()

ScrapperRouter.get("/github",githubScrapper)
ScrapperRouter.get("/github/repos",githubRepo)
ScrapperRouter.post("/github/data",githubdata)
ScrapperRouter.post("/linkedin/data",linkedinData)




export default ScrapperRouter;