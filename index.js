// const express = require("express");
// const path = require("path");
// const { MongoClient, ObjectId } = require("mongodb"); // Get Mongo class from MongoDB
// const bcrypt = require("bcryptjs"); // bcrypt for hashing passwords
// const session = require("express-session"); // Add session handling

// // MongoDB client setup
// const dbUrl = "mongodb://127.0.0.1:27017/"; // MongoDB connection string
// const client = new MongoClient(dbUrl); // Create a new client by passing in the connection string

// // Setup express app
// const app = express(); // Create express application
// const port = process.env.PORT || "8888"; // Set up a port number to run the application from

// // Set up express app to use pug as template engine
// app.set("views", path.join(__dirname, "templates")); // Set the "views" express setting to the path to the folder containing the template files.
// app.set("view engine", "pug"); // Set express to use "pug" as the template engine

// // Set up the folder path for static files (e.g., CSS, client-side JS, image files)
// app.use(express.static(path.join(__dirname, "public")));

// // Convert urlencoded format (for get/post request) to JSON
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json()); // Use JSON

// app.use("/node_modules", express.static("node_modules"));

// // Setup session handling
// app.use(
//   session({
//     secret: "your-secret-key", // Secret key to sign the session ID
//     resave: false,
//     saveUninitialized: true,
//   })
// );

// // Page routes
// app.get("/", async (request, response) => {
//   let links = await getLinks();
//   response.render("index", { title: "Home", menu: links });
// });

// app.get("/about", async (request, response) => {
//   let links = await getLinks();
//   response.render("about", { title: "About", menu: links });
// });

// // Register and Login Routes
// app.get("/login", (request, response) => {
//   response.render("auth/login", { title: "Login" });
// });

// app.get("/register", (request, response) => {
//   response.render("auth/register", { title: "Register" });
// });

// app.get("/dashboard", (request, response) => {
//   // Check if the user is logged in
//   if (!request.session.user) {
//     return response.redirect("/login"); // Redirect to login if not logged in
//   }

//   response.render("dashboard", {
//     title: "Dashboard",
//     user: request.session.user,
//   });
// });

// // Handle POST for Registration
// app.post("/register", async (request, response) => {
//   const { fname, lname, employee_id, password } = request.body;

//   // Check if fields are not empty
//   if (!fname || !lname || !employee_id || !password) {
//     return response.send("All fields are required");
//   }

//   // Hash the password before saving
//   const hashedPassword = await bcrypt.hash(password, 10);

//   // Save user to the database
//   const db = await connection();
//   const userExists = await db
//     .collection("users")
//     .findOne({ employee_id: employee_id });

//   if (userExists) {
//     return response.send("Employee ID already exists");
//   }

//   // Create a new user object
//   let newUser = {
//     fname,
//     lname,
//     employee_id,
//     password: hashedPassword,
//   };

//   try {
//     // Insert the user into the database
//     await db.collection("users").insertOne(newUser);
//     console.log("New user added:", newUser); // Log successful insertion
//     response.redirect("/login"); // Redirect to login after successful registration
//   } catch (err) {
//     console.error("Error during registration:", err); // Log error
//     response.send("There was an error during registration."); // Send error message
//   }
// });

// // Handle POST for Login
// app.post("/login", async (request, response) => {
//   const { employee_id, password } = request.body;

//   if (!employee_id || !password) {
//     return response.send("Employee ID and Password are required");
//   }

//   const db = await connection();
//   const user = await db
//     .collection("users")
//     .findOne({ employee_id: employee_id });

//   if (!user) {
//     return response.send("Invalid Employee ID or Password");
//   }

//   const isPasswordCorrect = await bcrypt.compare(password, user.password);

//   if (!isPasswordCorrect) {
//     return response.send("Invalid Employee ID or Password");
//   }

//   // Store user info in session on successful login
//   request.session.user = {
//     employee_id: user.employee_id,
//     fname: user.fname,
//     lname: user.lname,
//   };

//   // Redirect to dashboard after successful login
//   response.redirect("/dashboard");
// });

// // MongoDB connection function
// async function connection() {
//   try {
//     // Always connect to the client if not already connected
//     await client.connect(); // Ensure the client is connected
//     return client.db("capstonedb"); // Return the "capstonedb" database
//   } catch (error) {
//     console.error("MongoDB connection error:", error); // Log connection errors
//     throw new Error("Unable to connect to the database.");
//   }
// }

// // Get links from MongoDB
// async function getLinks() {
//   const db = await connection();
//   let results = db.collection("menuLinks").find({});
//   return await results.toArray(); // Return the array of data
// }

// // Add link to the menuLinks collection
// async function addLink(linkToAdd) {
//   const db = await connection();
//   await db.collection("menuLinks").insertOne(linkToAdd);
//   console.log(`Added ${linkToAdd} to menuLinks`);
// }

// // Delete link from the menuLinks collection
// async function deleteLink(id) {
//   const db = await connection();
//   let filter = { _id: new ObjectId(id) };
//   let result = await db.collection("menuLinks").deleteOne(filter);
//   if (result.deletedCount === 1) console.log("Link successfully deleted");
// }

