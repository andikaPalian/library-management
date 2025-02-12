import express from "express";
import { loginAdmin, registerAdmin } from "../controllers/admin.controllers.js";
import { adminValidation, hashRole } from "../middlewares/adminValidation.js";

const adminRouter = express.Router();

// Only super admins can register other admins
adminRouter.post("/register", adminValidation, hashRole(["SUPER_ADMIN"]), registerAdmin);

adminRouter.post("/login", loginAdmin);

export default adminRouter;