import Admin from "../models/admin.models.js";
import Member from "../models/member.models.js";
import Loan from "../models/loan.models.js";

const activateMemberStatus = async (req, res) => {
    try {
        const adminId = req.admin.adminId;
        const {memberId} = req.params;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        const overdueLoans = await Loan.find({
            borrower: memberId,
            return_date: null
        });
        if (overdueLoans.length > 0) {
            return res.status(400).json({
                message: "Member has overdue loans and cannot be activated"
            });
        }

        member.member_status = "active";
        member.total_fines = 0;
        member.save();

        res.status(200).json({
            message: "Member status activated successfully"
        });
    } catch (error) {
        console.error("Error during activating member status:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

export {activateMemberStatus};