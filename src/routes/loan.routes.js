import express from "express";
import { memberStatusVerfication, memberValidation } from "../middlewares/memberValidation.js";
import { checkOutLoan } from "../controllers/loan.controllers.js";

const loanRouter = express.Router();

loanRouter.post("/checkout", memberValidation, memberStatusVerfication, checkOutLoan);

export default loanRouter;