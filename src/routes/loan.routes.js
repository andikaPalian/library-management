import express from "express";
import { memberStatusVerfication, memberValidation } from "../middlewares/memberValidation.js";
import { checkOutLoan, listLoan } from "../controllers/loan.controllers.js";

const loanRouter = express.Router();

loanRouter.post("/checkout", memberValidation, memberStatusVerfication, checkOutLoan);
loanRouter.get("/history", memberValidation, listLoan);

export default loanRouter;