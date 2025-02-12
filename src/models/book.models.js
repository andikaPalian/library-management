import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    isbn: {
        type: String,
        required: true,
        unique: true,
    },
    category: {
        type: String,
        required: true,
    },
    publisher: {
        type: String,
        required: true,
        trim: true
    },
    publication_year: {
        type: Number,
        required: true,
        min: 1000,
        max: new Date().getFullYear()
    },
    total_copies: {
        type: Number,
        required: true,
        min: 1
    },
    available_copies: {
        type: Number,
        required: true,
        min: 0
    },
    cover_image: {
        type: String,
        required: false, 
        default: ""
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    added_date: {
        type: Date,
        default: Date.now
    }
});

const Book = mongoose.model("Book", bookSchema);

export default Book;