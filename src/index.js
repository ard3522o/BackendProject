//  require('dotenv').config({path: './.env'})
import dotenv from "dotenv";
dotenv.config({path: "./.env"});

import app from "./app.js";
import connectDB from "./db/index.js";

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
connectDB()
.then(() => {
app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running on port ${process.env.PORT || 8000}`)
})
})
.catch((err) => {
console.error("Mongo DB failed to connect", err)
})









// import express from "express"
// const app = express()
// //iffy
// (async () => {
// try{
//  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//  app.on("error", error => {
//     console.error("ERROR", error)
//     throw error
//  })

// app.listen(process.env.port, () => {
//     console.log(`Server is running on port ${process.env.PORT}`)
// })

// }catch (error) {
//     console.error("ERROR", error)
//     throw error
// }
// })()