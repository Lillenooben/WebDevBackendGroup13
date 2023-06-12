import {pool} from './db-pool.js'
import bcrypt from 'bcrypt'
import {ACCESS_TOKEN_SECRET, SALT} from './constants.js'
import jwt from 'jsonwebtoken'

export async function hashPassword(password){
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, SALT, (err, hash) => {
          if (err) {
            reject(err);
          } else {
            resolve(hash);
          }
        });
    });
}

export function authorizeJWT(request) {
    return new Promise((resolve, reject) => {
        try {
            const authorizationHeaderValue = request.get("Authorization")
            const accessToken = authorizationHeaderValue.substring(7)
  
            jwt.verify(accessToken, ACCESS_TOKEN_SECRET, function (error, payload) {
                if (error) {
                    reject({
                        succeeded: false,
                        error: error,
                    })
                } else {
                    resolve({
                        succeeded: true,
                        payload: payload,
                    })
                }
            })
        } catch (error) {
            reject({
                succeeded: false,
                error: error,
            })
        }
    })
}

export async function addUser(username, password){
    let didSucceed = false
    let errorMessage = ""
    const connection = await pool.getConnection()

    try{
        const hashedPassword = await hashPassword(password)
        const query = "INSERT INTO user (name, password, image) VALUES (?,?,?)"
        await connection.query(query, [username, hashedPassword, ""])
        didSucceed = true
    } catch(error) {
        console.log(error)
        if (error.code == "ER_DUP_ENTRY") {
            errorMessage = "Username already taken"
        } else {
            errorMessage = "Internal Server Error"
        }
    } finally {
        if (connection) {
            connection.release()
        }
        return {didSucceed: didSucceed, errorMessage: errorMessage}
    }
}

export async function createUserEventConnections(groupID){

    const connection = await pool.getConnection()
    try{
        const selectUsersQuery = "SELECT userID FROM userGroupConnection WHERE groupID = ?"
        const usersInGroup = await connection.query(selectUsersQuery, [groupID])

        const selectEventsQuery = "SELECT eventID FROM event WHERE groupID = ? ORDER BY eventID DESC"
        const eventIDsFromGroupID = await connection.query(selectEventsQuery, [groupID])
        const eventIDFromLatestEvent = eventIDsFromGroupID[0].eventID

        const insertQuery = "INSERT INTO userEventConnection (userID, eventID) VALUES (?,?)"
        for (let user of usersInGroup){
            await connection.query(insertQuery, [user.userID, eventIDFromLatestEvent])
        }

    }catch(error){
        console.log(error)
        
    }finally{
        if (connection) {
            connection.release()
        }
    }
}

export async function createUserGroupConnection(userID, groupID, isOwner){
    const connection = await pool.getConnection()
    try{
        const query = "INSERT INTO userGroupConnection (userID, groupID, isOwner, readMessageCount) VALUES (?,?,?,?)"
        await connection.query(query, [userID, groupID, isOwner, 0])
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
    try {
        
        const query = "SELECT * FROM user WHERE name = ?"
        const users = await connection.query(query, [username])

        const hashedPassword = users[0].password
        return {
            didSucceed: await bcrypt.compare(password, hashedPassword),
            user: users[0]
        }

    } catch(error) {
        console.log(error)
        return {didSucceed: false}
    }finally{
        connection.release()
    }

}

export async function getOwnerIDfromGroupID(groupID) {
    const connection = await pool.getConnection()
    try {
        const query = "SELECT ownerID FROM `group` WHERE groupID = ?"
        const resultedRow = await connection.query(query, [groupID])
        
        return {
            ownerID: resultedRow[0].ownerID
        }
    } catch(error) {
        console.log(error)
        return {
            error: error
        }
    } finally {
        if (connection) {
            connection.release()
        }
    }
}

export async function isUserInGroup(userID, groupID) {
    const connection = await pool.getConnection()
    try {
        
        const query = "SELECT * FROM userGroupConnection WHERE userID = ? AND groupID = ?"
        const result = await connection.query(query, [userID, groupID])

        if (result.length > 0) {
            return {
                isInGroup: true
            }
        } else {
            return {
                isInGroup: false
            }
        }
    } catch(error) {
        console.log(error)
        return {
            error: error
        }
    } finally {
        if (connection) {
            connection.release()
        }
    }
}

export async function getGroupIDFromEventID(eventID) {
    const connection = await pool.getConnection()
    try {
        
        const query = "SELECT groupID FROM event WHERE eventID = ?"
        const resultedRow = await connection.query(query, [eventID])
        
        if (resultedRow.length > 0) {
            return {
                groupID: resultedRow[0].groupID
            }
        }
    } catch(error) {
        console.log(error)
        return {
            error: error
        }
    } finally {
        if (connection) {
            connection.release()
        }
    }
}

export async function getOwnerIDFromEventID(eventID) {
    const connection = await pool.getConnection()
    try {
        const query = "SELECT g.ownerID FROM `group` AS g INNER JOIN event AS e ON g.groupID = e.groupID WHERE e.eventID = ?"
        const resultedRow = await connection.query(query, [eventID])
        
        if (resultedRow.length > 0) {
            return {
                ownerID: resultedRow[0].ownerID
            }
        }
    } catch(error) {
        console.log(error)
        return {
            error: error
        }
    } finally {
        if (connection) {
            connection.release()
        }
    }
}