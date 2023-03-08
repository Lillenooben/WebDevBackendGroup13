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

router.get("/:groupID/event/all", async function(request, response){
    try{
        const groupID = parseInt(request.params.groupID)
        const eventsFromGroupID = await mod.getEventsFromGroupID(groupID)
        response.status(200).json(eventsFromGroupID)
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

router.get("/:groupID/members", async function(request, response){
    try{
        const groupID = parseInt(request.params.groupID)
        const allMembersIDListFromGroupID = await mod.getUsersFromGroupID(groupID)
        response.status(200).json(allMembersIDListFromGroupID)
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

router.post("/create", async function(request, response){
    const enteredGroupName = request.body.groupName
    try{
        const connection = await pool.getConnection()
        const query = "INSERT INTO groupsTable (groupName) VALUES (?)"
        await connection.query(query, [enteredGroupName])
        response.redirect('/')
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

router.get("/:groupID", async function(request, response){
    try{
        const groupID = parseInt(request.params.groupID)
        const connection = await pool.getConnection()
        /*let availableGroups = await mod.getGroupIDsFromUserID(userID)
        if(!availableGroups.includes(groupID)){
            throw "User group connection not found";
        }*/
        //OLD CODE THAT AUTHORIZED USER ACCESS
        const query = "SELECT * FROM groupsTable WHERE groupID = ?"
        const groupFromGroupID = await connection.query(query, [groupID])
        response.status(200).json(groupFromGroupID)

    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

router.post("/:groupID/event/create", async function(request, response){
    const groupID = parseInt(request.params.groupID)
    const enteredEventTitle = request.body.eventTitle
    const enteredEventDesc = request.body.eventDesc
    const enteredEventDate = request.body.eventDate
    /*const enteredEventTitle = "TitleNew"
    const enteredEventDesc = "DescNew"
    const enteredEventDate = "2023-03-06 13:00:00"*/
    //CODE TO ADD DUMMY EVENTS
    try{
        const connection = await pool.getConnection()
        const query = "INSERT INTO eventsTable (groupID, eventTitle, eventDesc, eventDate) VALUES (?,?,?,?)"
        await connection.query(query, [groupID, enteredEventTitle, enteredEventDesc, enteredEventDate])
        response.redirect('/')
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

router.put("/:groupID/update", async function(request, response){
    const groupID = parseInt(request.params.groupID)
    const updatedGroupName = request.body.groupName
    const updatedGroupImage = null //request.body.groupImage??
    const arrayOfGroupData = [updatedGroupName, updatedGroupImage, groupID]
    try{
        await mod.updateGroupData(arrayOfGroupData)
        response.status(200).redirect("/")
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

export {router}