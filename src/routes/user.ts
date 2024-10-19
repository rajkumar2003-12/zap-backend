import { Hono } from "hono";
import {PrismaClient} from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import {Signupinput} from "@nanipatel/zodupdates"

export const userRouter = new Hono<{
    Bindings:{
        DATABASE_URL:string
        JWT_SECRET:string
    },
    Variables:{
        userId:string
    }
}>()

userRouter.use("*", async(c, next)=>{
    const autherheader = c.req.header("Authorization")
    console.log("autherheader",autherheader)
    const token = autherheader?.split(" ")[1] || "";
    
     try{
     const user = await verify(token, c.env.JWT_SECRET)
     if(user){
     c.set("userId", user.id as string)

     await next()
     }else{
        c.status(403)
        return c.json({success:false,error:"you are not an auther"})
     }
    }catch(e){
        return c.json({error:e})
        console.log("errore",e)
    }
})

userRouter.put("/profile-edit", async(c)=>{
    const userId = c.get("userId")
    const NewDetails = await c.req.json()
    const {success} = Signupinput.safeParse(NewDetails)
    // if(success){
    //     return c.json({success:true})
    // }
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
     }).$extends(withAccelerate())
     
      try{
        const User = await prisma.user.findUnique({
            where:{
                id:Number(userId)
            }
        })
        if(!User){
        return c.json({success:false})
        console.log(User)
    }
        const userUpdate = await prisma.user.update({
            where:{
                id:Number(userId)
            },data:{
                username:NewDetails.username,
                name:NewDetails.name,
                email:NewDetails.email,
                password:NewDetails.password
            }
        })
        if(userUpdate){
            c.status(200)
            return c.json({success:true, userUpdate:userUpdate ,message:"your details updated successfully"})
        }   
    }catch(e){
        c.status(403)
        return c.json({error:e})
    }
})
userRouter.put("/passwordChange", async(c)=>{
    const userId = c.get("userId")
    const ChangePassword = await c.req.json()
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
     }).$extends(withAccelerate())
     
     try{
        const user = await prisma.user.update({
            where:{
                id:Number(userId),
            },
            data:{
                password:ChangePassword.password
            }
        })
        if(user){
            c.status(200)
            return c.json({success:true,update:user, message:"successfully updated your password"})
        }
     }catch(e){
        return c.json({error:e})
     }
})

userRouter.get("/get-profile",async(c)=>{
    const userId = c.get("userId")
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate())
    try{
   
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            select: {
                id:true,
                username:true,
                name:true,
                email:true,
                followers: {select: {userId: true,},},
                following: {select: {followingId: true,},},
                posts:{select:{id:true,},},
            }
         })
        if (!user) {
            return c.json({ message: "User not found" }, 404);
        }
        const formattedUser = {
            ...user,
            followers: user.followers ? user.followers.length : 0, 
            following: user.following ? user.following.length : 0, 
        }
    return c.json({ profile: formattedUser });
    }catch(e){
        return c.json({error:e})
    }finally {
        await prisma.$disconnect(); 
      }
})

userRouter.get('/profile/:userId', async (c) => {
    const userid = c.req.param("userId");

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const user = await prisma.user.findFirst({
            where: {
                id: Number(userid)
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                followers: {select:{userId: true,},},
                following: {select: {followingId: true,},}
        }
    })

 
        if (!user) {
            c.status(404);
            return c.json({
                message: "User not found"
            })
        }
       
        const formattedUser = {
            ...user,
            followers: user.followers ? user.followers.length : 0, 
            following: user.following ? user.following.length : 0, 
        }
            c.status(200);
            return c.json({
                formattedUser
            })
        }catch (e) {
        c.status(411);
        return c.json({
            "error": e
        })
    }
})