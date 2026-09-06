const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    // This links the ticket directly to the Customer who created it
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Look! This matches the exact string name you registered earlier
      required: [true, 'A ticket must belong to a customer'],
    },
    // This links the ticket to the assigned Support Agent (can be blank initially)
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Links to the User model, but specifically for an agent role
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM', // Initial fallback value before AI scans it
    },
    category: {
      type: String,
      enum: ['Technical', 'Billing', 'Account', 'General'],
      default: 'General', // Initial fallback value before AI scans it
    },
    // AI Specific Fields
    aiSummary: {
      type: String,
      default: '',
    },
    aiConfidence: {
      type: Number,
      default: 0.0,
    },
    // SLA Field (Deadline tracking)
    dueAt: {
      type: Date,
      required: [true, 'SLA deadline date is required'],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

module.exports = mongoose.model('Ticket', ticketSchema);
