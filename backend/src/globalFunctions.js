import {createPool} from 'mariadb'
import bcrypt, { hash } from 'bcrypt'

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

export async function addUser(username, password){
    let didSucceed = false
    const connection = await pool.getConnection()

    try{
        const hashedPassword = await hashPassword(password)
        const query = "INSERT INTO usersTable (username, userPassword) VALUES (?,?)"
        await connection.query(query, [username, hashedPassword])
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
    return result
}

export async function deleteUser(userID){
    const connection = await pool.getConnection()
    const query = "DELETE FROM usersTable WHERE userID = ?"
    await connection.query(query, [userID])
}

export async function deleteEvent(eventID){
    const connection = await pool.getConnection()
    const query = "DELETE FROM eventsTable WHERE eventID = ?"
    await connection.query(query, [eventID])
}

export async function deleteGroup(groupID){
    const connection = await pool.getConnection()
    const query = "DELETE FROM groupsTable WHERE groupID = ?"
    await connection.query(query, [groupID])
}

export async function updateEventData(eventData){
    const connection = await pool.getConnection()
    const query = "UPDATE eventsTable SET eventTitle = ?, eventDesc = ?, eventDate = ? WHERE eventID = ?"
    await connection.query(query, eventData)
}

export async function updateGroupData(groupData){
    const connection = await pool.getConnection()
    const query = "UPDATE groupsTable SET groupName = ?, groupImage = ? WHERE groupID = ?"
    await connection.query(query, groupData)
}

export async function updateUserData(userData){
    bcrypt.hash(userData[1], salt, async function(err, hash){
        console.log("hashPassword: " + hash)
        userData[1] = hash
        try{
            const connection = await pool.getConnection()
            const query = "UPDATE usersTable SET username = ?, userPassword = ?, profilePicture = ?, isActive = ? WHERE userID = ?"
            await connection.query(query, userData)
            return true
        }catch(error){
            console.log(error)
            console.log(err)
            return false
        }
    })
}

export async function compareLoginCredentials(username, password){
    const connection = await pool.getConnection()
    const query = "SELECT userPassword, userID FROM usersTable WHERE username = ?"

    try {

        const hashedObjectFromDatabase = await connection.query(query, [username])

        const hashedPassword = hashedObjectFromDatabase[0].userPassword
        
        connection.release()
        return {
            success: bcrypt.compareSync(password, hashedPassword),
            id: hashedObjectFromDatabase[0].userID
        }

    } catch (error) {
        connection.release()
        return {success: false}
    }

}

export async function getInvitationsFromUserID(userID){
    const connection = await pool.getConnection()
    const query = "SELECT * FROM invitationsTable WHERE userID = ?"
    const invitationsByID = await connection.query(query, [userID])
    return invitationsByID
}

export async function getUsersFromGroupID(groupID){
    const connection = await pool.getConnection()
    const query = `SELECT userGroupConTable.userID, usersTable.username FROM userGroupConTable 
    INNER JOIN usersTable ON userGroupConTable.userID = usersTable.userID 
    WHERE userGroupConTable.groupID = ?;`
    const groupMembersFromGroupID = await connection.query(query, [groupID])
    return groupMembersFromGroupID
}

export async function getGroupIDsFromUserID(userID){
    const connection = await pool.getConnection()
    /*let query = "SELECT * FROM usersTable WHERE userID = ?"
    const userByID = await connection.query(query, [userID])*/
    const query = "SELECT groupID FROM userGroupConTable WHERE userID = ?"
    const userGroupConnections = await connection.query(query, [userID])
    const groupIDs = getParsedIDs(userGroupConnections)
    return groupIDs
}

export async function getEventsFromMultipleGroups(groupIDs){
    const connection = await pool.getConnection()
    const query = "SELECT * FROM eventsTable WHERE groupID in (?)"
    const events = await connection.query(query, [groupIDs])
    return events
}

export async function getEventsFromGroupID(groupID){
    const connection = await pool.getConnection()
    const query = "SELECT * FROM eventsTable WHERE groupID = ?"
    const events = await connection.query(query, [groupID])
    return events
}

export async function getEventFromEventID(eventID){
    const connection = await pool.getConnection()
    const query = "SELECT * FROM eventsTable WHERE eventID = ?"
    const event = await connection.query(query, [eventID])
    return event
}

export async function getOptStatusFromUserEventConnection(userID, eventID){
    const connection = await pool.getConnection()
    const query = "SELECT isOptIn FROM userEventConTable WHERE userID = ? AND eventID = ?"
    const result = await connection.query(query, [userID, eventID])
    return result
}