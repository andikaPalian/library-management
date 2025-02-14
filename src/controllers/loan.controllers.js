import Loan from "../models/loan.models.js";
import Member from "../models/member.models.js";
import Book from "../models/book.models.js";
import Admin from "../models/admin.models.js";
import Cart from "../models/cart.models.js";
import mongoose from "mongoose";

const checkOutLoan = async (req, res) => {
    try {
        const memberId = req.member.memberId;
        
        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        const cart = await Cart.findOne({
            member: memberId
        }).populate("books", "title author cover_image");
        if (!cart || cart.books.length === 0) {
            return res.status(404).json({
                message: "Cart not found or cart is empty"
            });
        }

        const existingLoans = await Loan.find({
            borrower: memberId,
            status: "borrowed"
        }).select("books").populate("books", "title author cover_image");
        const borrowedBooksId = new Set(existingLoans.flatMap(loan => loan.books.map(book => book._id.toString())));

        // const cartBooksId = new Set(cart.books.map(book => book._id.toString()));

        // Cek jika ada buku yang sudah dipinjam
        // const duplicateBooks = [...cartBooksId].filter(bookId => borrowedBooksId.has(bookId));
        const duplicateBooks = cart.books.filter(book => borrowedBooksId.has(book._id.toString()));
        if (duplicateBooks.length > 0) {
            return res.status(400).json({
                message: "You can't checkout the same book twice",
                duplicateBooks: duplicateBooks.map(book => ({
                    title: book.title,
                    author: book.author,
                    cover_image: book.cover_image || "https://example.com/default-cover.jpg"
                }))
            });
        }

        const dueDate = new Date();
        // Batas waktu pengembalian buku 7 hari
        dueDate.setDate(dueDate.getDate() + 7);

        const loan = new Loan({
            books: cart.books.map(book => book._id),
            borrower: memberId,
            due_date: dueDate,
        });
        await loan.save();

        await Cart.deleteOne({
            member: memberId
        });

        await Book.updateMany({
            _id: {
                $in: cart.books.map(book => book._id)
            }
        }, {
            $inc: {
                available_copies: -1
            }
        });

        res.status(201).json({
            message: "Loan checkout successfull",
            loan: {
                books: cart.books.map(book => ({
                    title: book.title,
                    author: book.author,
                    cover_image: book.cover_image && book.cover_image !== "" ? book.cover_image : "https://example.com/default-cover.jpg"
                })),
                borrow_date: loan.borrow_date,
                due_date: loan.due_date,
                status: loan.status
            }
        });
    } catch (error) {
        console.error("Error during checkout:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const memberLoan = async (req, res) => {
    try {
        const memberId = req.member.memberId;
        const {status, page = 1, limit = 10} = req.query;
        const query = {borrower: memberId};

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        const validStatus = ["borrowed", "returned", "overdue"];
        if (status && !validStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        if (status) {
            query.status = status;
        }

        const loans = await Loan.find(query).populate("books", "title author cover_image").sort({borrow_date: -1}).skip(skip).limit(limitNum);

        const totalLoan = await Loan.countDocuments(query);
        const totalBorrowedBooks = await Loan.countDocuments({
            borrower: memberId,
            status: "borrowed"
        });
        const totalReturnedBooks = await Loan.countDocuments({
            borrower: memberId,
            status: "returned"
        });
        const totalOverdueBooks = await Loan.countDocuments({
            borrower: memberId,
            status: "overdue"
        });

        const totalFine = await Loan.aggregate([
            {
                $match: {
                    borrower: memberId,
                    status: "returned"
                }
            },
            {
                $group: {
                    _id: null,
                    totalFine: {
                        $sum: "$fine"
                    }
                }
            }
        ]);

        res.status(200).json({
            message: "Member loan list",
            data: {
                loans: {
                    loan: loans.map(loan => ({
                        id: loan._id,
                        books: loan.books.map(book => ({
                            id: book._id,
                            title: book.title,
                            author: book.author,
                            cover_image: book.cover_image
                        })),
                        borrow_date: loan.borrow_date,
                        due_date: loan.due_date,
                        return_date: loan.return_date,
                        status: loan.status,
                        fine: loan.fine
                    }))
                },
                totalLoan: totalLoan,
                totalBorrowedBooks: totalBorrowedBooks,
                totalReturnedBooks: totalReturnedBooks,
                totalOverdueBooks: totalOverdueBooks,
                totalFine: totalFine.length > 0 ? totalFine[0].totalFine : 0
            }
        });
    } catch (error) {
        console.error("Error during listing member loan:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const listLoan = async (req, res) => {
    try {
        const adminId = req.admin.adminId;
        const {memberID, status, page = 1, limit = 10} = req.query;
        const query = {};

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        const validStatus = ["borrowed", "returned", "overdue"];
        if (status && !validStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        if (memberID) {
            const member = await Member.findOne({
                memberID: memberID
            });
            if (!member) {
                return res.status(404).json({
                    message: "Member not found"
                });
            }
            query.borrower = member._id;
        }

        if (status) {
            query.status = status;
        }

        const loans = await Loan.find(query).populate("books", "title author cover_image").populate("borrower", "name memberID").sort({borrow_date: -1}).skip(skip).limit(limitNum);
        
        // Hitung total peminjaman
        const totalLoanCount = await Loan.countDocuments(query);

        // Hitung jumlah peminjaman berdasarkan status
        const totalLoanStatus = await Loan.aggregate([
            {
                $match: query
            },
            {
                $group: {
                    _id: "$status",
                    count: {
                        $sum: 1
                    }
                }
            }
        ]);

        // Hitung jumlah anggota yang memiliki peminjaman
        const totalBorrowers = await Loan.distinct("borrower", query).then(borrow => borrow.length);

        // Format data peminjaman
        const loanHistory = loans.map((loan) => {
            let fine = 0;
            const today = new Date();

            if (loan.due_date < today && !loan.return_date) {
                // Hitung denda jika overdue
                const daysLate = Math.ceil((today - loan.due_date) / (1000 * 60 * 60 * 24));
                fine = daysLate * 5000;
            }

            return {
                member: {
                    name: loan.borrower.name,
                    memberID: loan.borrower.memberID
                },
                books: loan.books.map(book => ({
                    title: book.title,
                    author: book.author,
                    cover_image: book.cover_image || "https://example.com/default-cover.jpg"
                })),
                borrow_date: loan.borrow_date,
                due_date: loan.due_date,
                return_date: loan.return_date,
                fine_amount: loan.fine_amount || fine,
                status: loan.status
            };
        });

        res.status(200).json({
            message: "Loan list retrieved successfully",
            data: {
                loan: loanHistory,
                totalLoanCount,
                totalLoanStatus,
                totalBorrowers,
                currentPage: pageNum,
                totalPages: Math.ceil(totalLoanCount / limitNum)
            }
        });
    } catch (error) {
        console.error("Error during listing loan:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const confirmLoanStatus = async (req, res) => {
    try {
        const adminId = req.admin.adminId;
        const {loanId} = req.params;
        const {status} = req.body;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        const loan = await Loan.findById(loanId);
        if (!loan) {
            return res.status(404).json({
                message: "Loan not found"
            });
        }

        const validStatus = ["borrowed", "returned", "overdue"];
        if (!validStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        if (loan.status === status) {
            return res.status(400).json({
                message: `Loan is already marked as ${status}`
            });
        }

        const previousStatus = loan.status;
        loan.status = status;

        if (previousStatus === "borrowed" && status === "returned") {
            loan.status = "returned";
            loan.return_date = new Date();
            await Book.updateMany(
                {
                    _id: {
                        $in: loan.books
                    }
                },
                {
                    $inc: {
                        available_copies: 1
                    }
                }
            );

            // Jika terlambat mengembalikan buku, hitung denda
            if (loan.return_date > loan.due_date) {
                const overdueDays = Math.ceil((loan.return_date - loan.due_date) / (1000 * 60 * 60 * 24));
                const finePerDay = 5000;
                loan.fine_amount = overdueDays * finePerDay;
            } else {
                loan.fine_amount = 0;
            }
        } else if (previousStatus === "returned" && status === "borrowed") {
            const bookToBorrow = await Book.find(
                {
                    _id: {
                        $in: loan.books.map(book => book._id)
                    }
                }
            );

            // Cek apakah semua buku tersedia untuk dipinjam
            for (const book of bookToBorrow) {
                if (book.available_copies === 0) {
                    return res.status(400).json({
                        message: `Book "${book.title}" is not available for borrowing`
                    });
                }
            }

            loan.status = "borrowed";
            loan.return_date = null;
            await Book.updateMany(
                {
                    _id: {
                        $in: loan.books
                    }
                },
                {
                    $inc: {
                        available_copies: -1
                    }
                }
            )
        } else {
            loan.return_date = null;
        }
        

        await loan.save();

        res.status(200).json({
            message: "Loan status updated successfully",
            loan: {
                status: loan.status,
                return_date: loan.return_date
            }
        });
    } catch (error) {
        console.error("Error during updating loan status:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        })
    }
}

export {checkOutLoan, memberLoan, listLoan, confirmLoanStatus};