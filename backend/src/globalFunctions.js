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
        const query = "INSERT INTO user (name, password, image) VALUES (?,?,?)"
        await connection.query(query, [username, hashedPassword, ""])
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
        const user = await connection.query(query, [username])

        const hashedPassword = user[0].password
        return {
            didSucceed: bcrypt.compareSync(password, hashedPassword),
            user: user[0]
        }

    }catch(error){
        return {didSucceed: false}
    }finally{
        if (connection) {
            connection.release()
        }
    }

}