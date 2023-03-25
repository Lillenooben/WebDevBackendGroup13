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
        const query = "INSERT INTO usersTable (username, userPassword, profileImage) VALUES (?,?,?)"
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
        let query = "SELECT userID FROM userGroupConTable WHERE groupID = ?"
        const usersInGroup = await connection.query(query, [groupID])
        const userIDsArray = getParsedIDs(usersInGroup)

        query = "SELECT eventID FROM eventsTable WHERE groupID = ? ORDER BY eventID DESC"
        const eventIDsFromGroupID = await connection.query(query, [groupID])
        const eventIDFromLatestEvent = eventIDsFromGroupID[0].eventID

        query = "INSERT INTO userEventConTable (userID, eventID) VALUES (?,?)"
        for (let userID of userIDsArray){
            await connection.query(query, [userID, eventIDFromLatestEvent])
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
        const query = "INSERT INTO userGroupConTable (userID, groupID, isOwner, prevMessageCount) VALUES (?,?,?,?)"
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
        const query = "SELECT * FROM usersTable WHERE username = ?"
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