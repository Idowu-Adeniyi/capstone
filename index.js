const express = require("express");
const path = require("path");

// set up express app
const app = express(); // create express application
const port = process.env.PORT || "8888"; // set up a port number to run the application from

//Page routes
app.get("/", (request, response) => {
  response.status(200).send("Hello");
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
