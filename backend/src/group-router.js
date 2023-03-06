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
        let eventsFromGroupID = await mod.getEventsFromGroupID(groupID)
        response.status(200).json(eventsFromGroupID)
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

router.get("/:groupID/event/:eventID", async function(request, response){
    try{
        const eventID = parseInt(request.params.eventID)
        let eventFromEventID = await mod.getEventFromEventID(eventID)
        response.status(200).json(eventFromEventID)
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

router.get("/:groupID/members", async function(request, response){
    try{
        const groupID = parseInt(request.params.groupID)
        let allMembersIDListFromGroupID = await mod.getUsersFromGroupID(groupID)
        response.status(200).json(allMembersIDListFromGroupID)
    }catch(error){
        console.log(error)
        response.status(500).end("Bad request")
    }
})

router.post("/add", async function(request, response){
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

router.post("/:groupID/event/new", async function(request, response){
    const groupID = parseInt(request.params.groupID)
    /*const enteredEventTitle = request.body.eventTitle
    const enteredEventDesc = request.body.eventDesc
    const enteredEventDate = request.body.eventDate*/
    const enteredEventTitle = "TitleNew"
    const enteredEventDesc = "DescNew"
    const enteredEventDate = "2023-03-06 13:00:00"

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

export {router}