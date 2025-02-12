import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./src/config/db.js";
import adminRouter from "./src/routes/admin.routes.js";
import memberRouter from "./src/routes/member.routes.js";
import connectCloudinary from "./src/config/cloudinary.js";
import bookRouter from "./src/routes/book.routes.js";

const app = express();
const port = process.env.PORT;
connectDB();
connectCloudinary();

app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRouter);
app.use("/api/member", memberRouter);
app.use("/api/books", bookRouter);

// Handle multer errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    } else if (err) {
        return res.status(500).json({ message: "Unexpected error during file upload" });
    }
    next();
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});