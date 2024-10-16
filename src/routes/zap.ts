import { Hono } from "hono";
import {PrismaClient} from "@prisma/client/edge";
import { withAccelerate } from '@prisma/extension-accelerate';
import { verify } from "hono/jwt";
import { ZapCreate, ZapUpdate } from "@nanipatel/zodupdates";


export const zapRouter = new Hono<{
    Bindings:{
        DATABASE_URL:string;
        JWT_SECRET:string;
      },
      Variables:{
        userId:string;
      }
    }>();

    zapRouter.use("*", async(c, next)=>{
        const autherHeader = c.req.header("Authorization");
        const token = autherHeader?.split(" ")[1] || "";

        try{
        const user = await verify(token, c.env.JWT_SECRET);
        console.log(user)
        if(user){
            c.set("userId", user.id as string)
           await next()
        }else{
            c.status(403);
            return c.json({
                message: "you are not logged in"
            })
        }
    }catch(e){
        c.status(403);
        return c.json({"error": e})
    }
    })

    zapRouter.post("/create", async(c)=>{
        const body = await c.req.json();
        const {success} = ZapCreate.safeParse(body)
        if(!success){
            return c.text("inputes not correct")
        }
        const userId = c.get("userId")
        const prisma = new PrismaClient({
          datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate())
      
        const res=await prisma.zap.create({
            data:{
                title: body.title,
                content :body.content,
                userId:Number(userId)

            }
        })
        c.status(200)
        return c.json({response:res})
})

zapRouter.put("/update/:id", async(c)=>{
    const id = c.req.param("id");
    const body = await c.req.json();
    const {success} = ZapUpdate.safeParse(body)
    if(!success){
        return c.text("inputes not correct")
    }
    
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    const res=await prisma.zap.update({
        where:{
            id: Number(id)
        },
        data:{
            title:body.title,
            content:body.content
        }
    })
    return c.json({message:res})
})

zapRouter.get("/get/:id", async(c)=>{
    const id = c.req.param("id")
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())


    try{
    const getId=await prisma.zap.findFirst({
        where :{
            id:Number(id)
        }
    })
    return c.json({getId})

}catch(e){
    c.status(411);
    return c.json({message:"error while fetching"})
}
})
zapRouter.get("/get", async(c)=>{
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const getMany = await prisma.zap.findMany({
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt:true, 
          author: {
            select: {
              id: true, 
              username: true,
              name: true, 
            },
          },
        },
      });
    return c.json({getMany})
})



zapRouter.delete("/delete/all", async (c) => {
    const userId = c.get("userId")
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const zap = await prisma.zap.deleteMany({
            where: {
                userId:Number(userId),
            },
        });
        return c.json({
            message: "zap deleted successfully",
            zap,
        });
    } catch (error) {
        console.error("Error deleting blog:", error);
    }})

    zapRouter.get('/search', async (c) => {

        const prisma = new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate())
        const { title } = c.req.query();
        if (!title) {
          return c.json({ error: "Title is required" }, 400);
        }
      
        try {
          const zaps = await prisma.zap.findMany({
            where: {
              title: {
                contains: title, 
                mode: 'insensitive', 
              },
            },
          });
      
          if (zaps.length === 0) {
            return c.json({ msg: "No Zaps found" });
          }
      
          return c.json(zaps);  
        } catch (e) {
          return c.json({ error: "Something went wrong" }, 500);
        }
      });
      