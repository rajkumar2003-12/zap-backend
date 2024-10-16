
import { Hono } from "hono";
import {sign } from "hono/jwt";
import {PrismaClient} from "@prisma/client/edge";
import { withAccelerate } from '@prisma/extension-accelerate';
import { Signupinput,Signinput } from "@nanipatel/zodupdates";

export const authorRouter = new Hono<{
    Bindings:{
      DATABASE_URL:string;
      JWT_SECRET:string;
    },
    Variables:{
      expiresIn:string
    }
  }>
  authorRouter.post("/signup", async(c)=>{
    const body = await c.req.json();
    const {success, error} =Signupinput.safeParse(body)
    console.log(success)
    console.log("Validation error:", error)
    if(!success){
        return c.text("inputes not correct")
    }

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    try{
    const user=await prisma.user.create({
      data:{
        username:body.username,
        name:body.name,
        email:body.email,
        password:body.password,
      }
    })
    console.log(user)
    const jwt_token = await sign({id:user.id}, c.env.JWT_SECRET);
    console.log(jwt_token)
  
    return c.json({ token: jwt_token });
  
  }catch(e){
    c.status(411);
    return c.text("already exist")
  }
  })
  authorRouter.post("/signin", async(c)=>{
    const body = await c.req.json();
    const {success} = Signinput.safeParse(body)
    if(!success){
        return c.text("inputes not correct")
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  try{
    const user=await prisma.user.findFirst({
      where:{
        email:body.email,
        password:body.password,
      }
    })
    if(!user){
        c.status(403);
        return c.text("you are not user")
    }
    console.log(user)
    const jwt = await sign({id:user.id}, c.env.JWT_SECRET)
    console.log(jwt)
  
    return c.json({ token: jwt });
  }catch(e){
    c.status(411);
    return c.text("invalid")
  }
  })

