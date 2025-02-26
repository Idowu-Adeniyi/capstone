const express = require("express");
const path = require("path");

// set up express app
const app = express(); // create express application
const port = process.env.PORT || "8888"; // set up a port number to run the application from

//set up express app to use pug as template engine
app.set("views", path.join(__dirname, "templates")); // set the "views" express setting to the path to the folder containing the template files.

app.set("view engine", "pug"); // set express to use "pug" as the template engine (settinog: "view engine")

//Page routes
app.get("/", (request, response) => {
  //   response.status(200).send("Hello");
  response.render("index", { title: "Home" }); // renders /templates/layout.pug
});

app.get("/about", (request, response) => {
  response.render("about", { title: "About" });
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