// // Start the server
// app.listen(port, () => {
//   console.log(`Listening at http://localhost:${port}`);
// });

const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb"); // Get Mongo class from MongoDB
const bcrypt = require("bcryptjs"); // bcrypt for hashing passwords
const session = require("express-session"); // Add session handling

// MongoDB client setup
const dbUrl = "mongodb://127.0.0.1:27017/"; // MongoDB connection string
const client = new MongoClient(dbUrl); // Create a new client by passing in the connection string

// Setup express app
const app = express(); // Create express application
const port = process.env.PORT || "8888"; // Set up a port number to run the application from

// Set up express app to use pug as template engine
app.set("views", path.join(__dirname, "templates")); // Set the "views" express setting to the path to the folder containing the template files.
app.set("view engine", "pug"); // Set express to use "pug" as the template engine

// Set up the folder path for static files (e.g., CSS, client-side JS, image files)
app.use(express.static(path.join(__dirname, "public")));

// Convert urlencoded format (for get/post request) to JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Use JSON

app.use("/node_modules", express.static("node_modules"));

// Setup session handling
app.use(
  session({
    secret: "your-secret-key", // Secret key to sign the session ID
    resave: false,
    saveUninitialized: true,
  })
);

// Page routes
app.get("/", async (request, response) => {
  let links = await getLinks();
  response.render("index", { title: "Home", menu: links });
});

app.get("/about", async (request, response) => {
  let links = await getLinks();
  response.render("about", { title: "About", menu: links });
});

// Register and Login Routes
app.get("/login", (request, response) => {
  response.render("auth/login", { title: "Login" });
});

app.get("/register", (request, response) => {
  response.render("auth/register", { title: "Register" });
});

// Dashboard route
app.get("/dashboard", (request, response) => {
  // Check if the user is logged in
  if (!request.session.user) {
    return response.redirect("/login"); // Redirect to login if not logged in
  }

  const { fname, lname, employee_id } = request.session.user;

  response.render("dashboard", {
    title: "Dashboard",
    user: request.session.user,
    fname,
    lname,
    employee_id,
  });
});

// Logout route
app.get("/logout", (request, response) => {
  request.session.destroy((err) => {
    if (err) {
      return response.redirect("/dashboard");
    }
    response.redirect("/login");
  });
});

// Handle POST for Registration
app.post("/register", async (request, response) => {
  const { fname, lname, employee_id, password } = request.body;

  // Check if fields are not empty
  if (!fname || !lname || !employee_id || !password) {
    return response.send("All fields are required");
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save user to the database
  const db = await connection();
  const userExists = await db
    .collection("users")
    .findOne({ employee_id: employee_id });

  if (userExists) {
    return response.send("Employee ID already exists");
  }

  // Create a new user object
  let newUser = {
    fname,
    lname,
    employee_id,
    password: hashedPassword,
  };

  try {
    // Insert the user into the database
    await db.collection("users").insertOne(newUser);
    console.log("New user added:", newUser); // Log successful insertion
    response.redirect("/login"); // Redirect to login after successful registration
  } catch (err) {
    console.error("Error during registration:", err); // Log error
    response.send("There was an error during registration."); // Send error message
  }
});

// Handle POST for Login
app.post("/login", async (request, response) => {
  const { employee_id, password } = request.body;

  if (!employee_id || !password) {
    return response.send("Employee ID and Password are required");
  }

  const db = await connection();
  const user = await db
    .collection("users")
    .findOne({ employee_id: employee_id });

  if (!user) {
    return response.send("Invalid Employee ID or Password");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    return response.send("Invalid Employee ID or Password");
  }

  // Store user info in session on successful login
  request.session.user = {
    employee_id: user.employee_id,
    fname: user.fname,
    lname: user.lname,
  };

  // Redirect to dashboard after successful login
  response.redirect("/dashboard");
});

// MongoDB connection function
async function connection() {
  try {
    // Always connect to the client if not already connected
    await client.connect(); // Ensure the client is connected
    return client.db("capstonedb"); // Return the "capstonedb" database
  } catch (error) {
    console.error("MongoDB connection error:", error); // Log connection errors
    throw new Error("Unable to connect to the database.");
  }
}

// Get links from MongoDB
async function getLinks() {
  const db = await connection();
  let results = db.collection("menuLinks").find({});
  return await results.toArray(); // Return the array of data
}

// Add link to the menuLinks collection
async function addLink(linkToAdd) {
  const db = await connection();
  await db.collection("menuLinks").insertOne(linkToAdd);
  console.log(`Added ${linkToAdd} to menuLinks`);
}

// Delete link from the menuLinks collection
async function deleteLink(id) {
  const db = await connection();
  let filter = { _id: new ObjectId(id) };
  let result = await db.collection("menuLinks").deleteOne(filter);
  if (result.deletedCount === 1) console.log("Link successfully deleted");
}

// Start the server
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
