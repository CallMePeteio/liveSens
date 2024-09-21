

const sqlite3 = require("sqlite3").verbose()



const API_KEY = process.env.APIKEY || "iUvKoZ9W$h4Mgq9Xb";
const db = new sqlite3.Database("./db.db");

db.run('PRAGMA foreign_keys = ON');


module.exports = {API_KEY:API_KEY, db:db};

