import express from "express";
import { loginMember, memberDashboard, registerMember } from "../controllers/member.controllers.js";
import { memberValidation } from "../middlewares/memberValidation.js";

const memberRouter = express.Router();

memberRouter.post("/register", registerMember);
memberRouter.post("/login", loginMember);

memberRouter.use(memberValidation);
memberRouter.get("/dashboard/:memberId", memberDashboard);

export default memberRouter;