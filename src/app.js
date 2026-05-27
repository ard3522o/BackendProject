import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()
// cors is used to allow cross-origin requests from the frontend, we specify the origin and credentials options to allow requests from the specified origin and to allow cookies to be sent with the requests
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(cookieParser())


//routes
import userRouter from "./routes/user.routes.js"
app.use('/api/v1/users', userRouter)

export default app

//app.get is used to define a route for GET requests, it takes two arguments, the first is the path of the route and the second is the callback function that will be executed when a request is made to that route, in this case we are defining a route for the root path ("/") and sending a response "Hello World" when a GET request is made to that route
//app.use is used to define middleware for the application, it takes one or more arguments, the first is the path for which the middleware will be executed and the second is the middleware function itself, in this case we are using app.use to define middleware for parsing JSON data, parsing URL-encoded data, serving static files from the "public" directory and parsing cookies from incoming requests