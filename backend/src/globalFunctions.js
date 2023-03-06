import {createPool} from 'mariadb'

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

export async function getInvitationsFromUserID(userID){
    const connection = await pool.getConnection()
    let query = "SELECT * FROM invitationsTable WHERE userID = ?"
    const invitationsByID = await connection.query(query, [userID])
    return invitationsByID
}

export async function getUsersFromGroupID(groupID){
    const connection = await pool.getConnection()
    let query = `SELECT userGroupConTable.userID, usersTable.username FROM userGroupConTable 
    INNER JOIN usersTable ON userGroupConTable.userID = usersTable.userID 
    WHERE userGroupConTable.groupID = ?;`
    const groupMembersFromGroupID = await connection.query(query, [groupID])
    return groupMembersFromGroupID
}

export async function getGroupIDsFromUserID(userID){
    const connection = await pool.getConnection()
    /*let query = "SELECT * FROM usersTable WHERE userID = ?"
    const userByID = await connection.query(query, [userID])*/
    let query = "SELECT groupID FROM userGroupConTable WHERE userID = ?"
    const userGroupConnections = await connection.query(query, [userID])
    let groupIDs = getParsedIDs(userGroupConnections)
    return groupIDs
}

export async function getEventsFromMultipleGroups(groupIDs){
    const connection = await pool.getConnection()
    let query = "SELECT * FROM eventsTable WHERE groupID in (?)"
    const events = await connection.query(query, [groupIDs])
    return events
}

export async function getEventsFromGroupID(groupID){
    const connection = await pool.getConnection()
    let query = "SELECT * FROM eventsTable WHERE groupID = ?"
    const events = await connection.query(query, [groupID])
    return events
}

export async function getEventFromEventID(eventID){
    const connection = await pool.getConnection()
    let query = "SELECT * FROM eventsTable WHERE eventID = ?"
    const event = await connection.query(query, [eventID])
    return event
}

export async function getOptStatusFromUserEventConnection(userID, eventID){
    const connection = await pool.getConnection()
    let query = "SELECT isOptIn FROM userEventConTable WHERE userID = ? AND eventID = ?"
    const result = await connection.query(query, [userID, eventID])
    return result
}