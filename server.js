import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./src/config/db.js";
import adminRouter from "./src/routes/admin.routes.js";
import memberRouter from "./src/routes/member.routes.js";

const app = express();
const port = process.env.PORT;
connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRouter);
app.use("/api/member", memberRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});