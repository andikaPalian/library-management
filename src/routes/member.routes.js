import express from "express";
import { loginMember, registerMember } from "../controllers/member.controllers.js";

const memberRouter = express.Router();

memberRouter.post("/register", registerMember);
memberRouter.post("/login", loginMember);

export default memberRouter;