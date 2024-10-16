import {PrismaClient} from "@prisma/client/edge"
import { withAccelerate } from "@prisma/extension-accelerate"
import { Hono } from "hono"
import { verify } from "hono/jwt"

export const followRouter = new Hono<{
    Bindings:{
        DATABASE_URL:string
        JWT_SECRET:string
    },
      Variables:{
        userId:string
      }
}>();

followRouter.use("*", async(c, next)=>{
    const authHeader = c.req.header("Authorization")
    const token = authHeader?.split(" ")[1] || " ";
    if(!token){
        return c.json({error: "token did not split "})
    }
    
    try{
        const user = await verify(token, c.env.JWT_SECRET)
        if(user){
            c.set("userId", user.id as string)

          await next()

        }else{ c.status(403)
            return c.json({message:"You not auther"})
        }
    }catch (e) {
        console.log(e);
        c.status(403)
        return c.json({error:e})
    }
})

followRouter.post("/follow-unfollow/:followingId", async(c)=>{
    const userId = c.get("userId")
    const followingId = c.req.param("followingId");

    console.log("userId: ", userId)
    console.log("followerId: ", followingId);

    const prisma= new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate())

    try{
       
        const follower = await prisma.follower.findFirst({
            where:{
                userId:Number(userId),
                followingId:Number(followingId)
            }
        })
        if(follower){
            const unfollow = await prisma.follower.delete({
                where:{
                    id: follower.id
                }
            })
            c.status(200)
            return c.json({message:"Unfollowed!", success:true, unfollow:unfollow})
        }
        const Newfollow = await prisma.follower.create({
            data:{
                userId:Number(userId),
                followingId:Number(followingId)
            }
        })
        return c.json({success:true,follow:Newfollow})
    }catch(error){
        c.status(403)
        return c. json({error:error})
    }
    
})


followRouter.get("/get/:followId", async(c)=>{
  try {
    const userid = c.req.param("followId")
    const authUserId = c.get("userId")
    
    const prisma= new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate())


    if (!userid || !authUserId) {
      return c.json({ error: 'Invalid request. Missing user ID.' }, 400);
    }

    const followStatus = await prisma.follower.findFirst({
      where: {
          userId: Number(authUserId),
          followingId: Number(userid), 
    }
    });
    c.status(200)
    return c.json({ isFollowing: followStatus !== null });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return c.json({ error: 'Failed to check follow status' }, 500);
  }
})

