import express from "express";
import { addBooks, deleteBooks, editBooks, listBooks } from "../controllers/book.controllers.js";
import upload from "../middlewares/multer.js";
import { adminValidation, hashRole } from "../middlewares/adminValidation.js";

const bookRouter = express.Router();

// Admin routes
bookRouter.post("/add", upload.single("cover_image"), adminValidation, hashRole(["SUPER_ADMIN", "LIBRARIAN"]), addBooks);
bookRouter.patch("/edit/:bookId", upload.single("cover_image"), adminValidation, hashRole(["SUPER_ADMIN", "LIBRARIAN"]), editBooks);
bookRouter.delete("/delete/:bookId", adminValidation, hashRole(["SUPER_ADMIN", "LIBRARIAN"]), deleteBooks);

// Public routes
bookRouter.get("/", listBooks);

export default bookRouter;