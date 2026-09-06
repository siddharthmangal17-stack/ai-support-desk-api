const mongoose = require('mongoose');

// 1. Base Options configuration
const baseOptions = {
    discriminatorKey: 'role', // This automatically creates and handles your 'role' field!
    collection: 'users',      // Stores everyone in the same MongoDB collection
    timestamps: true          // Fixed typo
};

// 2. Base Schema (Fields EVERY user must have)
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true, // Fixed unique syntax
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
}, baseOptions);

const User = mongoose.model("User", userSchema);

// 3. Customer Schema
// Customers don't get skills or allotted tickets, keeping their documents lightweight.
const Customer = User.discriminator('Customer', new mongoose.Schema({
    // You can add customer-specific fields here later (e.g., membershipLevel)
}));

// 4. Support-Agent Schema
// Only Support Agents will have these specific fields in the database.
const SupportAgent = User.discriminator('Support-Agent', new mongoose.Schema({
    skills: {
        type: [String],
        enum: ["Technical", "Billing", "Account", "General"],
        default: ["General"]
    },
    Allotedtickets: [{ // Notice the array bracket syntax here for cleaner population
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket"
    }],
    isAvailable: {
        type:Boolean,
        default:true
    },
    AllotedTicketsCount: {
        type: Number,
        default: 0
    }
}));

// 5. Admin Schema
const Admin = User.discriminator('Admin', new mongoose.Schema({
    // Admins usually share agent capabilities, but you can add admin-specific privileges
    skills: {
        type: [String],
        enum: ["Technical", "Billing", "Account", "General"],
        default: ["General"]
    },
    Allotedtickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket"
    }]
}));

// Export all models so you can use them in your routes
module.exports = {  User,Customer, SupportAgent, Admin };