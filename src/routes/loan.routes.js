import express from "express";
import { memberStatusVerfication, memberValidation } from "../middlewares/memberValidation.js";
import { checkOutLoan, memberLoan } from "../controllers/loan.controllers.js";

const loanRouter = express.Router();

loanRouter.post("/checkout", memberValidation, memberStatusVerfication, checkOutLoan);
loanRouter.get("/history", memberValidation, memberLoan);

export default loanRouter;