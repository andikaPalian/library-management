import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true
    },
    books: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true
    }],
    added_date: {
        type: Date,
        default: Date.now,
        expires: "24h"
    }
}, {
    timestamps: true
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;