const express = require("express");
const configure = require("../configure");

const API_KEY = configure.API_KEY;
const db = configure.db;




const router = express.Router();

async function getSensors(){
    const sensorPromt = "SELECT * FROM sensor";
    return new Promise((resolve, reject) => {
        db.all(sensorPromt, (err, sensors) => {
            if (err) {reject(err)}
            else {resolve(sensors)};
        })
    })

}

async function getSensData(id, startTime=undefined, endTime=undefined) {
    let query = "SELECT value, temp, created_at FROM data WHERE sensorId = ?";
    let params = [id];

    if (startTime && endTime){
        query += " AND created_at BETWEEN ? and ?";
        params.push(startTime, endTime);
    } else if (startTime){
        query += " AND created_at >= ?";
        params.push(startTime);
    } else if (endTime){
        query += "AND created_at <= ?";
        params.push(endTime)
    }
    
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, data) => {
            if (err) {reject(err)}
            else {resolve(data)};
        })
    })

}



router.get("/all/:key/:dataAmount?/:startTime?/:endTime?", async (req, res) => {
    const apiKey = req.params.key;
    let dataAmount = req.params.dataAmount;

    let startTime = req.params.startTime;
    const endTime = req.params.endTime;

    if (apiKey === API_KEY){
        try{

            if (startTime === "undefined"){ // im soon done, so im just doing this :)
                startTime = undefined;
            }
            console.log(endTime)
            let outputData = {}

            // SELECTS ALL OF THE SENSORS
            const sensors = await getSensors();
            dataAmount = Math.round(dataAmount / sensors.length); 

            // CONSTRUCTS THE SENSORS WITH THE GATHERED DATA
            for (let sensor of sensors){
                let data = await getSensData(sensor.id, startTime, endTime); 

            // REMOVES DATA, SO WE DONT SENDS GB OF DATA
                if (dataAmount !== undefined && data.length >= dataAmount){
                const removeAmount = data.length - dataAmount;
                const removeInterval = data.length / removeAmount;
                
                let index = 0;
                let nextRemoveAt = removeInterval; // Next index to remove based on the interval
                let filteredData = [];
                
                for (let datapoint of data) {
                    if (index >= nextRemoveAt) {
                        // Skip the element as it needs to be removed
                        nextRemoveAt += removeInterval; // Calculate the next index where removal should happen
                    } else {
                        filteredData.push(datapoint);
                    }
                    index++;
                }

                outputData[sensor.sensName] = {mesureType:sensor.mesureType, data:filteredData};
                }else {             
                    outputData[sensor.sensName] = {mesureType:sensor.mesureType, data:data};
                }
            }

            console.log(outputData.S01.data.length);
            return res.status(200).json(outputData);

        } catch (error){
            console.error(`There was a error gathering data ${error}`);
            return res.sendStatus(500);
        }
    }else {
        return res.sendStatus(401);
    }
})



router.get("/download", async (req, res) => {

    let outputData = {};
    const sensors = await getSensors();

    for (let sensor of sensors){
        let data = await getSensData(sensor.id);
        outputData[sensor.sensName] = {mesureType:sensor.mesureType, data:data};
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="data.json"`);

    res.send(JSON.stringify(outputData, null, 2)).status(200);
})

module.exports = router;