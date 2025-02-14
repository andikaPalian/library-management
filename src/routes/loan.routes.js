import express from "express";
import { memberStatusVerfication, memberValidation } from "../middlewares/memberValidation.js";
import { checkOutLoan, confirmLoanStatus, listLoan, memberLoan } from "../controllers/loan.controllers.js";
import { adminValidation, hashRole } from "../middlewares/adminValidation.js";

const loanRouter = express.Router();

loanRouter.post("/checkout", memberValidation, memberStatusVerfication, checkOutLoan);
loanRouter.get("/history", memberValidation, memberLoan);

// Admin routes
loanRouter.get("/admin/history", adminValidation, hashRole(["SUPER_ADMIN", "LIBRARIAN"]), listLoan);
loanRouter.patch("/loan/:loanId/status", adminValidation, hashRole(["SUPER_ADMIN", "LIBRARIAN"]), confirmLoanStatus);

export default loanRouter;