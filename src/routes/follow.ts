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


followRouter.get("/get/:followId", async (c) => {
    try {
      const followId = c.req.param("followId");
      const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate());
  
      if (!followId) {
        return c.json({ error: 'Invalid request. Missing follow ID.' }, 400);
      }
      const currentUserId = c.get("userId"); 

      if (!currentUserId) {
        return c.json({ error: 'Unauthorized.' }, 401);
      }
      const followers = await prisma.follower.findMany({
        where: {
          followingId: Number(followId), 
        },
        select: {
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      });
  
      const following = await prisma.follower.findMany({
        where: {
          userId: Number(followId), 
        },
        select: {
          following: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      });
  
      const isFollowing = await prisma.follower.findFirst({
        where: {
          userId: Number(currentUserId),
          followingId: Number(followId),
        },
      });

      const formattedFollowers = followers.map((followerData) => ({
        id: followerData.follower.id,
        name: followerData.follower.name,
        username: followerData.follower.username,
      }));
  
      const formattedFollowing = following.map((followingData) => ({
        id: followingData.following.id,
        name: followingData.following.name,
        username: followingData.following.username,
      }));

      const followList ={
        followersCount: formattedFollowers.length,
        followingCount: formattedFollowing.length,
        followersList: formattedFollowers,
        followingList: formattedFollowing,

      }
      c.status(200)
      return c.json({followList:followList, isFollowing: !!isFollowing,});
    } catch (error) {
      console.error("Error retrieving followers and following lists:", error);
      return c.json({ error: "Failed to retrieve data" }, 500);
    }
  });
  

