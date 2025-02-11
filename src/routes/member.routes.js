import express from "express";
import { registerMember } from "../controllers/member.controllers.js";

const memberRouter = express.Router();

memberRouter.post("/register", registerMember);

export default memberRouter;