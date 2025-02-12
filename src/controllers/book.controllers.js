import Book from "../models/book.models.js";
import Admin from "../models/admin.models.js";
import validator from "validator";
import fs from "fs/promises";
import { v2 as cloudinary } from 'cloudinary';

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
            cover_image: result.secure_url
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

export {addBooks};