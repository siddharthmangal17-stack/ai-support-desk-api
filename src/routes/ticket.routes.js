const mongoose=require('mongoose')
const Ticket=require('../models/ticket.model')
const {authMiddleware,authorizeAdmin,authorizeSupportAgent}=require('../middleware/auth.middleware')
const {  User,Customer, SupportAgent, Admin }=require('../models/user.model')

const express=require('express')
const router=express.Router()


const { classifyTicketWithAI } = require('../ai_services/gemini_ai'); // Import your working Gemini service

// POST http://localhost:3000/api/tickets/create



async function assignTicketToAgent(ticket) {
    try {
        const category = ticket.category;
        
        // 1. Find an agent with the right skill (Make sure 'isAvailable' is in your schema!)
        const agent = await SupportAgent.findOne({ skills: category, isAvailable: true, AllotedTicketsCount:  {$lt:10} }).sort({ AllotedTicketsCount: 1 }); // Get the agent with the least tickets assigned
        
        if (!agent) {
            console.log("No available agent right now. Added to global queue.");
            return ticket; // Returns the unassigned ticket
        } 
        
        // 2. Update the Agent's array and save
        agent.Allotedtickets.push(ticket._id);
        agent.AllotedTicketsCount += 1; // Increment the count of allotted tickets
        await agent.save(); 
        
        // 3. Update the Ticket and save it to the database
        ticket.status = "In Progress";
        ticket.assignedAgentId = agent._id;
        await ticket.save(); // The database is now fully updated!
        //POPULATE the assignedAgentId field to return the agent's name and email in the response
        await ticket.populate('assignedAgentId', 'name email -_id');//remember populate does not add in
        //database it just adds in memory for the response to the frontend
        
        return ticket; 

    } catch (err) {
        console.error("Assignment error:", err);
        throw err; 
    }
}


async function findTicketforAgent(agentId){
    const agent=await SupportAgent.findById(agentId)
    const skill=agent.skills
    const ticket=await Ticket.findOne({ category: { $in: skill }, status: "Open", assignedAgentId: null }).sort({ dueAt: 1 });
    if (!ticket){
        return null;
    }
    ticket.assignedAgentId=agentId
    return ticket


}



router.post('/create',authMiddleware, async (req, res) => {
    try {
        const { title, description } = req.body;
        const customerId=req.user._id
        console.log(customerId)

        // 1. Safety Validation: Ensure no required fields are blank
        if (!customerId || !title || !description) {
            return res.status(400).json({ error: 'customerId, title, and description are required fields' });
        }

        // 2. Base Registration: Create a basic ticket in MongoDB first with initial safe defaults
        const basicDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour default
        let currentTicket = await Ticket.create({
            title,
            description,
            customerId,
            dueAt: basicDeadline
        });

        // 3. AI Interception: Send the text off to Google Gemini for contextual classification
        const aiAnalysis = await classifyTicketWithAI(title, description);

        // 4. SLA Escalation: Recalculate response deadlines dynamically based on AI priority output
        const dynamicDeadline = new Date();
        if (aiAnalysis.priority === 'URGENT') {
            dynamicDeadline.setHours(dynamicDeadline.getHours() + 2); // 2 Hours to resolve!
        } else if (aiAnalysis.priority === 'HIGH') {
            dynamicDeadline.setHours(dynamicDeadline.getHours() + 8);  // 8 Hours to resolve!
        } else {
            dynamicDeadline.setHours(dynamicDeadline.getHours() + 24); // 24 Hours default
        }

        // 5. Update Step: Save all the smart AI values right back into the MongoDB ticket row
        let enhancedTicket = await Ticket.findByIdAndUpdate(
            currentTicket._id,
            {
                category: aiAnalysis.category,
                priority: aiAnalysis.priority,
                aiSummary: aiAnalysis.summary,
                aiConfidence: aiAnalysis.confidence,
                dueAt: dynamicDeadline
            },
            { returnDocument: 'after' }// Returns the newly updated ticket fields back to us
        );
        enhancedTicket=await assignTicketToAgent(enhancedTicket)
        // 6. Response: Return the beautiful smart ticket to the frontend/Postman
        return res.status(201).json({
            message: "Ticket created and processed by Gemini AI successfully!",
            ticket: enhancedTicket
        });

    } catch (err) {
        console.error("❌ Ticket creation pipeline crashed:");
        console.error(err);
        return res.status(500).json({ error: "Internal server processing failure occurred" });
    }
    ; // Attempt to assign the ticket to an available agent
});



router.get('/all',authMiddleware,async(req,res)=>{
    try{
        const customerId=req.user._id
        const tickets=await Ticket.find({customerId})
        .select('title status category assignedAgentId dueAt updatedAt -_id')
        .populate('customerId','name email -_id')
        res.status(200).json(tickets)
    }catch(err){
        console.log("could not fetch tickets")
        console.log(err)
        res.status(500).json({ error: 'Internal server error' });
    }
})


router.get('/supportagent/all',authMiddleware,authorizeSupportAgent,async(req,res)=>{
    try{
        const agentId=req.user._id
        const tickets=await Ticket.find({assignedAgentId:agentId,status:"In Progress"}).sort({dueAt:1}).select('title description dueAt customerId')
        .populate('customerId','name -role')
        res.status(200).json(tickets)
    }catch(err){
        console.log("could not fetch tickets for agent")
        console.log(err)
        res.status(500).json({ error: 'Internal server error' });
    }
})


router.patch('/resolve/:ticketId',authMiddleware,authorizeSupportAgent,async(req,res)=>{
    try{
        const {ticketId}=req.params
        const ticket=await Ticket.findById(ticketId)
        if(!ticket){
            return res.status(404).json({error:"Ticket not found"})
        }
        if (req.user._id.toString()===ticket.assignedAgentId?.toString()){
            ticket.status="Resolved"
            await ticket.save()
            await SupportAgent.findByIdAndUpdate(ticket.assignedAgentId, {
            $inc: { AllotedTicketsCount: -1 },
            $pull: { Allotedtickets: ticketId }
            });
            const new_ticket=await findTicketforAgent(ticket.assignedAgentId)
            if (!new_ticket){
                return res.status(200).json({message:"Ticket resolved successfully"})
            }
            const agent=await SupportAgent.findById(ticket.assignedAgentId)
            agent.Allotedtickets.push(new_ticket._id)
            agent.AllotedTicketsCount += 1
            await agent.save()
            new_ticket.status="In Progress"
            await new_ticket.save() 
            return res.status(200).json({message:"Ticket resolved successfully and new ticket assigned to agent",new_ticket})
        }else{
            return res.status(403).json({ error: 'You are not authorized to resolve this ticket' });
        }
    }catch(err){
        console.error("❌ Error in resolving ticket:");
        console.error(err);
        return res.status(500).json({ error: "Internal server error occurred" });
    }
})

module.exports=router