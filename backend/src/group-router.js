import express from 'express'
import {pool} from './db-pool.js'
import * as globalFunctions from './globalFunctions.js'
import {MIN_GROUPNAME_LEN, MAX_GROUPNAME_LEN, MIN_EVENTNAME_LEN, MAX_EVENTNAME_LEN, MAX_EVENTDESC_LEN, MAX_MESSAGE_LEN} from './constants.js'

const router = express.Router()

router.use(express.json())

router.post("/create", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if(authResult.succeeded){

        const enteredImage = request.body.imageData
        const enteredGroupName = request.body.groupName
        const userID = request.query.userID
        
        if ( parseInt(authResult.payload.sub) != parseInt(userID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }
        
        if (enteredGroupName.length < MIN_GROUPNAME_LEN || enteredGroupName.length > MAX_GROUPNAME_LEN) {
            response.status(400).json({error: "Group name must be between " + MIN_GROUPNAME_LEN + " and " + MAX_GROUPNAME_LEN + " characters"})
            return
        } 

        const connection = await pool.getConnection()
        try{
            const insertQuery = "INSERT INTO `group` (ownerID, name, image, memberCount, eventCount, messageCount) VALUES (?, ?, ?, ?, ?, ?)"
            await connection.query(insertQuery, [userID, enteredGroupName, enteredImage, 0, 0, 0])
    
            const selectQuery = "SELECT groupID FROM `group` ORDER BY groupID DESC LIMIT 1"
    
            const latestInsertedGroup = await connection.query(selectQuery)
    
            const groupID = latestInsertedGroup[0].groupID
    
            await globalFunctions.createUserGroupConnection(userID, groupID, true)
            response.status(201).json({newGroupID: groupID})

        }catch(error){
            response.status(500).end({error: "Internal Server Error"})
            
        }finally{
            if (connection) {
                connection.release()
            }
        }
    }else{
        response.status(401).end({error: "Access unauthorized"})
    }
})

router.get("/invites", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const userID = request.query.userID

        const connection = await pool.getConnection()
        try{
            const query = "SELECT invitation.groupID, `group`.name FROM invitation INNER JOIN `group` ON invitation.groupID=`group`.groupID WHERE userID = ?"
            const invites = await connection.query(query, [userID])
            response.status(200).json({invites})

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

router.post("/:groupID/invite", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        
        const groupID = parseInt(request.params.groupID)
        const queryResult = await globalFunctions.getOwnerIDfromGroupID(groupID)

        if ( queryResult.error ) {
            response.status(500).json({error: "Internal Server Error"})
            return
        }

        if ( parseInt(authResult.payload.sub) != parseInt(queryResult.ownerID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const username = request.body.username
            const getIdQuery = "SELECT userID FROM user WHERE name = ?"
            const resultUser = await connection.query(getIdQuery, [username])

            const countQuery = "SELECT COUNT(*) FROM userGroupConnection WHERE userID = ? AND groupID = ?"
            const resultCount = await connection.query(countQuery, [resultUser[0].userID, groupID])
            
            if (Number(resultCount[0]['COUNT(*)']) > 0) {
                response.status(400).json({error: "User is already in the group"})
            } else {
                const insertQuery = "INSERT INTO invitationsTable (userID, groupID) VALUES (?, ?)"
                await connection.query(insertQuery, [resultUser[0].userID, groupID])
    
                response.status(201).end()
            }

        }catch(error){
            if (error.code == "ER_DUP_ENTRY") {
                response.status(400).json({error: "User already invited"})
            } else if (error.code = "ER_SP_FETCH_NO_DATA") {
                response.status(400).json({error: "User not found"})
            } else {
                response.status(500).json({error: "Internal Server Error"})
            }

        }finally{
            if (connection) {
                connection.release()
            }
        }

    } else {
        response.status(401).json({error: "Access unauthorized"})
    }

})

router.post("/:groupID/invite/accept", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const userID = request.query.userID

        if ( parseInt(authResult.payload.sub) != parseInt(userID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            globalFunctions.createUserGroupConnection(userID, request.params.groupID, false)

            const query = "DELETE FROM invitation WHERE userID = ? AND groupID = ?"
            await connection.query(query, [userID, request.params.groupID])

            response.status(201).end()
        
        }catch(error){
            console.log(error)
            response.status(500).json({error: "Internal Server Error"})
        }

    } else {
        response.status(401).json({error: "Access unauthorized"})
    }
})

