const { Timestamp } = require('mongodb')
const mongoose=require('mongoose')
const commentSchema=new mongoose.Schema({
    ticketid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Ticket",
        required:[true,"There must be a ticket to comment on"]

    },
    authorid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true,"there must be some one who is writing comment"]
    },
    message:{
        type:String,
        required:true
    }
},{timestamps:true})
const commentmodel=mongoose.model("Comment",commentSchema)
module.exports=commentmodel;
