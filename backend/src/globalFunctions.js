import {createPool} from 'mariadb'
import bcrypt, { hash } from 'bcrypt'
import {ACCESS_TOKEN_SECRET} from './app.js'
import jwt from 'jsonwebtoken'

const salt = "$2b$10$JuPOH8SVXG6GG7BDU92clu"

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

export function getParsedIDs(objectArray){
    let IDs = []
    objectArray.forEach(element => {
        IDs.push(Object.values(element)[0])
    });
    return IDs
}

export async function hashPassword(password){
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            reject(err);
          } else {
            resolve(hash);
          }
        });
    });
}

export function authorizeJWT(request){
    let result = {}

    try{
        const authorizationHeaderValue = request.get("Authorization")
        const accessToken = authorizationHeaderValue.substring(7)

        jwt.verify(accessToken, ACCESS_TOKEN_SECRET, function(error, payload){
            if(error){
                result = {
                    succeeded: false,
                    error: error
                }
            }else{
                result = {
                    succeeded: true,
                    payload: payload,
                }
                
            }
        })

    }catch(error){
        result = {
            succeeded: false,
            error: error
        }
    }finally{
        return result
    }
}

export async function addUser(username, password){
    let didSucceed = false
    const connection = await pool.getConnection()

    try{
        const hashedPassword = await hashPassword(password)
        const query = "INSERT INTO usersTable (username, userPassword, profileImage, isActive) VALUES (?,?,?,?)"
        await connection.query(query, [username, hashedPassword, "", true])
        didSucceed = true
    }catch(error){
        console.log(error)
    } finally {
        if (connection) {
            connection.release()
        }
        return didSucceed
    }
}

export async function getUserByUserID(userID){
    const connection = await pool.getConnection()
    const query = "SELECT * FROM usersTable WHERE userID = ?"
    const result = await connection.query(query, [userID])
    connection.release()
    return result
}

export async function deleteUser(userID){
    const connection = await pool.getConnection()
    const query = "DELETE FROM usersTable WHERE userID = ?"
    await connection.query(query, [userID])
    connection.release()
}

export async function deleteEvent(eventID){
    const connection = await pool.getConnection()
    const query = "DELETE FROM eventsTable WHERE eventID = ?"
    await connection.query(query, [eventID])
    connection.release()
}

export async function deleteGroup(groupID){
    const connection = await pool.getConnection()
    const query = "DELETE FROM groupsTable WHERE groupID = ?"
    await connection.query(query, [groupID])
    connection.release()
}

export async function updateEventData(eventData){
    const connection = await pool.getConnection()
    const query = "UPDATE eventsTable SET eventTitle = ?, eventDesc = ?, eventDate = ? WHERE eventID = ?"
    await connection.query(query, eventData)
    connection.release()
}

export async function updateGroupData(groupData){
    const connection = await pool.getConnection()
    const query = "UPDATE groupsTable SET groupName = ?, groupImage = ? WHERE groupID = ?"
    await connection.query(query, groupData)
    connection.release()
}

export async function updateUserData(userData){
    bcrypt.hash(userData[1], salt, async function(err, hash){
        userData[1] = hash
        try{
            const connection = await pool.getConnection()
            const query = "UPDATE usersTable SET username = ?, userPassword = ?, profilePicture = ?, isActive = ? WHERE userID = ?"
            await connection.query(query, userData)
            connection.release()
            return true
        }catch(error){
            connection.release()
            console.log(error)
            console.log(err)
            return false
        }
    })
}

export async function createUserEventConnection(groupID){
    const connection = await pool.getConnection()
    try{
        let query = "SELECT userID FROM userGroupConTable WHERE groupID = ?"
        const usersInGroup = await connection.query(query, [groupID])
        const userIDsArray = getParsedIDs(usersInGroup)

        query = "SELECT eventID FROM eventsTable WHERE groupID = ? ORDER BY eventID DESC"
        const eventIDsFromGroupID = await connection.query(query, [groupID])
        const eventIDFromLatestEvent = eventIDsFromGroupID[0].eventID

        query = "INSERT INTO userEventConTable (userID, eventID, isOptIn) VALUES (?,?,?)"
        for (let userID of userIDsArray){
            await connection.query(query, [userID, eventIDFromLatestEvent, true])
        }
        connection.release()
    }catch(error){
        connection.release()
        console.log(error)
    }
}

