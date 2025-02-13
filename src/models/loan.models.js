import mongoose from "mongoose";

const loanSchema = new mongoose.Schema({
    books: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true
    }],
    borrower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true
    },
    borrow_date: {
        type: Date,
        default: Date.now
    },
    due_date: {
        type: Date,
        required: true
    },
    return_date: {
        type: Date,
        default: null
    },
    // Tambahkan denda jika terlambat mengembalikan buku
    fine_amount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ["borrowed", "returned", "overdue"],
        default: "borrowed"
    }
}, {
    timestamps: true
});

loanSchema.pre("save", function(next) {
    // Jika buku belum di kembalikan tapi sudah melewati tanggal jatuh tempo, ubah status menjadi overdue
    if (this.return_date && this.due_date < new Date()) {
        this.status = "overdue";
    }

    if (this.return_date && this.status === "returned" && this.return_date > this.due_date) {
        // Hitung hari keterlambatan
        const overdueDays = Math.ceil((this.return_date - this.due_date) / (1000 * 60 * 60 * 24));
        // Denda Rp5.000 per hari keterlambatan
        const finePerDay = 5000;
        this.fine_amount = overdueDays * finePerDay;
    }
    next();
});

const Loan = mongoose.model("Loan", loanSchema);

export default Loan;