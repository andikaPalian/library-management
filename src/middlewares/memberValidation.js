import jwt from "jsonwebtoken";
import Member from "../models/member.models.js";

const memberValidation = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.Authorization || req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer")) {
            token = authHeader.split(" ")[1];
            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                    return res.status(401).json({
                        message: "Member not authorized"
                    });
                }
                const member = await Member.findById(decoded.member?.id || decoded.id);
                if (!member) {
                    return res.status(404).json({
                        message: "Member not found"
                    });
                }
                
                req.member ={
                    memberId: member._id,
                    email: member.email,
                    name: member.name,
                    memberID: member.memberID
                };
                
                next();
            });
        } else {
            return res.status(403).json({
                message: "Token is missing or not provided"
            });
        }
    } catch (error) {
        console.error("Error during member validation:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

export {memberValidation};