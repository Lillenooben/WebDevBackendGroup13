import express from 'express'
import {createPool} from 'mariadb'
import * as mod from './globalFunctions.js'

const router = express.Router()

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

router.post("/add", async function(request, response){
    const enteredUsername = request.body.username
    const enteredPassword = request.body.password

    try{
        const connection = await pool.getConnection()
        const query = "INSERT INTO usersTable (username, userPassword) VALUES (?,?)"
        await connection.query(query, [enteredUsername, enteredPassword])
        response.redirect('/')
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

router.get("/:userID", async function(request, response){
    try{
        const userID = parseInt(request.params.userID)
        const connection = await pool.getConnection()
        const query = "SELECT * FROM usersTable WHERE userID = ?"
        const userFromUserID = await connection.query(query, [userID])
        response.status(200).json(userFromUserID)
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})



router.get("/:userID/group/all", async function(request, response){
    try{
        const userID = parseInt(request.params.userID)
        const connection = await pool.getConnection()
        let groupIDs = await mod.getGroupIDsFromUserID(userID)
        let query = "SELECT * FROM groupsTable WHERE groupID IN (?)"
        const availableGroups = await connection.query(query, [groupIDs])
        response.status(200).json(availableGroups)

    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

router.get("/:userID/group/:groupID", async function(request, response){
    try{
        const userID = parseInt(request.params.userID)
        const groupID = parseInt(request.params.groupID)
        const connection = await pool.getConnection()
        let availableGroups = await mod.getGroupIDsFromUserID(userID)
        if(!availableGroups.includes(groupID)){
            throw "User group connection not found";
        }
        let query = "SELECT * FROM groupsTable WHERE groupID = ?"
        const groupFromGroupID = await connection.query(query, [groupID])
        response.status(200).json(groupFromGroupID)

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
        let groupIDs = await mod.getGroupIDsFromUserID(userID)
        let eventsFromGroupIDs = await mod.getEventsFromMultipleGroups(groupIDs)
        response.status(200).json(eventsFromGroupIDs)
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

export {router}