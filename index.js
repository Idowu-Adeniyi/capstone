const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb"); // get mongo class from mongo db

// mongodb client setup
const dbUrl = "mongodb://localhost:27017/"; //connection string
const client = new MongoClient(dbUrl); // create a new client by passing in the connection string

// setup express app
const app = express(); // create express application
const port = process.env.PORT || "8888"; // set up a port number to run the application from

//set up express app to use pug as template engine
app.set("views", path.join(__dirname, "templates")); // set the "views" express setting to the path to the folder containing the template files.

app.set("view engine", "pug"); // set express to use "pug" as the template engine (settinog: "view engine")

// set up the folder path for static files(e.g css, client-side JS, images files)
app.use(express.static(path.join(__dirname, "public")));

// convert urlencoded format (for get/post request) to json
//urlencoded format is query string format (e.g. parameter1=value1&parameter2=value2)
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // use JSON

//Page routes
// if you want to use an async function in your callback function(see below), you need to also make the call back function async
app.get("/", async (request, response) => {
  //   response.status(200).send("Hello");
  let links = await getLinks();
  //   console.log(links);
  response.render("index", { title: "Home", menu: links }); // renders /templates/layout.pug
});

app.get("/about", async (request, response) => {
  let links = await getLinks();
  response.render("about", { title: "About", menu: links });
});

//Admin page paths
app.get("/admin/menu", async (request, response) => {
  let links = await getLinks();
  response.render("menu-list", { title: "Administer menu", menu: links });
});

app.get("/admin/menu/add", async (request, response) => {
  let links = await getLinks();
  response.render("menu-add", { title: "Add menu link", menu: links });
});

app.post("/admin/menu/add/submit", async (request, response) => {
  // get data from the form (data will be in request)
  //POST form: get data from request.body
  //GET form: get data from request.query
  //console.log(request.body);
  let newLink = {
    weight: parseInt(request.body.weight),
    path: request.body.path,
    name: request.body.name,
  };
  await addLink(newLink);
  response.redirect("/admin/menu");
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

//mongodb functions
async function connection() {
  db = client.db("capstonedb"); // select the database
  return db; // return database so other code/ functions can use it
}

async function getLinks() {
  db = await connection(); // use await because conntion()is asynchronous
  let results = db.collection("menuLinks").find({}); // find all so no query({})
  // find() returns an object of type FindCursor, so we need to run
  // toArray() to convert to a JSON array we can use
  return await results.toArray(); // return the array of data
}

async function addLink(linkToAdd) {
  db = await connection();
  await db.collection("menuLinks").insertOne(linkToAdd);
  console.log(`Added ${linkToAdd} to menuLinks`);
}
