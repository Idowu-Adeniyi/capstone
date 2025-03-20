const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const router = express.Router();
const userModel = require("./models/userModel");

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

// get worklogs
app.get("/worklogs", async (request, response) => {
  if (!request.session.user) return response.redirect("/login");

  const db = await connection();
  const userId = request.session.user.employee_id;
  const userName = `${request.session.user.fname} ${request.session.user.lname}`;

  // Fetch full log history
  const logHistory = await db
    .collection("log_history")
    .find({ employee_id: userId })
    .sort({ timestamp: -1 })
    .toArray();

  const formattedLogHistory = logHistory.map((log) => {
    const clockInTime = log.clockInTime ? new Date(log.clockInTime) : null;
    const clockOutTime = log.clockOutTime ? new Date(log.clockOutTime) : null;

    const workedDuration =
      clockInTime && clockOutTime
        ? formatDuration(clockOutTime - clockInTime)
        : "N/A";

    return {
      action: log.action,
      clockInTime: clockInTime ? clockInTime.toLocaleTimeString() : "N/A",
      dateClockIn: clockInTime ? clockInTime.toLocaleDateString() : "N/A",
      clockOutTime: clockOutTime ? clockOutTime.toLocaleTimeString() : "N/A",
      dateClockOut: clockOutTime ? clockOutTime.toLocaleDateString() : "N/A",
      workedDuration: workedDuration,
    };
  });

  response.render("worklogs", {
    title: "Work Logs",
    userName,
    logHistory: formattedLogHistory,
  });
});

// profile
app.get("/profile", async (request, response) => {
  if (!request.session.user) {
    // If no user in session, redirect to login
    return response.redirect("/login");
  }

  // Extracting user credentials from session
  const { employee_id } = request.session.user;
  const message = request.query.message || ""; // Capture the success message from the query parameter if it exists

  try {
    // Fetching user data from database based on employee_id
    const db = await connection();
    const user = await db.collection("users").findOne({ employee_id });

    // If no user is found, return a 404 error
    if (!user) {
      return response.status(404).send("User not found");
    }

    // If user found, render profile page and pass the user data
    return response.render("profile", {
      title: "Profile",
      user: user, // Passing user data to profile.pug
      message: message, // Passing the message to the template
    });
  } catch (err) {
    // If there's an error, log it and return a 500 error
    console.error("Error fetching user data:", err);
    return response.status(500).send("Error fetching user data");
  }
});

// dashboard
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

  // Log history - limit to 6 entries
  const logHistory = await db
    .collection("log_history")
    .find({ employee_id: userId })
    .sort({ timestamp: -1 })
    .limit(6) // ✅ Limit to 6 records
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

  const formattedLogHistory = logHistory.map((log) => {
    const clockInTime = log.clockInTime ? new Date(log.clockInTime) : null;
    const clockOutTime = log.clockOutTime ? new Date(log.clockOutTime) : null;

    const workedDuration =
      clockInTime && clockOutTime
        ? formatDuration(clockOutTime - clockInTime)
        : "N/A";

    return {
      action: log.action,
      clockInTime: clockInTime ? clockInTime.toLocaleTimeString() : "N/A",
      dateClockIn: clockInTime ? clockInTime.toLocaleDateString() : "N/A",
      clockOutTime: clockOutTime ? clockOutTime.toLocaleTimeString() : "N/A",
      dateClockOut: clockOutTime ? clockOutTime.toLocaleDateString() : "N/A",
      workedDuration: workedDuration,
    };
  });

  response.render("dashboard", {
    title: "Dashboard",
    user: request.session.user,
    clockStatus,
    workedHours,
    isClockedIn,
    clockInTime: isClockedIn ? clockInTime.getTime() : null,
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
  const { fname, lname, employee_id, password, role } = request.body;

  // Ensure all required fields are provided
  if (!fname || !lname || !employee_id || !password)
    return response.send("All fields are required");

  // Default role to 'employee' if not provided
  const userRole = role || "employee";

  // Hash the password before saving it to the database
  const hashedPassword = await bcrypt.hash(password, 10);

  const db = await connection();

  // Check if the employee ID already exists in the database
  const userExists = await db.collection("users").findOne({ employee_id });

  // If user already exists, return an error
  if (userExists) return response.send("Employee ID already exists");

  // Create the new user object, including the role
  let newUser = {
    fname,
    lname,
    employee_id,
    password: hashedPassword,
    role: userRole,
  };

  try {
    // Insert the new user into the database
    await db.collection("users").insertOne(newUser);

    // Redirect to login page after successful registration
    response.redirect("/login");
  } catch (err) {
    // Handle any errors that occur during registration
    console.error("Error during registration:", err);
    response.send("There was an error during registration.");
  }
});

