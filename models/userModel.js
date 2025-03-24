const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

// const dbUrl = "mongodb://127.0.0.1:27017/"; // for mongoCompass
const dbUrl = process.env.MONGO_URI;
const client = new MongoClient(dbUrl);

async function connection() {
  await client.connect(); // Ensure the client is connected
  const db = client.db("capstonedb");
  return db;
}

// Register user with a default role of 'employee'
async function registerUser(userData) {
  const db = await connection();
  const usersCollection = db.collection("users");

  // If no role is specified, default to 'employee'
  if (!userData.role) {
    userData.role = "employee";
  }

  await usersCollection.insertOne(userData);
}

async function findUserByCredentials(employee_id, password) {
  const db = await connection();
  const usersCollection = db.collection("users");
  return await usersCollection.findOne({ employee_id, password });
}

async function findUserById(userId) {
  const db = await connection();
  const usersCollection = db.collection("users");
  return await usersCollection.findOne({ _id: new ObjectId(userId) });
}

async function updateUser(userId, updateData) {
  const db = await connection();
  const usersCollection = db.collection("users");

  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateData }
  );
}

module.exports = {
  registerUser,
  findUserByCredentials,
  findUserById,
  updateUser,
};
