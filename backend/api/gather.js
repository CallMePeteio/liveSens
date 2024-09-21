


const express = require("express");
const configure = require("../configure");

const API_KEY = configure.API_KEY;
const db = configure.db;
const router = express.Router();

let latestDataRecived = null // STORES ALL OF THE NEW DATA SENT TO THE /api/gather/sensData/KEY ENDPOINT

async function sensorExists(sensor, id, db, callback){
    const checkQuery = "SELECT * FROM sensor WHERE sensName = ? or id = ?";

    db.get(checkQuery, [sensor, id], (err, row) => {
        if (err) {
            callback(err, null)
        }else if (row){
            callback(null, true)
        }else{
            callback(null, false)
        }
    })
}

async function findSensId(sensor, db, callback){
    const sqlQuery = "SELECT * FROM sensor WHERE sensName = ?"

    db.get(sqlQuery, [sensor], (err, row) => {
        if (err){
            callback(err, null)
        }else if (row != undefined){
            callback(null, row.id)
        }else {
            callback(null, false)
        }
    })
}


// EXAMPLE INPUT DATA:
//{
//    S01: { value: 18.4, type: 'SAL', temp: 16.5 },
//    S02: { value: 8.64, type: 'O2', temp: 16.5 },
//    S03: { value: 27.2, type: 'SAL', temp: 11.2 },
//    S04: { value: 3.29, type: 'O2', temp: 11.2 }
//}

router.post("/sensData/:key", (req, res) => {
    const key = req.params.key;

    if (key === API_KEY){
        const sensData = req.body;

        for (const [sensor, data] of Object.entries(sensData)){
    
            // CHECKS IF SENSOR EXISTS, IF NOT THEN INSERTS THE SENSOR INTO "SENSOR" TABLE
            sensorExists(sensor, id=undefined, db, (err, exists) =>{
                if (err) {console.error(`There was an error checking if sensor exists: ${err}`); return res.sendStatus(500)}
                else if (exists == false){
                    const insertQuery = "INSERT INTO sensor (sensName, mesureType) VALUES (?, ?)"
                    db.run(insertQuery, [sensor, data.type], (err) => {
                        if (err) {console.error(`There was an error inserting new sensor: ${err}`); return res.sendStatus(500)}
                        else{console.log(`Sucsessfully inserted sensor: ${sensor}`)}
                    })
                }

            })

            // FINDS THE ID OF THE SENSOR, THEN IT INSERTS THE DATA WITH THE CORRESPONDING SENSOR ID (INTO "DATA" TABLE).
            findSensId(sensor, db, (err, sensId) => {
                if (err) {console.error(`There was an error finding sens id: ${err}`)}
                else if (sensId == false) {console.error(`Didnt find sensor in db: ${sensor}`)}
                else{
                    const insertQuery = "INSERT INTO data (sensorId, value, temp) VALUES (?, ?, ?)";
                    db.run(insertQuery, [sensId, data.value, data.temp], (err) => {
                        if (err) {console.log(`There was an error inserting sensor data: ${err}`); return res.sendStatus(500)}
                    })
                }
            });
        }

        latestDataRecived = sensData;
        return res.sendStatus(200);

    }else {
        return res.sendStatus(40);
    }1


})

router.get("/sensData/:key", (req, res) => {
    const key = req.params.key;

    if (key === API_KEY){
        if (latestDataRecived !== null){
            res.send(latestDataRecived).status(200);
        } else {
            return res.status(500).json({ message: "There was a problem reciving sensor data"});
        }
    }else{
        return res.sendStatus(401)
    }
})

module.exports = router;