// app.post("/register", async (request, response) => {
//   const { fname, lname, employee_id, password } = request.body;
//   if (!fname || !lname || !employee_id || !password)
//     return response.send("All fields are required");

//   const hashedPassword = await bcrypt.hash(password, 10);
//   const db = await connection();
//   const userExists = await db.collection("users").findOne({ employee_id });

//   if (userExists) return response.send("Employee ID already exists");

//   let newUser = { fname, lname, employee_id, password: hashedPassword };
//   try {
//     await db.collection("users").insertOne(newUser);
//     response.redirect("/login");
//   } catch (err) {
//     console.error("Error during registration:", err);
//     response.send("There was an error during registration.");
//   }
// });

// change password
app.post("/profile/change-password", async (request, response) => {
  const { currentPassword, newPassword, confirmPassword } = request.body;

  if (!currentPassword || !newPassword || !confirmPassword)
    return response.render("profile", {
      message: "All fields are required",
      messageType: "danger",
      user: request.session.user,
    });

  if (newPassword !== confirmPassword)
    return response.render("profile", {
      message: "New passwords do not match",
      messageType: "danger",
      user: request.session.user,
    });

  const db = await connection();
  const user = await db.collection("users").findOne({
    employee_id: request.session.user?.employee_id,
  });

  if (!user || !(await bcrypt.compare(currentPassword, user.password)))
    return response.render("profile", {
      message: "Current password is incorrect",
      messageType: "danger",
      user: request.session.user,
    });

  // Hash the new password before storing it
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db
    .collection("users")
    .updateOne(
      { employee_id: user.employee_id },
      { $set: { password: hashedPassword } }
    );

  response.render("profile", {
    message: "Password changed successfully!",
    messageType: "success",
    user: request.session.user,
  });
});

//login
app.post("/login", async (request, response) => {
  const { employee_id, password } = request.body;
  if (!employee_id || !password)
    return response.send("Employee ID and Password are required");

  const db = await connection();
  const user = await db.collection("users").findOne({ employee_id });

  // Check if the user exists and the password is correct
  if (!user || !(await bcrypt.compare(password, user.password)))
    return response.send("Invalid Employee ID or Password");

  // Store user details and role in the session
  request.session.user = {
    employee_id: user.employee_id,
    fname: user.fname,
    lname: user.lname,
    role: user.role, // Store the role (admin or employee)
  };

  // Redirect to dashboard based on the role
  if (user.role === "admin") {
    response.redirect("/reports"); // Admin goes to reports page
  } else {
    response.redirect("/dashboard"); // Employees go to dashboard
  }
});

// app.post("/login", async (request, response) => {
//   const { employee_id, password } = request.body;
//   if (!employee_id || !password)
//     return response.send("Employee ID and Password are required");

//   const db = await connection();
//   const user = await db.collection("users").findOne({ employee_id });

//   if (!user || !(await bcrypt.compare(password, user.password)))
//     return response.send("Invalid Employee ID or Password");

