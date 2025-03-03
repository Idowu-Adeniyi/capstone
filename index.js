const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const dbUrl = "mongodb://127.0.0.1:27017/";
const client = new MongoClient(dbUrl);

const app = express();
const port = process.env.PORT || "8888";

app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "pug");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/node_modules", express.static("node_modules"));
app.use(express.static("public"));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", async (request, response) => {
  let links = await getLinks();
  response.render("index", { title: "Home", menu: links });
});

app.get("/about", async (request, response) => {
  let links = await getLinks();
  response.render("about", { title: "About", menu: links });
});

app.get("/login", (request, response) => {
  response.render("auth/login", { title: "Login" });
});

app.get("/register", (request, response) => {
  response.render("auth/register", { title: "Register" });
});

app.get("/dashboard", async (request, response) => {
  if (!request.session.user) return response.redirect("/login");

  const db = await connection();
  const userId = request.session.user.employee_id;

  // Get the most recent clock-in/clock-out entry
  const latestEntry = await db
    .collection("work_hours")
    .find({ employee_id: userId })
    .sort({ clockIn: -1 })
    .limit(1)
    .toArray();

  // Get log history for display
  const logHistory = await db
    .collection("work_hours")
    .find({ employee_id: userId })
    .sort({ clockIn: -1 })
    .toArray();

  let clockStatus = "Not clocked in yet.";
  let workedHours = "N/A";
  let isClockedIn = false;
  let clockInTime = null;

  if (latestEntry.length > 0) {
    const entry = latestEntry[0];
    clockInTime = new Date(entry.clockIn);
    const clockOutTime = entry.clockOut ? new Date(entry.clockOut) : null;

    if (!clockOutTime) {
      isClockedIn = true;
      clockStatus = `✅ Currently Clocked In at: ${clockInTime.toLocaleTimeString()}`;
    } else {
      const durationMs = clockOutTime - clockInTime;
      workedHours = formatDuration(durationMs);
      clockStatus = `❌ Clocked Out at: ${clockOutTime.toLocaleTimeString()} (Worked: ${workedHours})`;
    }
  }

  // Format log history
  const formattedLogHistory = logHistory.map((log) => ({
    action: log.clockOut ? "Clocked Out" : "Clocked In",
    clockInTime: log.clockIn
      ? new Date(log.clockIn).toLocaleTimeString()
      : "N/A",
    clockOutTime: log.clockOut
      ? new Date(log.clockOut).toLocaleTimeString()
      : "N/A",
    workedDuration: log.clockOut
      ? formatDuration(new Date(log.clockOut) - new Date(log.clockIn))
      : "N/A",
  }));

  response.render("dashboard", {
    title: "Dashboard",
    user: request.session.user,
    clockStatus,
    workedHours,
    isClockedIn,
    clockInTime: isClockedIn ? clockInTime.getTime() : null, // Pass timestamp for frontend
    logHistory: formattedLogHistory,
  });
});

// Function to format time duration (HH:MM:SS)
function formatDuration(ms) {
  let seconds = Math.floor(ms / 1000) % 60;
  let minutes = Math.floor(ms / (1000 * 60)) % 60;
  let hours = Math.floor(ms / (1000 * 60 * 60));
  return `${hours}h ${minutes}m ${seconds}s`;
}

// logout
app.get("/logout", (request, response) => {
  request.session.destroy((err) => {
    if (err) return response.redirect("/dashboard");
    response.redirect("/login");
  });
});

//register
app.post("/register", async (request, response) => {
  const { fname, lname, employee_id, password } = request.body;
  if (!fname || !lname || !employee_id || !password)
    return response.send("All fields are required");

  const hashedPassword = await bcrypt.hash(password, 10);
  const db = await connection();
  const userExists = await db.collection("users").findOne({ employee_id });

  if (userExists) return response.send("Employee ID already exists");

  let newUser = { fname, lname, employee_id, password: hashedPassword };
  try {
    await db.collection("users").insertOne(newUser);
    response.redirect("/login");
  } catch (err) {
    console.error("Error during registration:", err);
    response.send("There was an error during registration.");
  }
});

//login
app.post("/login", async (request, response) => {
  const { employee_id, password } = request.body;
  if (!employee_id || !password)
    return response.send("Employee ID and Password are required");

  const db = await connection();
  const user = await db.collection("users").findOne({ employee_id });

  if (!user || !(await bcrypt.compare(password, user.password)))
    return response.send("Invalid Employee ID or Password");

  request.session.user = {
    employee_id: user.employee_id,
    fname: user.fname,
    lname: user.lname,
  };
  response.redirect("/dashboard");
});

// clock in
app.post("/clockin", async (request, response) => {
  if (!request.session.user) return response.redirect("/login");

  try {
    const db = await connection();
    const clockInTime = new Date();

    // Insert into work_hours collection
    await db.collection("work_hours").insertOne({
      employee_id: request.session.user.employee_id,
      clockIn: clockInTime,
      clockOut: null,
    });

    // Log entry in log_history
    await db.collection("log_history").insertOne({
      employee_id: request.session.user.employee_id,
      action: "Clock In",
      timestamp: clockInTime,
      clockInTime: clockInTime,
      clockOutTime: null,
    });

    response.redirect("/dashboard");
  } catch (error) {
    console.error("Error during clock-in:", error);
    response.status(500).send("Internal Server Error");
  }
});

// clock out
app.post("/clockout", async (request, response) => {
  if (!request.session.user) return response.redirect("/login");

  try {
    const db = await connection();
    const clockOutTime = new Date();

    // Find the most recent clock-in entry where clockOut is null
    const latestEntry = await db.collection("work_hours").findOne({
      employee_id: request.session.user.employee_id,
      clockOut: null,
    });

    if (!latestEntry) {
      return response.send("No active clock-in found.");
    }

    // Update the clockOut time in work_hours
    await db
      .collection("work_hours")
      .updateOne(
        { _id: latestEntry._id },
        { $set: { clockOut: clockOutTime } }
      );

    // Update log_history to reflect the clock-out time
    await db.collection("log_history").updateOne(
      {
        employee_id: request.session.user.employee_id,
        action: "Clock In",
        clockOutTime: null,
      },
      { $set: { clockOutTime: clockOutTime, action: "Clock Out" } }
    );

    response.redirect("/dashboard");
  } catch (error) {
    console.error("Error during clock-out:", error);
    response.status(500).send("Internal Server Error");
  }
});

async function connection() {
  try {
    await client.connect();
    return client.db("capstonedb");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Unable to connect to the database.");
  }
}

async function getLinks() {
  const db = await connection();
  return await db.collection("menuLinks").find({}).toArray();
}

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
