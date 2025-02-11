import Member from "../models/member.models";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

async function generateMemberId() {
    const lastMember = await Member.findOne().sort({ createdAt: -1 });
    const lastId = lastMember ? parseInt(lastMember.memberID.replace("LIB", "")) : 0;
    return `LIB${String(lastId + 1).padStart(4, "0")}`;
}

const registerMember = async (req, res) => {
    try {
        const { name, email, password } = req.body;
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

        const existingMember = await Member.findOne({
            email: email.toLowerCase().trim(),
        });
        if (existingMember) {
            return res.status(400).json({
                message: "Member already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const member = new Member({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            member_status,
            memberID: generateMemberId()
        });
        await member.save();

        const memberResponse = member.toObject();
        delete memberResponse.password;

        res.status(201).json({
            message: "Member registered successfully",
            member: {
                name: memberResponse.name,
                email: memberResponse.email,
                member_status: memberResponse.member_status,
                memberID: memberResponse.memberID
            }
        });
    } catch (error) {
        console.error("Error during registering member:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

export {registerMember};