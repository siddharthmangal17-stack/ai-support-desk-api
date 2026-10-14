# AI Support Desk API

An AI-assisted customer support backend built with Node.js, Express, and MongoDB. The system manages customer support tickets, supports role-based access for customers, support agents, and admins, and uses Gemini AI to classify tickets based on title and description.

This project is inspired by the workflows used in modern support platforms like Zendesk and Jira, but it is built as a custom backend solution focused on ticket lifecycle management and AI-powered support operations.

---

## Overview

This backend allows:

- Customers to register, log in, and create support tickets
- Support agents to receive and resolve assigned tickets
- Admins to manage users and support workflows
- AI to analyze incoming tickets and suggest category, priority, summary, and confidence
- SLA-based due dates for faster response handling
- Ticket comments and status updates for communication between customer and support team

The goal is to build a production-style support system where the core ticketing experience works even if the AI service is temporarily unavailable.

---

## Why this project?

Modern support teams need more than just a simple ticket tracker. They require:

- Secure authentication and authorization
- Role-based access control
- Workflow automation
- Ticket assignment and escalation
- AI-based classification to reduce manual effort
- Robust business logic for customer support operations

This project demonstrates those skills in a backend-focused implementation.

---

## Key Features

### Authentication & Authorization
- Customer registration and login
- JWT-based authentication
- Secure cookie-based token storage
- Role-based access for:
  - Customer
  - Support Agent
  - Admin

### Ticket Management
- Create tickets
- View tickets
- Update ticket status
- Reopen resolved tickets
- Assign tickets to support agents
- Track due dates and SLA deadlines

### Comments & Communication
- Customers can add comments to their own tickets
- Agents can comment on assigned tickets
- Admins can comment on all tickets
- Prevent empty or invalid comments

### AI Integration
- AI categorizes tickets
- AI determines priority
- AI generates summary and confidence score
- Fallback logic ensures the system continues operating even if AI fails

### Admin Features
- Register support agents
- Manage support workflows
- View or control operational data

### Security & Production Readiness
- Password hashing with bcrypt
- JWT verification middleware
- Protected routes
- Role checks
- Rate-limiting and secure headers can be added for production hardening

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Google Gemini API
- dotenv
- cookie-parser
- CORS support

---

## Project Structure

```bash
ai-support-desk-api/
├── src/
│   ├── ai_services/
│   │   └── gemini_ai.js
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── ticket.model.js
│   │   ├── comment.model.js
│   │   └── ...
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── ticket.routes.js
│   │   ├── comment.routes.js
│   │   └── admin.routes.js
│   ├── app.js
│   └── server.js
├── public/
│   └── index.html
├── .env
├── package.json
├── README.md
└── server.js
