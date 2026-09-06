const {  User,Customer, SupportAgent, Admin }=require('../models/user.model')
const express=require('express')
const router=express.Router()
const bcrypt=require('bcryptjs')    
const jwt=require('jsonwebtoken')
const {authMiddleware,authorizeAdmin} = require('../middleware/auth.middleware')
router.post('/register',async(req,res)=>{
    try{
    const {name,email,password,role}=req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const isExist= await  User.findOne({
        email:email
    })
    if (isExist){
        return res.status(422).json({
            message:"User already exist with this email id"
        })
    }
    let newUser;
    const encryptedPassword=await bcrypt.hash(password,10)
    if (role==="Customer"){
        newUser=await Customer.create({
            name,
            email,
            password:encryptedPassword
        })
    }else if (role==="Admin"){
        newUser=await Admin.create({
            name,
            email,
            password:encryptedPassword
        })
    }
        
    const token=jwt.sign(
        {id:newUser._id,name:newUser.name,email:newUser.email,role:newUser.role},
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )
    res.cookie("token",token)
    res.status(201).json({
      message: 'User registered successfully!',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
}catch(err){
    console.log("req.body:", req.body); // Log the request body for debugging
    console.log("could not register user")
    console.log(err)
    res.status(500).json({ error: 'Internal server error' });
}   })

router.post('/login',async(req,res)=>{
    try{
    const {email,password}=req.body
    if (!email || !password){
        return res.status(400).json({
            message:"email and password must be provided"
        })
    }
    const user=await User.findOne({email})
    if (!user){
        return res.status(401).json({
            message:"Invalid email or password"
        })
    }

    const isMatch=await bcrypt.compare(password,user.password)
    if (!isMatch){
        return res.status(401).json({
            message:"Invalid email or password"
        })
    }
    console.log("work done till here")

    const token =jwt.sign(
        {id:user._id,name:user.name,email:user.email,role:user.role},
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )
    res.cookie("token",token)
    return res.status(200).json({
        message:"Login successful",
        token,
        user:{
            id:user._id,
            name:user.name,
            email:user.email,
            role:user.role
        }
    })
}  catch(err){
    console.log("could not login user")
    console.log(err)
    res.status(500).json({ error: 'Internal server error' });
}
})


router.post('/register_support_agent',authMiddleware,authorizeAdmin,async(req,res)=>{
    try{
    const {name,email,password,skills}=req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const isExist= await  User.findOne({
        email:email
    })
    if (isExist){
        return res.status(422).json({
            message:"User already exist with this email id"
        })
    }
    const encryptedPassword=await bcrypt.hash(password,10)
    const newUser=await SupportAgent.create({
        name,
        email,
        password:encryptedPassword,
        skills:skills,
        role:"Support-Agent"
    })
    res.status(201).json({
      message: 'Support agent registered successfully!',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        skills:newUser.skills
      },
    });
}catch(err){
    console.log("req.body:", req.body); // Log the request body for debugging
    console.log("could not register support agent")
    console.log(err)
    res.status(500).json({ error: 'Internal server error' });
}   })

module.exports=router

