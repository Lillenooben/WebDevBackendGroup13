import express from 'express'
import {createPool} from 'mariadb'
import bcrypt from 'bcrypt'
import {router as userRouter} from './user-router.js'
import {router as groupRouter} from './group-router.js'
import {router as eventRouter} from './event-router.js'
import * as mod from './globalFunctions.js'

const pool = createPool({
    host: "database",
    port: 3306,
    user: "root",
    password: "abc123",
    database: "abc"
})

pool.on('error', function(error){
    console.log("Error from pool", error)
})

const app = express()

app.use(express.json())

app.get("/", function(request, response){
    response.send("It works")
})

app.post("/login", async function(request, response){
    const enteredUsername = String(request.body.username)
    const enteredPassword = String(request.body.password)
    
    try{
        if(await mod.compareLoginCredentials(enteredUsername, enteredPassword)){
            response.redirect("/")
        }
        else{
            throw "Bad login info"
        }

    }catch(error){  
        console.log(error)
        response.status(500).end("Bad request")
    }
})

app.use("/user", userRouter)

app.use("/group", groupRouter)

app.use("/event", eventRouter)

app.listen(8080)