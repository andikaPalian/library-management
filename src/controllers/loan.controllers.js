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

const listLoan = async (req, res) => {
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
                        borrower: loan.borrower,
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

export {checkOutLoan, listLoan};