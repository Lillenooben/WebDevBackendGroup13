import express from 'express'
import {pool} from './db-pool.js'
import * as globalFunctions from './globalFunctions.js'

const router = express.Router()

router.use(express.json())

router.get("/:eventID", async function(request, response){

    const authResult = globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const eventID = parseInt(request.params.eventID)
        const connection = await pool.getConnection()

        try{
            const query = "SELECT * FROM event WHERE eventID = ?"
            const event = await connection.query(query, [eventID])
            response.status(200).json({event: event[0]})

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

router.put("/:eventID/update", async function(request, response){

    const authResult = globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const eventID = parseInt(request.params.eventID)
        const updatedEventTitle = request.body.title
        const updatedEventDesc = request.body.description
        const updatedEventDate = request.body.date
        const connection = await pool.getConnection()

        try{
            const query = `UPDATE event
                           SET title = ?, description = ?, date = ?
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

    const authResult = globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const eventID = parseInt(request.params.eventID)
        const connection = await pool.getConnection()

        try{
            const query = "DELETE FROM event WHERE eventID = ?"
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

export {router as eventRouter}