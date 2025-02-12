import express from "express";
import { addBooks } from "../controllers/book.controllers.js";
import upload from "../middlewares/multer.js";
import { adminValidation, hashRole } from "../middlewares/adminValidation.js";

const bookRouter = express.Router();

bookRouter.post("/add", upload.single("cover_image"), adminValidation, hashRole(["SUPER_ADMIN", "LIBRARIAN"]), addBooks);

export default bookRouter;