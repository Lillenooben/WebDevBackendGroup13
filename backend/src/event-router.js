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

router.get("/:eventID", async function(request, response){
    const eventID = parseInt(request.params.eventID)
    try{
        const eventFromEventID = await mod.getEventFromEventID(eventID)
        response.status(200).json(eventFromEventID)
    }catch(error){
        console.log(error)
        response.status(500).end("Internal Server Error")
    }
})

router.put("/:eventID/update", async function(request, response){
    const eventID = parseInt(request.params.eventID)
    const updatedEventTitle = request.body.eventTitle
    const updatedEventDesc = request.body.eventDesc
    const updateEventDate = request.body.eventDate
    const arrayOfEventData = [updatedEventTitle, updatedEventDesc, updateEventDate, eventID]
    try{
        await mod.updateEventData(arrayOfEventData)
        response.status(200).redirect("/")
    }catch(error){
        console.log(error)
        response.status(500).end("Internal Server Error")
    }
})

router.delete("/:eventID/delete", async function(request, response){
    const eventID = parseInt(request.params.eventID)
    try{
        await mod.deleteEvent(eventID)
        response.status(200).redirect("/")
    }catch(error){
        console.log(error)
        response.status(500).end("Internal Server Error")
    }
})

export {router}