import Book from "../models/book.models.js";
import Admin from "../models/admin.models.js";
import Loan from "../models/loan.models.js";
import validator from "validator";
import fs from "fs/promises";
import { v2 as cloudinary } from 'cloudinary';
import mongoose from "mongoose";

const addBooks = async (req, res) => {
    try {
        const adminId = req.admin.adminId;
        const {title, author, isbn, category, publisher, publication_year, total_copies, available_copies, description} = req.body;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        if (!title?.trim() || !author?.trim() || !isbn?.trim() || !category?.trim() || !publisher?.trim() || !publication_year?.trim() || !total_copies?.trim() || !available_copies?.trim() || !description?.trim()) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (typeof title !== "string" || !validator.isLength(title, {min: 3, max: 100})) {
            return res.status(400).json({
                message: "Invalid title format. Title must be between 3 and 100 characters"
            });
        }

        if (typeof author !== "string" || !validator.isLength(author, {min: 3, max: 100})) {
            return res.status(400).json({
                message: "Invalid author format. Author must be between 3 and 100 characters"
            });
        }

        if (!validator.isISBN(isbn)) {
            return res.status(400).json({
                message: "Invalid ISBN format"
            });
        }

        if (typeof category !== "string" || !validator.isLength(category, {min: 3, max: 100})) {
            return res.status(400).json({
                message: "Invalid category format. Category must be between 3 and 100 characters"
            });
        }

        if (typeof publisher !== "string" || !validator.isLength(publisher, {min: 3, max: 100})) {
            return res.status(400).json({
                message: "Invalid publisher format. Publisher must be between 3 and 100 characters"
            });
        }

        if (!validator.isInt(publication_year, {min: 1000, max: new Date().getFullYear()})) {
            return res.status(400).json({
                message: "Invalid publication year format. Publication year must be between 1000 and the current year"
            });
        }

        if (!validator.isInt(total_copies, {min: 1})) {
            return res.status(400).json({
                message: "Invalid total copies format. Total copies must be a positive integer"
            });
        }

        if (!validator.isInt(available_copies, {min: 0, max: total_copies})) {
            return res.status(400).json({
                message: "Invalid available copies format. Available copies must be between 0 and total copies"
            });
        }

        if (typeof description !== "string" || !validator.isLength(description, {min: 3, max: 1000})) {
            return res.status(400).json({
                message: "Invalid description format. Description must be between 3 and 1000 characters"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            use_filename: true,
            unique_filename: true
        });

        await fs.unlink(req.file.path);

        const book = new Book({
            title,
            author,
            isbn,
            category,
            publisher,
            publication_year,
            total_copies,
            available_copies,
            description,
            cover_image: result.secure_url,
            cloudinary_id: result.public_id,
        });
        await book.save();

        res.status(201).json({
            message: "Book added successfully",
            book: {
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                category: book.category,
                publisher: book.publisher,
                publication_year: book.publication_year,
                total_copies: book.total_copies,
                available_copies: book.available_copies,
                description: book.description,
                cover_image: book.cover_image,
                added_date: book.added_date,
                cloudinary_id: book.cloudinary_id
            }
        });
    } catch (error) {
        console.error("Error during add books:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const editBooks = async (req, res) => {
    try {
        const adminId = req.admin.adminId;
        const {bookId} = req.params;
        const updateData = req.body;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({
                message: "Invalid book ID"
            });
        }

        const allowedFields = ["title", "author", "isbn", "category", "publisher", "publication_year", "total_copies", "available_copies", "description"];

        const data = {};
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                data[key] = value;
            } else if (key === "cover_image") {
                data.cover_image = value
            } else {
                return res.status(400).json({
                    message: "Invalid update fields",
                    error: `Only the following fields are allowed: ${allowedFields.join(", ")} and cover_image`
                });
            }
        }

        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        // Jika ada file uplooad baru untuk cover_image, process unggah ke cloudinary
        if (req.file) {
            // Jika buku sudah memiliki gambar di cloudinary, hapus gambar lama
            if (book.cloudinary_id) {
                await cloudinary.uploader.destroy(book.cloudinary_id)
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
                use_filename: true,
                unique_filename: true
            });

            await fs.unlink(req.file.path);

            data.cover_image = result.secure_url;
            data.cloudinary_id = result.public_id;
        }

        const updateBook = await Book.findByIdAndUpdate(
            bookId,
            {
                $set: data
            },
            {
                new: true
            }
        );
        if (!updateBook) {
            return res.status(404).json({
                message: "Book not found or already deleted"
            });
        }

        res.status(200).json({
            message: "Book updated successfully",
            book: {
                title: updateBook.title,
                author: updateBook.author,
                isbn: updateBook.isbn,
                category: updateBook.category,
                publisher: updateBook.publisher,
                publication_year: updateBook.publication_year,
                total_copies: updateBook.total_copies,
                available_copies: updateBook.available_copies,
                description: updateBook.description,
                cover_image: updateBook.cover_image,
                added_date: updateBook.added_date,
                cloudinary_id: updateBook.cloudinary_id
            }
        });
    } catch (error) {
        console.error("Error during edit books:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const deleteBooks = async (req, res) => {
    try {
        const adminId = req.admin.adminId;
        const {bookId} = req.params;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({
                message: "Invalid book ID"
            });
        }

        const loan = await Loan.findOne({books: bookId});
        if (loan) {
            return res.status(400).json({
                message: "Book is currently borrowed and cannot be deleted"
            });
        }

        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        // Jika buku memiliki gambar di cloudinary, hapus gambar tersebut
        if (book.cloudinary_id) {
            await cloudinary.uploader.destroy(book.cloudinary_id);
        }

        await Book.findByIdAndDelete(bookId);

        res.status(200).json({
            message: "Book deleted successfully"
        });
    } catch (error) {
        console.error("Error during delete books:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const listBooks = async (req, res) => {
    try {
        const book = await Book.find().sort({added_date: -1});
        res.status(200).json({
            message: "List of books",
            book: book.map(book => ({
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                category: book.category,
                publisher: book.publisher,
                publication_year: book.publication_year,
                total_copies: book.total_copies,
                available_copies: book.available_copies,
                description: book.description,
                cover_image: book.cover_image
            }))
        });
    } catch (error) {
        console.error("Error during list books:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

export {addBooks, editBooks, deleteBooks, listBooks};