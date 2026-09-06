const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const {User}=require('../models/user.model'); 
async function authMiddleware(req,res,next){
    const token=req.cookies?.token  || req.headers.authorization?.split(" ")[1]
    console.log("token:", token); // Log the token for debugging
    if (!token){
        return res.status(401).json({
            message:"not logged in"
        })
    }

    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        if (!decoded || !decoded.id){
            return res.status(401).json({
                message:"Invalid token"
            })
        }
        console.log("we reached till here")
        const user=await User.findById(decoded.id)
        console.log(user)
        if (!user){
            return res.status(401).json({
                message:"User not found"
            })
        }
        req.user=user
        next()
    }
    catch(err){
        return res.status(401).json({
            message:"Unauthorused user token is completely invalid"

        })
    }

}
async function authorizeAdmin(req,res,next){
    if (req.user.role!=="Admin"){
        return res.status(403).json({
            message:"Access denies, Admins only"
        })
    }
    next()
}

async function authorizeSupportAgent(req,res,next){
    if (req.user.role!=="Support-Agent"){
        return res.status(403).json({
            message:"Access denied, Support Agents only"
        })
    }
    next()
}

module.exports={authMiddleware,authorizeAdmin,authorizeSupportAgent}
