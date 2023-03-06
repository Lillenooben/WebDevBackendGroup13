import express from 'express'
import {createPool} from 'mariadb'
import * as mod from './globalFunctions.js'
import {router as userRouter} from './user-router.js'
import {router as groupRouter} from './group-router.js'

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

app.get("/", function(request, response){
    response.send("It works")
})

app.use("/user", userRouter)

app.use("/group", groupRouter)

app.listen(8080)