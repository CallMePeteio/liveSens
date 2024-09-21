


const express = require("express");
const path = require("path");



const app = express();

app.use(express.static(path.join(__dirname, "../website")));
app.use(express.json()); 




const gatherApiRoute = require("./api/gather");
const dataApiRoute = require("./api/data");
const htmlRoute = require("./htmlRoute")
app.use("/api/gather", gatherApiRoute);
app.use("/api/data", dataApiRoute);
app.use("/", htmlRoute);


// Catch-all route for invalid paths
app.use((req, res, next) => {
    res.redirect("/");
})




const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Website listening on port: ${port}`));





