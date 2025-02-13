import cron from "node-cron";
import Member from "../models/member.models.js";
import Loan from "../models/loan.models.js";

cron.schedule("0 0 * * *", async () => {
    try {
        console.log("🔄 Cron job started: Checking member statuses...");

        const members = await Member.find();
        for (const member of members) {
            const overdueLoans = await Loan.find({
                borrower: member._id,
                return_date: null,
                due_date: {$lt: new Date()}
            });

            let totalFine = 0;
            overdueLoans.forEach(loan => {
                const overdueDays = Math.ceil((new Date() - loan.due_date) / (1000 * 60 * 60 * 24));
                totalFine += overdueDays * 5000;
            });

            console.log(`📌 Found ${overdueLoans.length} overdue loans for member ${member.name}`);
            console.log(`💰 Total fine: ${totalFine}`);

            // Status member akan menjadi INACTIVE jika: 
            // - Total denda lebih dari 50.000
            // - Ada salah satu pinjaman yang telah melewati batas waktu 7 hari
            if (overdueLoans.length > 0 && (totalFine > 50000 || overdueLoans.some(loan => {
                const overdueDays = Math.ceil((new Date() - loan.due_date) / (1000 * 60 * 60 * 24));
                return overdueDays > 7;
            }))) {
                member.member_status = "inactive";
                member.total_fines = totalFine;
                await member.save();
                console.log(`🚨 Member ${member.name} is now INACTIVE due to overdue fines.`);
            }
        }
    } catch (error) {
        console.error("Error during member status check:", error);
    }
});