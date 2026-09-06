
const express=require('express');
const app=express()
app.use(express.json())
const cookieParser=require('cookie-parser')
app.use(cookieParser())

const userRoutes=require('./routes/user.routes')
const ticketRoutes=require('./routes/ticket.routes')
const commentRoutes=require('./routes/comment.routes')
const connectDB=require('./config/db')
connectDB()
app.use('/api/auth',userRoutes)
app.use('/api/tickets',ticketRoutes)
app.use('/api/comments',commentRoutes)
module.exports=app;
