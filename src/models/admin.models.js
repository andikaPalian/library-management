import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,    
    },
    password: {
        type: String,
        required: true,
    },
    admin_role: {
        type: String,
        enum: ["SUPER_ADMIN", "LIBRARIAN"],
        default: "LIBRARIAN",
    }
}, {
    timestamps: true,
});

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;