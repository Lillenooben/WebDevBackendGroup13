import express from 'express'
import jwt from 'jsonwebtoken'
import {createPool} from 'mariadb'
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

app.post("/tokens", async function(request, response){
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
            sub: result.user.userID,
        }
        
        jwt.sign(payload, ACCESS_TOKEN_SECRET, function(error, access_token){

            if (error) {
                response.status(500).json({error})
            } else {

                const idTokenPayload = {
                    iss: "http://localhost:8080",
                    sub: result.user.userID,
                    aud: "Notify.Us",
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000)+600,
                    username: result.user.username
                }

                jwt.sign(idTokenPayload, ACCESS_TOKEN_SECRET, function(error, id_token){

                    if (error) {
                        response.status(500).json({error})

                    } else {
                        response.status(200).json({
                            access_token: access_token,
                            type: "bearer",
                            id_token: id_token
                        })
                    }
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