

const sqlite3 = require("sqlite3").verbose();
const db = require("./configure").db


const tableQueries = [
    `CREATE TABLE IF NOT EXISTS sensor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensName VARCHAR(255),
        mesureType VARCHAR(255)
    )`,
    
    `CREATE TABLE IF NOT EXISTS data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensorId INTEGER, 
        value INTEGER,
        temp INTEGER, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sensorId) REFERENCES sensor(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`
]

for (let query in tableQueries){
    db.serialize(() => {
        db.run(tableQueries[query]);
    })
}

 

const insertQuery = "INSERT INTO sensor (sensName, mesureType) VALUES (?, ?)"
db.run(insertQuery, ["S01", "SAL"], (err) => {console.log(err)})
db.run(insertQuery, ["S02", "O2"], (err) => {console.log(err)})
db.run(insertQuery, ["S03", "SAL"], (err) => {console.log(err)})
