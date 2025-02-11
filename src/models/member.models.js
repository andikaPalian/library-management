import mongoose from "mongoose";

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
    password: {
        type: String,
        required: true,
    },
    member_status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    memberID: {
        type: String,
        unique: true,
    }
}, {
    timestamps: true,
});

// memberSchema.pre("save", async function(next) {
//     if (!this.memberID) {
//         const lastMember = await this.constructor.findOne().sort({createdAt: -1});
//         const lastId = lastMember ? parseInt(lastMember.memberID.replace("LIB", "")) : 0;
//         this.memberID = `LIB${String(lastId + 1).padStart(4, "0")}`;
//     }
//     next();
// });

const Member = mongoose.model("Member", memberSchema);

export default Member;