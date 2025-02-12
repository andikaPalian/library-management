import Member from "../models/member.models.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const registerMember = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        if (!name?.trim() || !email?.trim() || !password?.trim() || !phone?.trim() || !address) {
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

        if (!validator.isMobilePhone(phone, "id-ID")) {
            return res.status(400).json({
                message: "Invalid phone number format. Please provide a valid Indonesian phone number",
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
            phone: phone.trim(),
            address: address,
        });
        await member.save();

        const memberResponse = member.toObject();
        delete memberResponse.password;

        res.status(201).json({
            message: "Member registered successfully",
            member: {
                name: memberResponse.name,
                email: memberResponse.email,
                phone: memberResponse.phone,
                address: memberResponse.address,
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

const loginMember = async (req, res) => {
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

        const member = await Member.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!member) {
            return res.status(404).json({
                message: "Member not found",
            });
        }

        const isMatch = await bcrypt.compare(password, member.password);
        if (isMatch) {
            const token = jwt.sign({
                id: member._id
            }, process.env.JWT_SECRET, {expiresIn: "1d"});
            member.password = undefined;
            return res.status(200).json({
                message: "Member login successfully",
                data: {
                    member: {
                        name: member.name,
                        email: member.email,
                        phone: member.phone,
                        address: member.address,
                        member_status: member.member_status,
                        memberID: member.memberID
                    },
                    token: token
                }
            });
        } else {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }
    } catch (error) {
        console.error("Error during member login:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

export {registerMember, loginMember};