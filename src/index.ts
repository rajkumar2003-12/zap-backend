import { Hono } from 'hono'
import {authorRouter} from './routes/auth';
import {zapRouter} from './routes/zap';
import { cors } from 'hono/cors';
import { commentRouter } from './routes/comment';
import { likesRouter } from './routes/likes';
import {followRouter} from "./routes/follow"
import { userRouter } from './routes/user';

const app = new Hono<{
  Bindings:{
    DATABASE_URL:string;
    JWT_SECRET:string;
  }
}>

app.use('*', cors({
  origin: ['http://localhost:5173'], 
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders:['content-length'],
  maxAge:600,
  credentials:true
}));

app.route("/author", authorRouter)
app.route("/zap", zapRouter)
app.route("/comment", commentRouter)
app.route("/likes", likesRouter)
app.route("/follow",followRouter)
app.route("/user", userRouter)
export default app
