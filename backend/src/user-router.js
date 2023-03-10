import express from 'express'
import {createPool} from 'mariadb'
import * as mod from './globalFunctions.js'

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

router.get("/all", async function(request, response){
    try{
        const connection = await pool.getConnection()
        const query = "SELECT * FROM usersTable ORDER BY userID"
        const allUsersFromDatabase = await connection.query(query)
        response.status(200).json(allUsersFromDatabase)
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

router.post("/create", async function(request, response){
    const enteredUsername = request.body.username
    const enteredPlainTextPassword = request.body.password
    if(await mod.addUser(enteredUsername, enteredPlainTextPassword)){
        response.status(200).end()
    }
    else{
        response.status(400).json({error: "Bad request"})
    }
})

router.get("/:userID", async function(request, response){
    const userID = parseInt(request.params.userID)
    try{
        const userFromUserID = await mod.getUserByUserID(userID)
        response.status(200).json(userFromUserID)
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

router.delete("/:userID/delete", async function(request, response){
    const userID = parseInt(request.params.userID)
    try{
        await mod.deleteUser(userID)
        response.status(200).redirect("/")
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
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
        response.status(500).end("Bad request")
    }
    
})

router.get("/:userID/group/all", async function(request, response){
    try{
        const userID = parseInt(request.params.userID)
        const connection = await pool.getConnection()
        const groupIDs = await mod.getGroupIDsFromUserID(userID)
        const query = "SELECT * FROM groupsTable WHERE groupID IN (?)"
        const availableGroups = await connection.query(query, [groupIDs])
        response.status(200).json(availableGroups)

    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})



router.get("/:userID/invitations", async function(request, response){
    try{
        const userID = parseInt(request.params.userID)
        const invitationsFromUserID = await mod.getInvitationsFromUserID(userID)
        response.status(200).json(invitationsFromUserID)
    }catch(error)
    {
        console.log(error)
        response.status(500).end("Bad request")
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
        response.status(500).end("Bad request")
    }
})

export {router}