router.delete("/:groupID/invite", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const userID = request.query.userID

        if ( parseInt(authResult.payload.sub) != parseInt(userID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }
        
        const connection = await pool.getConnection()
        try{
            const groupID = parseInt(request.params.groupID)
            const query = "DELETE FROM invitation WHERE userID = ? AND groupID = ?"
            await connection.query(query, [userID, groupID])
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

router.delete("/:groupID/leave", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const userID = request.query.userID

        if ( parseInt(authResult.payload.sub) != parseInt(userID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const groupID = parseInt(request.params.groupID)
            const query = "DELETE FROM userGroupConnection WHERE userID = ? AND groupID = ?"
            await connection.query(query, [userID, groupID])
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

router.delete("/:groupID/delete", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const userID = request.query.userID

        if ( parseInt(authResult.payload.sub) != parseInt(userID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const groupID = parseInt(request.params.groupID)
            const query = "DELETE FROM `group` WHERE groupID = ? AND ownerID = ?"
            await connection.query(query, [groupID, userID])
            response.status(204).end()

        }catch(error){
            console.log(error)
            if (error.code = "ER_SP_FETCH_NO_DATA") {
                response.status(404).json({error: "Group and owner combination not found"})
                return
            }
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

router.get("/:groupID", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        
        const groupID = parseInt(request.params.groupID)
        const userID = parseInt(request.query.userID)

        if (!globalFunctions.isUserInGroup(parseInt(authResult.payload.sub), groupID)) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const query = "SELECT g.groupID, g.ownerID, g.name, g.image, g.memberCount, g.eventCount, g.messageCount FROM `group` AS g INNER JOIN userGroupConnection ON userGroupConnection.groupID = g.groupID WHERE g.groupID = ? AND userGroupConnection.userID = ?"
            const group = await connection.query(query, [groupID, userID])

            if (group.length == 0) {
                response.status(404).json({error: "Group not found"})
                return
            }

            let isOwner = false
            if (group[0].ownerID == userID) {
                isOwner = true
            }

            response.status(200).json({group:group[0], isOwner: isOwner})

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

router.post("/:groupID/event", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const groupID = parseInt(request.params.groupID)
        const userID = request.query.userID
        const eventTitle = request.body.title
        const eventDesc = request.body.description
        const eventDate = request.body.date
        const currentDate = new Date()

        const queryResult = await globalFunctions.getOwnerIDfromGroupID(groupID)

        if ( queryResult.error ) {
            response.status(500).json({error: "Internal Server Error"})
            return
        }

        if ( parseInt(authResult.payload.sub) != parseInt(queryResult.ownerID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        if (eventTitle.length < MIN_EVENTNAME_LEN || eventTitle.length > MAX_EVENTNAME_LEN) {
            response.status(400).json({error: `Title must be between ${MIN_EVENTNAME_LEN} and ${MAX_EVENTNAME_LEN} characters`})
            return
        } else if (eventDesc.length > MAX_EVENTDESC_LEN) {
            response.status(400).json({error: `Description may not exceed ${MAX_EVENTDESC_LEN} characters`})
            return
            
        } else if (Date.parse(eventDate) <= Date.parse(currentDate.toString().slice(0,21))) {
            response.status(400).json({error: "Event date must be in the future"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const selectQuery = "SELECT * FROM `group` WHERE groupID = ? AND ownerID = ?"
            const result = await connection.query(selectQuery, [groupID, userID])

            if (result.length == 0) {
                response.status(404).json({error: "Group not found"})
                return
            }
            
            const insertQuery = "INSERT INTO event (groupID, title, description, date) VALUES (?,?,?,?)"
            await connection.query(insertQuery, [groupID, eventTitle, eventDesc, eventDate])

            await globalFunctions.createUserEventConnections(groupID)
            
            response.status(201).end()

        }catch(error){
            console.log(error)
            response.status(500).end("Internal Server Error")

        }finally{
            if (connection) {
                connection.release()
            }
        }

    } else {
        response.status(401).json({error: "Access unauthorized"})
    }

    
})

router.put("/:groupID/update", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const groupID = parseInt(request.params.groupID)
        const userID = request.query.userID
        const updatedGroupName = request.body.groupName
        const updatedGroupImage = request.body.imageData

        const queryResult = await globalFunctions.getOwnerIDfromGroupID(groupID)

        if ( queryResult.error ) {
            response.status(500).json({error: "Internal Server Error"})
            return
        }

        if ( parseInt(authResult.payload.sub) != parseInt(queryResult.ownerID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }
        
        const connection = await pool.getConnection()
        try{
            const query = "UPDATE `group` SET name = ?, image = ? WHERE groupID = ? AND ownerID = ?"
            await connection.query(query, [updatedGroupName, updatedGroupImage, groupID, userID])
            response.status(200).end()

        }catch(error){
            console.log(error)
            response.status(500).end({error: "Internal Server Error"})

        }finally{
            if (connection) {
                connection.release()
            }
        }

    } else {
        response.status(401).json({error: "Access unauthorized"})
    }
})

router.get("/:groupID/events", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const groupID = parseInt(request.params.groupID)

        if (!globalFunctions.isUserInGroup(parseInt(authResult.payload.sub), groupID)) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const query = "SELECT * FROM event WHERE groupID = ? ORDER BY date ASC"
            const eventsArray = await connection.query(query, [groupID])
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

router.get("/:groupID/members", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const groupID = parseInt(request.params.groupID)

        if (!globalFunctions.isUserInGroup(parseInt(authResult.payload.sub), groupID)) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const query = `SELECT userGroupConnection.userID, user.name, user.image 
                           FROM userGroupConnection 
                           INNER JOIN user ON userGroupConnection.userID = user.userID 
                           WHERE userGroupConnection.groupID = ?`
            const membersArray = await connection.query(query, [groupID])
            response.status(200).json({membersArray})

        }catch(error){
            console.log(error)
            response.status(500).end({error: "Internal Server Error"})
            
        }finally{
            if (connection) {
                connection.release()
            }
        }

    } else {
        response.status(401).json({error: "Access unauthorized"})
    }
    
})

router.get("/:groupID/chat", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const groupID = request.params.groupID

        if (!globalFunctions.isUserInGroup(parseInt(authResult.payload.sub), groupID)) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const connection = await pool.getConnection()
        try{
            const selectQuery = `SELECT message.body, message.userID, user.name
                                FROM message
                                INNER JOIN user ON message.userID = user.userID
                                WHERE groupID = ?
                                ORDER BY message.messageID DESC`
            const messages = await connection.query(selectQuery, [groupID])

            const updateQuery = "UPDATE userGroupConnection SET readMessageCount = ? WHERE userID = ? AND groupID = ?"
            await connection.query(updateQuery, [messages.length, request.query.userID, groupID])

            response.status(200).json({messages})

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

router.post("/:groupID/chat", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        const chatMessage = request.body.message
        const groupID = request.params.groupID
        const userID = request.query.userID
        
        if (!globalFunctions.isUserInGroup(parseInt(authResult.payload.sub), groupID)) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        if (chatMessage.length > MAX_MESSAGE_LEN) {
            response.status(400).json({error: `Message may not exceed ${MAX_MESSAGE_LEN} characters`})
            return
        }

        const connection = await pool.getConnection()
        try{
            const query = "INSERT INTO message (userID, groupID, body) VALUES (?,?,?)"
            await connection.query(query, [userID, groupID, chatMessage])
            response.status(201).end()

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

router.delete("/:groupID/member", async function(request, response){

    const authResult = await globalFunctions.authorizeJWT(request)

    if (authResult.succeeded) {

        
        const groupID = parseInt(request.params.groupID)

        const queryResult = await globalFunctions.getOwnerIDfromGroupID(groupID)

        if ( queryResult.error ) {
            response.status(500).json({error: "Internal Server Error"})
            return
        }

        if ( parseInt(authResult.payload.sub) != parseInt(queryResult.ownerID) ) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }

        const deleteUserID = request.query.deleteUserID
        const requestUserID = request.query.requestUserID

        if (deleteUserID == requestUserID) {
            response.status(400).json({error: "Cannot uninvite yourself from group."})
        }

        const connection = await pool.getConnection()
        try{
            const selectQuery = "SELECT * FROM `group` WHERE groupID = ? AND ownerID = ?"
            const result = await connection.query(selectQuery, [groupID, requestUserID])

            if (result.length > 0) {
                const deleteQuery = "DELETE FROM userGroupConnection WHERE groupID = ? AND userID = ?"
                await connection.query(deleteQuery, [groupID, deleteUserID])
                response.status(204).end()

            } else {
                response.status(401).json({error: "Unauthorized operation"})
            }

        }catch(error){
            console.log(error)
            if (error == "ER_SP_FETCH_NO_DATA") {
                response.status(401).json({error: "Unauthorized operation"})
            } else {
                response.status(500).json({error: "Internal Server Error"})
            }

        }finally{
            if (connection) {
                connection.release()
            }
        }

    } else {
        response.status(401).json({error: "Access unauthorized"})
    }
})

export {router as groupRouter}