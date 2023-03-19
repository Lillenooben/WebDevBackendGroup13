import express from 'express'
import {createPool} from 'mariadb'
import * as mod from './globalFunctions.js'

const MIN_GROUPNAME_LEN = 3
const MAX_GROUPNAME_LEN = 20

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

    if(authResult.succeeded){

        const enteredImage = request.body.imageData
        const enteredGroupName = request.body.groupName
        
        if (enteredGroupName.length < MIN_GROUPNAME_LEN || enteredGroupName.length > MAX_GROUPNAME_LEN) {
            response.status(400).json({error: "Group name must be between " + MIN_GROUPNAME_LEN + " and " + MAX_GROUPNAME_LEN + " characters"})
            return
        } 

        const connection = await pool.getConnection()
        try{
            let query = "INSERT INTO groupsTable (ownerID, groupName, groupImage) VALUES (?, ?, ?)"
            await connection.query(query, [authResult.payload.sub, enteredGroupName, enteredImage])
    
            query = "SELECT groupID FROM groupsTable ORDER BY groupID DESC LIMIT 1"
    
            const latestInsertedGroup = await connection.query(query)
    
            const groupID = latestInsertedGroup[0].groupID
    
            await mod.createUserGroupConnection(authResult.payload.sub, groupID, authResult.payload.username, true)
            response.status(201).json({newGroupID: groupID})

        }catch(error){
            response.status(500).end({error: "Internal Server Error"})
            
        }finally{
            if (connection) {
                connection.release()
            }
        }
    }else{
        console.log(authResult.error)
        response.status(401).end({error: "Unauthorized"})
    }
})

router.get("/invites", async function(request, response){

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const connection = await pool.getConnection()

        try{
            const query = `SELECT invitationsTable.groupID, groupsTable.groupName 
                           FROM invitationsTable 
                           INNER JOIN groupsTable 
                           ON invitationsTable.groupID=groupsTable.groupID 
                           WHERE userID = ?`
            const invites = await connection.query(query, authResult.payload.sub)
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

// TODO: Make sure the person sending the request is the owner of the group
//       Also make sure you cannot invite users who are already members
router.post("/:groupID/invite", async function(request, response){

    const authResult = mod.authorizeJWT(request)

    if (authResult.succeeded) {

        const connection = await pool.getConnection()

        try{
            const username = request.body.username
            let query = "SELECT userID FROM usersTable WHERE username = ?"
            const result = await connection.query(query, username)

            const groupID = parseInt(request.params.groupID)
            query = "INSERT INTO invitationsTable (userID, groupID) VALUES (?, ?)"
            await connection.query(query, [result[0].userID, groupID])

            response.status(201).end()

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

        try{
            mod.createUserGroupConnection(authResult.payload.sub, request.params.groupID, authResult.payload.username, false)
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

        try{
            const groupID = parseInt(request.params.groupID)
            const query = "DELETE FROM invitationsTable WHERE userID = ? AND groupID = ?"
            await connection.query(query, [authResult.payload.sub, groupID])
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

        try{
            const groupID = parseInt(request.params.groupID)
            const query = "DELETE FROM userGroupConTable WHERE userID = ? AND groupID = ?"
            await connection.query(query, [authResult.payload.sub, groupID])
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

        try{
            const groupID = parseInt(request.params.groupID)
            const query = "DELETE FROM groupsTable WHERE groupID = ? AND ownerID = ?"
            await connection.query(query, [groupID, authResult.payload.sub])
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

        try{
            const query = "SELECT * FROM groupsTable WHERE groupID = ?"
            const group = await connection.query(query, [groupID])

            if (group.length == 0) {
                throw "ER_SP_FETCH_NO_DATA"
            }

            let isOwner = false
            if (group[0].ownerID == authResult.payload.sub) {
                isOwner = true
            }

            response.status(200).json({group:group[0], isOwner: isOwner})

        }catch(error){
            console.log(error)
            if (error == "ER_SP_FETCH_NO_DATA") {
                response.status(404).json({error: "Group not found"})
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

router.post("/:groupID/event/create", async function(request, response){
    const groupID = parseInt(request.params.groupID)
    /*const enteredEventTitle = request.body.eventTitle
    const enteredEventDesc = request.body.eventDesc
    const enteredEventDate = request.body.eventDate*/
    const enteredEventTitle = "TitleNew"
    const enteredEventDesc = "DescNew"
    const enteredEventDate = "2023-03-06 13:00:00"
    //CODE TO ADD DUMMY EVENTS SWAP WITH THE COMMENTED CODE AS NEEDED
    const connection = await pool.getConnection()
    try{
        
        const query = "INSERT INTO eventsTable (groupID, eventTitle, eventDesc, eventDate) VALUES (?,?,?,?)"
        await connection.query(query, [groupID, enteredEventTitle, enteredEventDesc, enteredEventDate])

        await mod.createUserEventConnection(groupID)
        
        connection.release()
        response.status(201).end()
    }catch(error){
        connection.release()
        console.log(error)
        response.status(500).end("Internal Server Error")
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
        response.status(500).end("Internal Server Error")
    }
})

router.get("/:groupID/event/all", async function(request, response){
    try{
        const groupID = parseInt(request.params.groupID)
        const eventsFromGroupID = await mod.getEventsFromGroupID(groupID)
        response.status(200).json(eventsFromGroupID)
    }catch(error){
        console.log(error)
        response.status(500).end("Internal Server Error")
    }
})

router.get("/:groupID/members", async function(request, response){
    try{
        const groupID = parseInt(request.params.groupID)
        const allMembersIDListFromGroupID = await mod.getUsersFromGroupID(groupID)
        response.status(200).json(allMembersIDListFromGroupID)
    }catch(error){
        console.log(error)
        response.status(500).end("Internal Server Error")
    }
})

export {router}