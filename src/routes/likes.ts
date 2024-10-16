import {PrismaClient} from "@prisma/client/edge";
import { Hono } from "hono";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";

export const likesRouter = new Hono<{
    Bindings : {
        DATABASE_URL:string
        JWT_SECRET:string
    },
        Variables:{
            userId:string
        }
}>()
likesRouter.use("*", async(c, next)=>{
    const authheader = c.req.header("Authorization")
    const token = authheader?.split(" ")[1] || "";

    try{
        const user = await verify(token, c.env.JWT_SECRET)
        if (user){
            c.set("userId", user.id as string)

            await next()
        }else{c.status(403)
           return c.json({error:"You are not auther"})}
    }catch(error){
        c.status(403)
        return c. json({error:error})
    }
})

likesRouter.post("/like-unlike/:zapId", async (c) => {
    const userId = c.get("userId");
    const zapId = c.req.param("zapId");
    console.log("zapId:", zapId);
    console.log("userId:", userId);

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const existingLike = await prisma.like.findFirst({
            where: {
                userId: Number(userId),
                zapid: Number(zapId),
            },
        });

        if (existingLike) {
            const unlike = await prisma.like.delete({
                where: {
                    id: existingLike.id,
                },
            });
            c.status(200);
            return c.json({
                success: true,
                action: "unliked",
                unlike, 
                message: "Unliked successfully"
            });
        }

        const newLike = await prisma.like.create({
            data: {
                like: 1,
                userId: Number(userId),
                zapid: Number(zapId),
            },
            include: {
                zap: true,
                user: true,
            },
        });

        console.log(newLike);
        return c.json({
            success: true,
            action: "liked",
            like: newLike,
            message: "Liked successfully",
        });
    } catch (error) {
        console.error("Error:", error);
        c.status(403);
        return c.json({ error: "An error occurred" });
    } finally {
        await prisma.$disconnect(); 
    }
});


likesRouter.get("/get/:zapId", async (c) => {
    const userId = c.get("userId");
    const zapId = c.req.param("zapId");
  
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
  
    try {
   
      const like = await prisma.like.findFirst({
        where: {
          userId: Number(userId),
          zapid: Number(zapId),
        },
      });

      const likesCount = await prisma.like.count({
        where: {
          zapid: Number(zapId),
        },
      });
  
      const isLiked = !!like; 
      return c.json({ success: true, isLiked, likesCount });
    } catch (error) {
      c.status(403);
      return c.json({ error: error });
    } finally {
      await prisma.$disconnect();
    }
  });
  