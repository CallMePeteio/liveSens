

const express = require("express");
const path = require("path");




const HTMLPATH = path.join(__dirname, "../website", "html");
const router = express.Router();

router.get("/", (req, res) => {
    res.sendFile(path.join(HTMLPATH, "home.html"));
})



module.exports = router