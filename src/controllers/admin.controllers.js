import Admin from "../models/admin.models.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const registerAdmin = async (req, res) => {
    try {
        const {name, email, password} = req.body;
        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        if (typeof name !== "string" || !validator.isLength(name, {min: 3, max: 25})) {
            return res.status(400).json({
                message: "Invalid name format. Name must be between 3 and 25 characters",
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Invalid email format"
            });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Invalid password format. Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
            });
        }

        const existingAdmin = await Admin.findOne({
            email: email.toLowerCase().trim(),
        });
        if (existingAdmin) {
            return res.status(400).json({
                message: "Admin already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        
        const admin = new Admin({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
        });
        await admin.save();

        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.status(201).json({
            message: "Admin registered successfully",
            admin: {
                name: adminResponse.name,
                email: adminResponse.email,
                admin_role: adminResponse.admin_role
            }
        });
    } catch (error) {
        console.error("Error during registering admin:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const loginAdmin = async (req, res) => {
    try {
        const {email, password} = req.body;
        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Invalid email format"
            });
        }

        const admin = await Admin.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found",
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
            const token = jwt.sign({
                id: admin._id,
            }, process.env.JWT_SECRET, {expiresIn: "1d"});
            admin.password = undefined;

            return res.status(200).json({
                message: "Admin login successfully",
                data: {
                    admin: {
                        name: admin.name,
                        email: admin.email,
                        admin_role: admin.admin_role
                    },
                    token: token
                }
            })
        }
    } catch (error) {
        console.error("Error during admin login:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const changeAdminRole = async (req, res) => {
    try {
        const adminId = req.admin.adminId;
        const {adminID, admin_role} = req.body;
        if (!adminId?.trim() || !admin_role?.trim()) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const admin = await Admin.findOne({
            _id: adminId,
            admin_role: "SUPER_ADMIN"
        });
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found",
            });
        }

        const adminInfo = await Admin.findOne({
            _id: adminID,
        });
        if (!adminInfo) {
            return res.status(404).json({
                message: "Admin not found",
            });
        }

        const validRoles = ["LIBRARIAN"];
        if (!validRoles.includes(admin_role)) {
            return res.status(400).json({
                message: "Invalid admin role",
            });
        }

        if (adminInfo.admin_role === "SUPER_ADMIN") {
            return res.status(400).json({
                message: "Cannot change the role of a super admin",
            });
        }

        if (adminInfo.admin_role === admin_role) {
            return res.status(400).json({
                message: "Admin role is already set to the provided role",
            });
        }

        adminInfo.admin_role = admin_role;
        await adminInfo.save();

        res.status(200).json({
            message: "Admin role updated successfully",
            data: {
                admin: {
                    name: adminInfo.name,
                    email: adminInfo.email,
                    admin_role: adminInfo.admin_role
                }
            }
        });
    } catch (error) {
        console.error("Error during changing admin role:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

export {registerAdmin, loginAdmin, changeAdminRole};