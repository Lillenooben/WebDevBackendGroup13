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

router.put("/:eventID/update", async function(request, response){

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const eventID = parseInt(request.params.eventID)
        const updatedEventTitle = request.body.eventTitle
        const updatedEventDesc = request.body.eventDesc
        const updatedEventDate = request.body.eventDate
        const connection = await pool.getConnection()

        try{
            const query = `UPDATE eventsTable
                           SET eventTitle = ?, eventDesc = ?, eventDate = ?
                           WHERE eventID = ?`
            await connection.query(query, [updatedEventTitle, updatedEventDesc, updatedEventDate, eventID])
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

router.delete("/:eventID/delete", async function(request, response){

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const eventID = parseInt(request.params.eventID)
        const connection = await pool.getConnection()

        try{
            const query = "DELETE FROM eventsTable WHERE eventID = ?"
            await connection.query(query, [eventID])
            response.status(204).end()

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