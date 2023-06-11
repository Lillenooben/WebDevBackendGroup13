import express from 'express'
import {createPool} from 'mariadb'
import * as mod from './globalFunctions.js'

const MIN_GROUPNAME_LEN = 3
const MAX_GROUPNAME_LEN = 20
const MIN_EVENTNAME_LEN = 3
const MAX_EVENTNAME_LEN = 20
const MAX_EVENTDESC_LEN = 150
const MAX_MESSAGE_LEN = 150

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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const enteredImage = request.body.imageData
        const enteredGroupName = request.body.groupName
        const userID = request.query.userID
        
        if (parseInt(authResult.payload.sub) != parseInt(userID)) {
            response.status(401).json({error: "Access unauthorized"})
            return
        }
        
        if (enteredGroupName.length < MIN_GROUPNAME_LEN || enteredGroupName.length > MAX_GROUPNAME_LEN) {
            response.status(400).json({error: "Group name must be between " + MIN_GROUPNAME_LEN + " and " + MAX_GROUPNAME_LEN + " characters"})
            return
        } 

        const connection = await pool.getConnection()
        try{
            let query = "INSERT INTO groupsTable (ownerID, groupName, groupImage, memberCount, eventCount, messageCount) VALUES (?, ?, ?, ?, ?, ?)"
            await connection.query(query, [userID, enteredGroupName, enteredImage, 0, 0, 0])
    
            query = "SELECT groupID FROM groupsTable ORDER BY groupID DESC LIMIT 1"
    
            const latestInsertedGroup = await connection.query(query)
    
            const groupID = latestInsertedGroup[0].groupID
    
            await mod.createUserGroupConnection(userID, groupID, true)
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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const connection = await pool.getConnection()
        const userID = request.query.userID

        try{
            const query = `SELECT invitationsTable.groupID, groupsTable.groupName 
                           FROM invitationsTable 
                           INNER JOIN groupsTable 
                           ON invitationsTable.groupID=groupsTable.groupID 
                           WHERE userID = ?`
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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const connection = await pool.getConnection()
        const groupID = parseInt(request.params.groupID)

        try{
            const username = request.body.username
            let query = "SELECT userID FROM usersTable WHERE username = ?"
            const resultUser = await connection.query(query, [username])

            query = "SELECT COUNT(*) FROM userGroupConTable WHERE userID = ? AND groupID = ?"
            const resultCount = await connection.query(query, [resultUser[0].userID, groupID])
            
            if (Number(resultCount[0]['COUNT(*)']) > 0) {
                response.status(400).json({error: "User is already in the group"})
            } else {
                query = "INSERT INTO invitationsTable (userID, groupID) VALUES (?, ?)"
                await connection.query(query, [resultUser[0].userID, groupID])
    
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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const userID = request.query.userID
        const connection = await pool.getConnection()

        try{
            mod.createUserGroupConnection(userID, request.params.groupID, false)

            const query = "DELETE FROM invitationsTable WHERE userID = ? AND groupID = ?"
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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const connection = await pool.getConnection()
        const userID = request.query.userID

        try{
            const groupID = parseInt(request.params.groupID)
            const query = "DELETE FROM invitationsTable WHERE userID = ? AND groupID = ?"
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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const connection = await pool.getConnection()
        const userID = request.query.userID

        try{
            const groupID = parseInt(request.params.groupID)
            const query = "DELETE FROM userGroupConTable WHERE userID = ? AND groupID = ?"
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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const connection = await pool.getConnection()
        const userID = request.query.userID

        try{
            const groupID = parseInt(request.params.groupID)
            const query = "DELETE FROM groupsTable WHERE groupID = ? AND ownerID = ?"
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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const connection = await pool.getConnection()
        const groupID = parseInt(request.params.groupID)
        const userID = parseInt(request.query.userID)

        try{
            const query = `SELECT gT.groupID, gT.ownerID, gT.groupName, gT.groupImage, gT.memberCount, gT.eventCount, gT.messageCount
                           FROM groupsTable AS gT
                           INNER JOIN userGroupConTable ON userGroupConTable.groupID = gT.groupID
                           WHERE gT.groupID = ? AND userGroupConTable.userID = ?`
            const group = await connection.query(query, [groupID, userID])

            if (group.length == 0) {
                throw "ER_SP_FETCH_NO_DATA"
            }

            let isOwner = false
            if (group[0].ownerID == userID) {
                isOwner = true
            }

            response.status(200).json({group:group[0], isOwner: isOwner})

        }catch(error){
            console.log(error)
            if (error == "ER_SP_FETCH_NO_DATA") {
                response.status(404).json({error: "Group not found"})
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

router.post("/:groupID/event", async function(request, response){

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const groupID = parseInt(request.params.groupID)
        const userID = request.query.userID
        const eventTitle = request.body.title
        const eventDesc = request.body.description
        const eventDate = request.body.date
        const currentDate = new Date()

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
            let query = "SELECT groupName FROM groupsTable WHERE groupID = ? AND ownerID = ?"
            const result = await connection.query(query, [groupID, userID])

            if (result.length == 0) {
                throw "ER_SP_FETCH_NO_DATA"
            }
            
            query = "INSERT INTO eventsTable (groupID, eventTitle, eventDesc, eventDate) VALUES (?,?,?,?)"
            await connection.query(query, [groupID, eventTitle, eventDesc, eventDate])

            await mod.createUserEventConnections(groupID)
            
            response.status(201).end()

        }catch(error){
            console.log(error)
            if (error == "ER_SP_FETCH_NO_DATA") {
                response.status(404).json({error: "Group not found"})
            } else {
                response.status(500).end("Internal Server Error")
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

router.put("/:groupID/update", async function(request, response){

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const groupID = parseInt(request.params.groupID)
        const userID = request.query.userID
        const updatedGroupName = request.body.groupName
        const updatedGroupImage = request.body.imageData
        
        const connection = await pool.getConnection()

        try{
            const query = `UPDATE groupsTable
                           SET groupName = ?, groupImage = ?
                           WHERE groupID = ? AND ownerID = ?`
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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const groupID = parseInt(request.params.groupID)
        const connection = await pool.getConnection()

        try{
            const query = "SELECT * FROM eventsTable WHERE groupID = ? ORDER BY eventDate ASC"
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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const connection = await pool.getConnection()
        const groupID = parseInt(request.params.groupID)

        try{
            const query = `SELECT userGroupConTable.userID, usersTable.username, usersTable.profileImage 
                           FROM userGroupConTable 
                           INNER JOIN usersTable ON userGroupConTable.userID = usersTable.userID 
                           WHERE userGroupConTable.groupID = ?`
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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const connection = await pool.getConnection()
        const groupID = request.params.groupID
        
        try{
            let query = `SELECT messagesTable.message, messagesTable.userID, usersTable.username
                         FROM messagesTable
                         INNER JOIN usersTable ON messagesTable.userID = usersTable.userID
                         WHERE groupID = ?
                         ORDER BY messagesTable.messageID DESC`
            const messages = await connection.query(query, [groupID])

            query = "UPDATE userGroupConTable SET prevMessageCount = ? WHERE userID = ? AND groupID = ?"
            await connection.query(query, [messages.length, request.query.userID, groupID])

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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const chatMessage = request.body.message
        const userID = request.query.userID

        if (chatMessage.length > MAX_MESSAGE_LEN) {
            response.status(400).json({error: `Message may not exceed ${MAX_MESSAGE_LEN} characters`})
            return
        }

        const connection = await pool.getConnection()
        
        try{
            const query = "INSERT INTO messagesTable (userID, groupID, message) VALUES (?,?,?)"
            await connection.query(query, [userID, request.params.groupID, chatMessage])
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

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const connection = await pool.getConnection()
        const groupID = request.params.groupID
        const deleteUserID = request.query.deleteUserID
        const requestUserID = request.query.requestUserID

        if (deleteUserID == requestUserID) {
            response.status(400).json({error: "Cannot uninvite yourself from group."})
        }

        try{
            let query = "SELECT * FROM groupsTable WHERE groupID = ? AND ownerID = ?"
            const result = await connection.query(query, [groupID, requestUserID])

            if (result.length > 0) {
                query = "DELETE FROM userGroupConTable WHERE groupID = ? AND userID = ?"
                await connection.query(query, [groupID, deleteUserID])
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

export {router}