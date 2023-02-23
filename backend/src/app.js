import express from 'express'
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

const app = express()

app.get("/humans", async function(request, response){
    console.log("Hello there hi")
    
    try{
        const connection = await pool.getConnection()
        const query = "SELECT * FROM humans ORDER BY name"
        const humans = await connection.query(query)
        response.status(200).json(humans)

    }catch(error){
        console.log(error)
        response.status(500).end()
    }
})

app.get("/", function(request, response){
    response.send("It works")
})

app.listen(8080)