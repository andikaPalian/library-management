import Cart from "../models/cart.models.js";
import Book from "../models/book.models.js";
import Member from "../models/member.models.js";
import mongoose from "mongoose";

const addToCart = async (req, res) => {
    try {
        const memberId = req.member.memberId;
        const {bookId} = req.params;

        const member = await Member.findOne({
            _id: memberId,
            member_status: "active"
        });
        if (!member) {
            return res.status(404).json({
                message: "Member not found or inactive"
            });
        }

        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        let cart = await Cart.findOne({member: memberId});
        if (!cart) {
            cart = new Cart({
                member: memberId,
                books: []
            })
        }

        if (cart.books.some(book => book._id.toString() === bookId)) {
            return res.status(400).json({
                message: "Book is already in the cart"
            });
        }

        cart.books.push({_id: bookId});
        await cart.save();

        cart = await cart.populate("books", "title author cover_image");

        res.status(201).json({
            message: "Book added to cart successfully",
            cart: {
                member: cart.member,
                books: cart.books.map(book => ({
                    title: book.title,
                    author: book.author,
                    cover_image: book.cover_image
                }))
            }
        });
    } catch (error) {
        console.error("Error during add book to cart:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const removeCart = async (req, res) => {
    try {
        const memberId = req.member.memberId;
        const {bookId} = req.params;

        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({
                message: "Invalid book ID"
            });
        }

        const cart = await Cart.findOne({
            member: memberId
        });
        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        const book = cart.books.find(book => book._id.toString() === bookId);
        if (!book) {
            return res.status(404).json({
                message: "Book not found in the cart"
            });
        }

        // if (!cart.member.toString() === memberId) {
        //     return res.status(403).json({
        //         message: "You are not authorized to remove this book from the cart"
        //     });
        // }

        const removeBooks = await Cart.findOneAndUpdate({
            member: memberId,
        },{
            $pull: {
                books: bookId
            }
        }, {
            new: true
        }).populate("books", "title author cover_image");
        // if (!removeBooks) {
        //     return res.status(404).json({
        //         message: "Book not found in the cart"
        //     });
        // }
        res.status(200).json({
            message: "Book removed from cart successfully",
            cart: {
                member: removeBooks.member,
                books: removeBooks.books.map(book => ({
                    title: book.title,
                    author: book.author,
                    cover_image: book.cover_image
                }))
            }
        });
    } catch (error) {
        console.error("Error during remove book from cart:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const getCart = async (req, res) => {
    try {
        const memberId = req.member.memberId;
        
        const cart = await Cart.findOne({member: memberId}).populate("books", "title author cover_image").sort({added_date: -1});
        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        res.status(200).json({
            message: "Cart found",
            cart: {
                member: cart.member,
                books: cart.books.map(book => ({
                    title: book.title,
                    author: book.author,
                    cover_image: book.cover_image
                }))
            }
        });
    } catch (error) {
        console.error("Error during get cart:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

export {addToCart, removeCart, getCart};