//   request.session.user = {
//     employee_id: user.employee_id,
//     fname: user.fname,
//     lname: user.lname,
//   };
//   response.redirect("/dashboard");
// });

// Edit Profile
app.get("/profile/edit", async (request, response) => {
  if (!request.session.user) {
    return response.redirect("/login");
  }

  const { employee_id } = request.session.user;

  try {
    const db = await connection();
    const user = await db.collection("users").findOne({ employee_id });

    if (!user) {
      return response.status(404).send("User not found");
    }

    return response.render("edit-profile", {
      title: "Edit Profile",
      user: user, // Pass user data to pre-fill the form
    });
  } catch (err) {
    console.error("Error fetching user data:", err);
    return response.status(500).send("Error fetching user data");
  }
});

// Image Upload
// Set up Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: (request, file, cb) => {
    cb(null, "public/images"); // Ensure this folder exists
  },
  filename: (request, file, cb) => {
    // Use the employee ID and file extension for unique naming
    cb(
      null,
      `profile-${request.session.user.employee_id}${path.extname(
        file.originalname
      )}`
    );
  },
});

const upload = multer({ storage: storage });

// Route to handle photo upload
app.post(
  "/profile/upload-photo",
  upload.single("photoUpload"),
  async (request, response) => {
    if (!request.session.user) {
      return response.redirect("/login");
    }

    // Log the uploaded file for debugging
    console.log("Uploaded file:", request.file);

    // Check if a file was uploaded
    if (!request.file) {
      return response.status(400).send("No file uploaded");
    }

    const userId = request.session.user.employee_id;
    const photoPath = `/images/${request.file.filename}`;

    // Log the path to save in DB
    console.log("Saving photo path:", photoPath);

    try {
      // Connect to MongoDB without deprecated options
      const db = await MongoClient.connect("mongodb://localhost:27017");

      const database = db.db("capstonedb");

      // Update the user's photo path in the database
      await database
        .collection("users")
        .updateOne({ employee_id: userId }, { $set: { photo: photoPath } });

      // Update the session with the new photo path
      request.session.user.photo = photoPath;

      // Redirect with success message
      const message = "Your photo has been successfully updated!";
      response.redirect(`/profile?message=${encodeURIComponent(message)}`);
    } catch (error) {
      console.error("Error saving photo:", error);
      return response.status(500).send("Server error while uploading photo");
    }
  }
);

// Route to handle profile update
app.post("/profile/edit", async (request, response) => {
  if (!request.session.user) {
    return response.redirect("/login");
  }

  const { employee_id } = request.session.user;
  const { fname, lname, email, phone, address } = request.body;

  if (!fname || !lname || !email || !phone || !address) {
    return response.render("edit-profile", {
      title: "Edit Profile",
      message: "All fields are required",
      messageType: "danger",
      user: { fname, lname, email, phone, address },
    });
  }

  try {
    const db = await connection();
    const result = await db.collection("users").updateOne(
      { employee_id },
      {
        $set: {
          fname,
          lname,
          email,
          phone,
          address,
        },
      }
    );

    if (result.modifiedCount === 0) {
      return response.render("edit-profile", {
        title: "Edit Profile",
        message: "No changes detected",
        messageType: "warning",
        user: { fname, lname, email, phone, address },
      });
    }

    // Update session user data as well if needed
    request.session.user = {
      ...request.session.user,
      fname,
      lname,
      email,
      phone,
      address,
    };

    response.redirect("/profile"); // Redirect to the profile page after successful update
  } catch (err) {
    console.error("Error updating user data:", err);
    return response.status(500).send("Error updating user data");
  }
});

