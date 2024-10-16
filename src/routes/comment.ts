import { Hono } from "hono";
import {PrismaClient} from "@prisma/client/edge";
import { withAccelerate } from '@prisma/extension-accelerate';
import { verify } from "hono/jwt";
import { commentUpdate,CommentCreate } from "@nanipatel/zodupdates";



export const commentRouter = new Hono<{
    Bindings:{
        DATABASE_URL:string;
        JWT_SECRET:string;
      },
      Variables:{
        userId:string;
      }
    }>();


    commentRouter.use("*", async(c, next)=>{
        const authHeader = c.req.header("Authorization");
        const token = authHeader?.split(" ")[1] || "";;
        console.log(token)

        try{
        const user = await verify(token, c.env.JWT_SECRET);
        console.log(user)
        if(user){
            c.set("userId", user.id as string)
           await next()
        }else{
            c.status(403);
            return c.json({
                message: "you are not auther"
            })
        }
    }catch(e){
        c.status(403);
        return c.json({"error": e})
    }
    })

    commentRouter.post("/create", async (c) => {
        const userId = c.get("userId");
        const body = await c.req.json();
        
        try {
            const valid = CommentCreate.safeParse(body);
            if (!valid.success) {
                 c.status(400)
                 return c.json({ error: valid.error });
            }
    
            const prisma = new PrismaClient({
                datasourceUrl: c.env.DATABASE_URL,
            }).$extends(withAccelerate());
    
            const res = await prisma.comment.create({
                data: {
                    content: body.content,
                    userid: Number(userId),
                    zapid: body.zapid,
                },
            });
           c.status(200)
            return c.json({ res });
        } catch (error) {
            c.status(500) 
           return c.json({ error: "Internal Server Error" });
        }
    });
    
    commentRouter.put("/update/:id", async(c)=>{
        const id = c.req.param("id");
        const body = await c.req.json();
        const {success} = commentUpdate.safeParse(body)
        if(!success){
            return c.text("inputes not correct")
        }
        
        const prisma = new PrismaClient({
          datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate())
      
        const res=await prisma.comment.update({
            where:{
                id: Number(id)
            },
            data:{
                content:body.content
            }
        })
        return c.json({message:res})
    })

    commentRouter.delete("/delete/:id", async (c) => {
        const id = c.req.param("id");
    
        try {
            const prisma = new PrismaClient({
                datasourceUrl: c.env.DATABASE_URL,
            }).$extends(withAccelerate());
    
            const res = await prisma.comment.delete({
                where: {
                    id: Number(id),
                },
            });
    
            return c.json({ success: true, message: "Comment deleted successfully", res });
        } catch (error) {
            c.status(500)
            return c.json({ success: false, error: "Internal Server Error" });
        }
    });

    commentRouter.get("/get/:zapId", async(c)=>{
        const zapId = c.req.param("zapId")
        const prisma = new PrismaClient({
          datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate())
    
    
        const getMany=await prisma.comment.findMany({
            where:{
                zapid:Number(zapId)
            },
            select:{
                id:true,
                content:true,
                updatedAt:true,
                user:{select:{username:true}}
            }
        })
        return c.json({getMany})
    })
    