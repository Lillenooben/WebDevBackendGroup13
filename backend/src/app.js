import express from 'express'
import jwt from 'jsonwebtoken'
import {userRouter} from './user-router.js'
import {groupRouter} from './group-router.js'
import {eventRouter} from './event-router.js'
import * as globalFunctions from './globalFunctions.js'
import {ACCESS_TOKEN_SECRET, EXPIRATION_TIME_SECONDS} from './constants.js'

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

    const loginResult = await globalFunctions.compareLoginCredentials(username, password)

    if(loginResult.didSucceed){
        
        const payload = {
            sub: loginResult.user.userID,
        }
        
        jwt.sign(payload, ACCESS_TOKEN_SECRET, function(error, access_token){

            if (error) {
                console.log(error)
                response.status(500).json({error: "internal server error"})
            } else {

                const idTokenPayload = {
                    iss: "http://localhost:8080",
                    sub: loginResult.user.userID,
                    aud: "Notify.Us",
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000)+EXPIRATION_TIME_SECONDS,
                    username: loginResult.user.name
                }

                jwt.sign(idTokenPayload, ACCESS_TOKEN_SECRET, function(error, id_token){

                    if (error) {
                        console.log(error)
                        response.status(500).json({error: "internal server error"})

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