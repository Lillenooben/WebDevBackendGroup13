import express from 'express'
import jwt from 'jsonwebtoken'
import {createPool} from 'mariadb'
import bcrypt from 'bcrypt'
import {router as userRouter} from './user-router.js'
import {router as groupRouter} from './group-router.js'
import {router as eventRouter} from './event-router.js'
import * as mod from './globalFunctions.js'

export const ACCESS_TOKEN_SECRET = "sdkvjnaewrfjjljqwlvd"

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

app.use(express.json({limit: '10mb'}))

app.use(express.urlencoded({limit: '10mb', extended: true}))

app.use(function(req, res, next) {

    res.set("Access-Control-Allow-Origin", "*")
    res.set("Access-Control-Allow-Methods", "*")
    res.set("Access-Control-Allow-Headers", "*")
    res.set("Access-Control-Expose-Headers", "*")

    next()

})

app.get("/", function(request, response){
    response.send("It works")
})

app.post("/login", async function(request, response){
    const grantType = request.body.grant_type
    const username = request.body.username
    const password = request.body.password

    if (grantType != "password") {
        response.status(400).json({error: "unsupported_grant_type"})
        return
    }

    const result = await mod.compareLoginCredentials(username, password)

    if(result.success){
        
        const payload = {
            sub: result.id,
            username: username,
        }

        jwt.sign(payload, ACCESS_TOKEN_SECRET, function(error, accessToken){

            if (error) {
                response.status(500).end()
            } else {
                response.status(200).json({
                    access_token: accessToken,
                    type: "bearer",
                    userID: result.id
                })
            }

        })

    }
    else{
        response.status(400).json({error: "invalid_grant"})
    }

})

app.use("/user", userRouter)

app.use("/group", groupRouter)

app.use("/event", eventRouter)

app.listen(8080)