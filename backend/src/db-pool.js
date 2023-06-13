import {createPool} from 'mariadb'

const pool = createPool({
    host: "database",
    port: 3306,
    user: "root",
    password: "abc123",
    database: "NotifyUs"
})

pool.on('error', function(error){
    console.log("Error from pool", error)
})

export {pool}