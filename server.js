import express from "express";
import cors from "cors";
import multer from "multer";
import "dotenv/config";
import connectDB from "./src/config/db.js";
import adminRouter from "./src/routes/admin.routes.js";
import memberRouter from "./src/routes/member.routes.js";
import connectCloudinary from "./src/config/cloudinary.js";
import bookRouter from "./src/routes/book.routes.js";
import cartRouter from "./src/routes/cart.routes.js";

import "./src/job/checkMemberStatus.js";
import loanRouter from "./src/routes/loan.routes.js";

const app = express();
const port = process.env.PORT;
connectDB();
connectCloudinary();

app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRouter);
app.use("/api/member", memberRouter);
app.use("/api/books", bookRouter);
app.use("/api/cart", cartRouter);
app.use("/api/loan", loanRouter);

// Handle multer errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    } else if (err) {
        console.error("Unexpected error:", err)
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
    next();
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log("Cron job for checking member status is running...");
});