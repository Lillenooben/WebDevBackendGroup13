import express from 'express'
import {createPool} from 'mariadb'
import * as mod from './globalFunctions.js'

const MIN_USERNAME_LEN = 3
const MAX_USERNAME_LEN = 14
const MIN_PASSWORD_LEN = 8
const MAX_PASSWORD_LEN = 14

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

router.get("/getAll", async function(request, response){
    const connection = await pool.getConnection()
    try{
        const query = "SELECT * FROM usersTable ORDER BY userID"
        const allUsersFromDatabase = await connection.query(query)
        connection.release()
        response.status(200).json(allUsersFromDatabase)
    }catch(error){
        connection.release()
        console.log(error)
        response.status(500).end("Internal Server Error")
    }
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
        try{
            
            const query = `SELECT userGroupConTable.groupID, groupsTable.groupName 
                           FROM userGroupConTable 
                           INNER JOIN groupsTable 
                           ON userGroupConTable.groupID=groupsTable.groupID 
                           WHERE userID = ?`
            const groups = await connection.query(query, [authResult.payload.sub])
            response.status(200).json({groups})
    
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

router.get("/:userID", async function(request, response){
    const userID = parseInt(request.params.userID)
    try{
        const userFromUserID = await mod.getUserByUserID(userID)
        response.status(200).json(userFromUserID)
    }catch(error){
        console.log(error)
        response.status(500).end("Internal Server Error")
    }
})

router.delete("/:userID/delete", async function(request, response){
    const userID = parseInt(request.params.userID)
    try{
        await mod.deleteUser(userID)
        response.status(200).redirect("/")
    }catch(error){
        console.log(error)
        response.status(500).end("Internal Server Error")
    }
})

router.put("/:userID/update", async function(request, response){
    const userID = parseInt(request.params.userID)
    const updatedUsername = request.body.username
    const updatedUserPassword = request.body.password
    const updatedProfilePicture = null //request.body.groupImage??
    const updatedIsActive = request.body.isActive
    const arrayOfUserData = [updatedUsername, updatedUserPassword, updatedProfilePicture, updatedIsActive, userID]
    if(mod.updateUserData(arrayOfUserData)){
        response.status(200).redirect("/")
    }
    else{
        console.log(error)
        response.status(500).end("Internal Server Error")
    }
    
})

router.get("/:userID/invitations", async function(request, response){
    try{
        const userID = parseInt(request.params.userID)
        const invitationsFromUserID = await mod.getInvitationsFromUserID(userID)
        response.status(200).json(invitationsFromUserID)
    }catch(error){
        console.log(error)
        response.status(500).end("Internal Server Error")
    }
})

router.get("/:userID/events", async function(request, response){
    try{
        const userID = parseInt(request.params.userID)
        const groupIDs = await mod.getGroupIDsFromUserID(userID)
        const eventsFromGroupIDs = await mod.getEventsFromMultipleGroups(groupIDs)
        response.status(200).json(eventsFromGroupIDs)
    }catch(error){
        console.log(error)
        response.status(500).end("Internal Server Error")
    }
})

export {router}