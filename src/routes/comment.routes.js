const Comment=require('../models/comment.model')
const mongoose=require('mongoose')
const express=require('express')
const router=express.Router()
const Ticket=require('../models/ticket.model')
const {authMiddleware,authorizeAdmin} = require('../middleware/auth.middleware')


router.post('/:ticketId',authMiddleware, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const{message}=req.body
        const ticket = await Ticket.findById(ticketId);
        const authorId=req.user._id
        console.log("ticketId:", ticketId, "authorId:", authorId, "message:", message); // Log the values for debugging
        //now validate all exist
        if(!ticketId || !authorId || !message){
            return res.status(400).json({error:"ticketId,authorId and message are required"})
        }
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        if (req.user._id.toString()===ticket.customerId.toString() || req.user._id.toString()===ticket.assignedAgentId?.toString()){
            //user is authorized to comment on this ticket
        } else {
            return res.status(403).json({ error: 'You are not authorized to view comments for this ticket' });

        }

       
        //create a new comment and store in db
        const newComment=await Comment.create({
            ticketid:ticketId,
            authorid:authorId,
            message:message
        })
        await newComment.populate('authorid','name email -_id')//populate author details in comment
        ticket.updatedAt=new Date()//update ticket updatedAt field
        await ticket.save()//save the ticket with updatedAt field
        res.status(201).json({
            message:"Comment created successfully",
            comment:newComment
        })
    } catch (err) {
        console.error("Error creating comment:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.get('/:ticketId',authMiddleware, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticket = await Ticket.findById(ticketId);
        if (!ticketId) {
            return res.status(400).json({ error: 'ticketId is required' });
        }
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        if (req.user._id.toString()===ticket.customerId.toString() || req.user._id.toString()===ticket.assignedAgentId?.toString()){
            //user is authorized to view comments for this ticket
        }else{
            return res.status(403).json({ error: 'You are not authorized to view comments for this ticket' });
        }
        const comments = await Comment.find({ ticketid: ticketId }).populate('authorid', 'name email -_id');
        res.status(200).json({
            message: "Comments fetched successfully",
            comments: comments
        });
    } catch (err) {
        console.error("Error fetching comments:", err);
        res.status(500).json({ error: 'Internal server error' });
    }   
})

module.exports=router