// Reports
app.get("/reports", async (request, response) => {
  // Check if user is logged in and has admin privileges
  if (!request.session.user || request.session.user.role !== "admin") {
    return response.redirect("/login"); // Redirect to login if not an admin
  }

  try {
    const db = await connection();

    // Fetch all work logs
    const workLogs = await db.collection("work_hours").find().toArray();

    // Group work logs by user and calculate total hours
    let totalHoursByUser = {};
    workLogs.forEach((log) => {
      if (!totalHoursByUser[log.employee_id]) {
        totalHoursByUser[log.employee_id] = 0;
      }
      if (log.clockIn && log.clockOut) {
        totalHoursByUser[log.employee_id] +=
          (new Date(log.clockOut) - new Date(log.clockIn)) / 3600000; // Convert ms to hours
      }
    });

    // Format the report data for rendering
    let formattedReport = Object.keys(totalHoursByUser).map((id) => ({
      employee_id: id,
      total_hours: totalHoursByUser[id].toFixed(2) + " hrs",
    }));

    // Render the reports view with the report data
    response.render("reports", {
      title: "Work Reports",
      reports: formattedReport,
    });
  } catch (err) {
    console.error("Error fetching work logs:", err);
    response.send("An error occurred while fetching the work logs.");
  }
});

// app.get("/reports", async (request, response) => {
//   if (!request.session.user || request.session.user.role !== "admin") {
//     return response.redirect("/login");
//   }

//   const db = await connection();

//   // Fetch all work logs
//   const workLogs = await db.collection("work_hours").find().toArray();

//   // Group work logs by user and calculate total hours
//   let totalHoursByUser = {};
//   workLogs.forEach((log) => {
//     if (!totalHoursByUser[log.employee_id]) {
//       totalHoursByUser[log.employee_id] = 0;
//     }
//     if (log.clockIn && log.clockOut) {
//       totalHoursByUser[log.employee_id] +=
//         (new Date(log.clockOut) - new Date(log.clockIn)) / 3600000; // Convert ms to hours
//     }
//   });

//   // Convert to a format usable in the view
//   let formattedReport = Object.keys(totalHoursByUser).map((id) => ({
//     employee_id: id,
//     total_hours: totalHoursByUser[id].toFixed(2) + " hrs",
//   }));

//   response.render("reports", {
//     title: "Work Reports",
//     reports: formattedReport,
//   });
// });

// clock in
app.post("/clockin", async (request, response) => {
  if (!request.session.user) return response.redirect("/login");

  try {
    const db = await connection();
    const clockInTime = new Date();
    const dateClockIn = clockInTime.toISOString().split("T")[0]; // Extract only the date

    // Insert into work_hours collection
    await db.collection("work_hours").insertOne({
      employee_id: request.session.user.employee_id,
      clockIn: clockInTime,
      dateClockIn: dateClockIn,
      clockOut: null,
      dateClockOut: null, // Placeholder for future update
    });

    // Log entry in log_history with date and time
    await db.collection("log_history").insertOne({
      employee_id: request.session.user.employee_id,
      action: "Clock In",
      timestamp: clockInTime,
      clockInTime: clockInTime,
      dateClockIn: dateClockIn, // Storing only the date
      clockOutTime: null,
      dateClockOut: null,
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
    const dateClockOut = clockOutTime.toISOString().split("T")[0]; // Extract only the date

    // Find the most recent clock-in entry where clockOut is null
    const latestEntry = await db.collection("work_hours").findOne({
      employee_id: request.session.user.employee_id,
      clockOut: null,
    });

    if (!latestEntry) {
      return response.send("No active clock-in found.");
    }

    // Update the clockOut time and date in work_hours
    await db
      .collection("work_hours")
      .updateOne(
        { _id: latestEntry._id },
        { $set: { clockOut: clockOutTime, dateClockOut: dateClockOut } }
      );

    // Update log_history to reflect the clock-out time and date
    await db.collection("log_history").updateOne(
      {
        employee_id: request.session.user.employee_id,
        action: "Clock In",
        clockOutTime: null,
      },
      {
        $set: {
          clockOutTime: clockOutTime,
          dateClockOut: dateClockOut,
          action: "Clock Out",
        },
      }
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
