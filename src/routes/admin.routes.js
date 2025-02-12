import express from "express";
import { changeAdminRole, loginAdmin, registerAdmin } from "../controllers/admin.controllers.js";
import { adminValidation, hashRole } from "../middlewares/adminValidation.js";

const adminRouter = express.Router();

// Only super admins can register other admins
adminRouter.post("/register", adminValidation, hashRole(["SUPER_ADMIN"]), registerAdmin);

adminRouter.post("/login", loginAdmin);

// Only super admins can change admin roles
adminRouter.patch("/change-role", adminValidation, hashRole(["SUPER_ADMIN"]), changeAdminRole);

export default adminRouter;