import {createPool} from 'mariadb'
import bcrypt, { hash } from 'bcrypt'

const saltRounds = 10

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
    bcrypt.hash(password, saltRounds, async function(err, hash){
        console.log("hashPassword: " + hash)
        return hash
    })
}

export async function addUser(username, password){
    bcrypt.hash(password, saltRounds, async function(err, hash){
        console.log("hashPassword: " + hash)
        try{
            const connection = await pool.getConnection()
            let query = "INSERT INTO usersTable (username, userPassword) VALUES (?,?)"
            await connection.query(query, [username, hash])
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
    let query = "SELECT userPassword FROM usersTable WHERE username = ?"
    const hashedObjectFromDatabase = await connection.query(query, [username])

    const hashedPassword = hashedObjectFromDatabase[0].userPassword

    return bcrypt.compareSync(password, hashedPassword)

    /*await bcrypt.compare(password, hashedPassword).then(function(result){
        console.log(result)
        return result
    })*/
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