export async function createUserGroupConnection(userID, groupID, isOwner){
    const connection = await pool.getConnection()
    try{
        const query = "INSERT INTO userGroupConTable (userID, groupID, isOwner, notifEnabled) VALUES (?,?,?,?)"
        await connection.query(query, [userID, groupID, isOwner, true])
    }catch(error){
        console.log(error)
    }finally{
        if (connection) {
            connection.release()
        }
    }
}

export async function compareLoginCredentials(username, password){
    const connection = await pool.getConnection()
    const query = "SELECT * FROM usersTable WHERE username = ?"

    try {

        const user = await connection.query(query, [username])

        const hashedPassword = user[0].userPassword
        
        return {
            success: bcrypt.compareSync(password, hashedPassword),
            user: user[0]
        }

    }catch(error){
        return {success: false}
    }finally{
        if (connection) {
            connection.release()
        }
    }

}

export async function getInvitationsFromUserID(userID){
    const connection = await pool.getConnection()
    const query = "SELECT * FROM invitationsTable WHERE userID = ?"
    const invitationsByID = await connection.query(query, [userID])
    connection.release()
    return invitationsByID
}

export async function inivtationResponse(groupID, userResponse){

    const jwtPayload = authorizeJWT(request)

    if(jwtPayload.succeeded){
        const connection = await pool.getConnection()
        try{
            if(userResponse){
                await createUserGroupConnection(jwtPayload.payload.sub, groupID, false)
            }
            const query = "DELETE FROM invitationsTable WHERE userID = ? AND groupID = ?"
            await connection.query(query, [jwtPayload.payload.sub, groupID])
            connection.release()
            response.status(201).end()
        }catch(error){
            connection.release()
            console.log(error)
            response.status(500).end("Internal Server Error")
        }
    }else{
        console.log(jwtPayload.error)
        response.status(401).end()
    }
}

export async function createInvitation(userID, groupID){
    const connection = await pool.getConnection()
    const query = "INSERT INTO invitationsTable (userID, groupID) VALUES (?,?)"
    await connection.query(query, [userID, groupID])
    connection.release()
}

export async function getUsersFromGroupID(groupID){
    const connection = await pool.getConnection()
    const query = `SELECT userGroupConTable.userID, usersTable.username FROM userGroupConTable 
    INNER JOIN usersTable ON userGroupConTable.userID = usersTable.userID 
    WHERE userGroupConTable.groupID = ?;`
    const groupMembersFromGroupID = await connection.query(query, [groupID])
    connection.release()
    return groupMembersFromGroupID
}

export async function getGroupIDsFromUserID(userID){
    const connection = await pool.getConnection()
    /*let query = "SELECT * FROM usersTable WHERE userID = ?"
    const userByID = await connection.query(query, [userID])*/
    const query = "SELECT groupID FROM userGroupConTable WHERE userID = ?"
    const userGroupConnections = await connection.query(query, [userID])
    const groupIDs = getParsedIDs(userGroupConnections)
    connection.release()
    return groupIDs
}

export async function getEventsFromMultipleGroups(groupIDs){
    const connection = await pool.getConnection()
    const query = "SELECT * FROM eventsTable WHERE groupID in (?) ORDER BY eventDate ASC"
    const events = await connection.query(query, [groupIDs])
    connection.release()
    return events
}

export async function getEventsFromGroupID(groupID){
    const connection = await pool.getConnection()
    const query = "SELECT * FROM eventsTable WHERE groupID = ?"
    const events = await connection.query(query, [groupID])
    connection.release()
    return events
}

export async function getEventFromEventID(eventID){
    const connection = await pool.getConnection()
    const query = "SELECT * FROM eventsTable WHERE eventID = ?"
    const event = await connection.query(query, [eventID])
    connection.release()
    return event
}

export async function getOptStatusFromUserEventConnection(userID, eventID){
    const connection = await pool.getConnection()
    const query = "SELECT isOptIn FROM userEventConTable WHERE userID = ? AND eventID = ?"
    const result = await connection.query(query, [userID, eventID])
    connection.release()
    return result
}