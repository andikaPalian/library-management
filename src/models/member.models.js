import mongoose from "mongoose";

const calculateMembershipExpiry = () => {
    let expiryDate = new Date();
    // Berlaku 1 tahun
    expiryDate.getFullYear(expiryDate.getFullYear() + 1);
    return expiryDate;
};

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true, default: "Indonesia" },
    },
    member_status: {
        type: String,
        enum: ["active", "inactive"],
        default: "inactive",
    },
    memberID: {
        type: String,
        unique: true,
    },
    join_date: {
        type: Date,
        default: Date.now,
    },
    membership_expiry: {
        type: Date,
        default: calculateMembershipExpiry,
    },
    // Menyimpan jumlah denda yanng harus dibayar member jika telat mengembalikan buku
    total_fines: {
        type: Number,
        default: 0,
        min: 0
    },
    loan_history: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Loan",
    }]
}, {
    timestamps: true,
});

memberSchema.pre("save", async function(next) {
    if (!this.memberID) {
        const lastMember = await this.constructor.findOne().sort({createdAt: -1});
        const lastId = lastMember ? parseInt(lastMember.memberID.replace("LIB", "")) : 0;
        this.memberID = `LIB${String(lastId + 1).padStart(4, "0")}`;
    }
    next();
});

const Member = mongoose.model("Member", memberSchema);

export default Member;