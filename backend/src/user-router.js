import express from 'express'
import {createPool} from 'mariadb'
import * as mod from './globalFunctions.js'

const MIN_USERNAME_LEN = 3
const MAX_USERNAME_LEN = 14
const MIN_PASSWORD_LEN = 8
const MAX_PASSWORD_LEN = 18

const router = express.Router()

router.use(express.json())

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

router.post("/create", async function(request, response){
    const body = request.body

    let errors = []

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
        if(await mod.addUser(body.username, body.password)){
            response.status(201).end()
        }
        else{
            response.status(400).json({errors: ["That username is already taken"]})
        }
    } catch(error) {
        response.status(500).end("Internal Server Error")
    }
    
})

router.get("/groups", async function(request, response){
    
    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {
        
        const connection = await pool.getConnection()
        const userID = request.query.userID

        try{
            
            const query = `SELECT ugT.groupID, ugT.prevMessageCount, gT.groupName, gT.groupImage, gT.ownerID, gT.memberCount, gT.eventCount, gT.messageCount
                           FROM userGroupConTable AS ugT
                           INNER JOIN groupsTable AS gT
                           ON ugT.groupID = gT.groupID 
                           WHERE userID = ?`
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

router.get("/get", async function(request, response){

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const userID = request.query.userID
        const connection = await pool.getConnection()

        try{
            const query = "SELECT * FROM usersTable WHERE userID = ?"
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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const enteredImage = request.body.imageData
        const userID = request.query.userID
        const connection = await pool.getConnection()

        try{
            const query = "UPDATE usersTable SET profileImage = ? WHERE userID = ?"
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

    const authResult = mod.authorizeJWT(request)

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

        const connection = await pool.getConnection()
        const userID = request.query.userID
        
        try{
            let query = "SELECT userPassword FROM usersTable WHERE userID = ?"
            const oldPassword = await connection.query(query, [userID])
            const enteredOldPwHash = await mod.hashPassword(body.oldPw)

            if (oldPassword[0].userPassword != enteredOldPwHash) {
                response.status(400).json({error: "Old password is incorrect"})
                return
            }

            const enteredNewPwHash = await mod.hashPassword(body.newPw)
            query = "UPDATE usersTable SET userPassword = ? WHERE userID = ?"
            await connection.query(query, [enteredNewPwHash, userID])

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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const connection = await pool.getConnection()
        const userID = request.query.userID

        try{
            const query = `SELECT eventsTable.eventID, eventsTable.groupID, eventsTable.eventTitle, eventsTable.eventDesc, eventsTable.eventDate, groupsTable.groupName
                           FROM eventsTable
                           INNER JOIN groupsTable ON eventsTable.groupID = groupsTable.groupID
                           INNER JOIN userGroupConTable ON groupsTable.groupID = userGroupConTable.groupID
                           WHERE userGroupConTable.userID = ?
                           ORDER BY eventsTable.eventDate ASC`
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

export {router}