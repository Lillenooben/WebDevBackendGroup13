import express from 'express'
import {pool} from './db-pool.js'
import * as globalFunctions from './globalFunctions.js'
import {MIN_USERNAME_LEN, MAX_USERNAME_LEN, MIN_PASSWORD_LEN, MAX_PASSWORD_LEN} from './constants.js'

const router = express.Router()

router.use(express.json())

router.post("/", async function(request, response){
    const body = request.body

    const errors = []

    if (body.username.length < MIN_USERNAME_LEN || body.username.length > MAX_USERNAME_LEN) {
        errors.push("Username must be between " + MIN_USERNAME_LEN + " and " + MAX_USERNAME_LEN + " characters")
    }

    if (body.password.length < MIN_PASSWORD_LEN || body.password.length > MAX_PASSWORD_LEN) {
        errors.push("Password must be between " + MIN_PASSWORD_LEN + " and " + MAX_PASSWORD_LEN + " characters")
    }

    if (body.password != body.confirmPassword) {
        errors.push("Your passwords do not match")
    }

    if (errors.length > 0) {
        response.status(400).json({errors: errors})
        return
    }

    try {
        const addUserResult = await globalFunctions.addUser(body.username, body.password)

        if(addUserResult.didSucceed){
            response.status(201).end()
        }
        else{
            errors.push(addUserResult.errorMessage)
            response.status(400).json({errors: errors})
        }
    } catch(error) {
        response.status(500).end("Internal Server Error")
    }
    
})

router.get("/groups", async function(request, response){
    
    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {
        
        const userID = request.query.userID

        if ( parseInt(authResult.payload.sub) != parseInt(userID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const query = "SELECT ugc.groupID, ugc.readMessageCount, g.name, g.image, g.ownerID, g.memberCount, g.eventCount, g.messageCount FROM userGroupConnection AS ugc INNER JOIN `group` AS g ON ugc.groupID = g.groupID WHERE userID = ?"
            const groupsArray = await connection.query(query, [userID])

            groupsArray.forEach(group => {
                if (group.ownerID == userID) {
                    group.isOwner = true
                } else {
                    group.isOwner = false
                }
            });
            
            response.status(200).json({groupsArray})
    
        }catch(error){
            console.log(error)
            response.status(500).json({error: "Internal Server Error"})
        }finally{
            if (connection) {
                connection.release()
            }
        }
    } else {
        response.status(401).json({error: "Access unauthorized"})
    }
    
})

router.get("/", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const userID = request.query.userID

        if ( parseInt(authResult.payload.sub) != parseInt(userID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const query = "SELECT * FROM user WHERE userID = ?"
            const usersArray = await connection.query(query, [userID])
            const user = usersArray[0]
            response.status(200).json(user)
            
        }catch(error){
            console.log(error)
            response.status(500).json({error: "Internal Server Error"})

        }finally{
            if (connection) {
                connection.release()
            }
        }

    } else {
        response.status(401).json({error: "Access unauthorized"})
    }

})

router.put("/avatar", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const enteredImage = request.body.imageData
        const userID = request.query.userID

        if ( parseInt(authResult.payload.sub) != parseInt(userID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const query = "UPDATE user SET image = ? WHERE userID = ?"
            await connection.query(query, [enteredImage, userID])
            response.status(200).end()

        }catch(error){
            console.log(error)
            response.status(500).json({error: "Internal Server Error"})

        }finally{
            if (connection) {
                connection.release()
            }
        }

    } else {
        response.status(401).json({error: "Access unauthorized"})
    }
})

router.put("/password", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const body = request.body

        if (body.newPw.length < MIN_PASSWORD_LEN || body.newPw.length > MAX_PASSWORD_LEN) {
            response.status(400).json({error: "Password must be between " + MIN_PASSWORD_LEN + " and " + MAX_PASSWORD_LEN + " characters"})
            return
        }

        if (body.newPw != body.confPw) {
            response.status(400).json({error: "Confirmation does not match"})
            return
        }

        const userID = request.query.userID

        if ( parseInt(authResult.payload.sub) != parseInt(userID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const selectQuery = "SELECT password FROM user WHERE userID = ?"
            const oldPassword = await connection.query(selectQuery, [userID])
            const enteredOldPwHash = await globalFunctions.hashPassword(body.oldPw)

            if (oldPassword[0].password != enteredOldPwHash) {
                response.status(400).json({error: "Old password is incorrect"})
                return
            }

            const enteredNewPwHash = await globalFunctions.hashPassword(body.newPw)
            const updateQuery = "UPDATE user SET password = ? WHERE userID = ?"
            await connection.query(updateQuery, [enteredNewPwHash, userID])

            response.status(200).end()

        }catch(error){
            console.log(error)
            response.status(500).json({error: "Internal Server Error"})

        }finally{
            if (connection) {
                connection.release()
            }
        }

    } else {
        response.status(401).json({error: "Access unauthorized"})
    }
})

router.get("/events", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const userID = request.query.userID

        if ( parseInt(authResult.payload.sub) != parseInt(userID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }
        
        const connection = await pool.getConnection()
        try{
            const query = "SELECT event.eventID, event.groupID, event.title, event.description, event.date, g.name FROM event INNER JOIN `group` AS g ON event.groupID = g.groupID INNER JOIN userGroupConnection ON g.groupID = userGroupConnection.groupID WHERE userGroupConnection.userID = ? ORDER BY event.date ASC"
            const eventsArray = await connection.query(query, [userID])

            response.status(200).json({eventsArray})

        }catch(error){
            console.log(error)
            response.status(500).json({error: "Internal Server Error"})

        }finally{
            if (connection) {
                connection.release()
            }
        }

    } else {
        response.status(401).json({error: "Access unauthorized"})
    }
    
})

router.delete("/", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const userID = request.query.userID
        if ( parseInt(authResult.payload.sub) != parseInt(userID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const query = "DELETE FROM user WHERE userID = ?"
            await connection.query(query, [userID])

            response.status(204).end()

        }catch(error){
            console.log(error)
            response.status(500).json({error: "Internal Server Error"})
        }

    } else {
        response.status(401).json({error: "Access unauthorized"})
    }

})

export {router as userRouter}