import express from "express";
import { memberValidation } from "../middlewares/memberValidation.js";
import { addToCart, getCart, removeCart } from "../controllers/cart.controllers.js";

const cartRouter = express.Router();

cartRouter.post("/add/:bookId", memberValidation, addToCart);
cartRouter.delete("/remove/:bookId", memberValidation, removeCart);
cartRouter.get("/", memberValidation, getCart);

export default cartRouter;