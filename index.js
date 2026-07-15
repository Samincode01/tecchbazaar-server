const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
} = require("mongodb");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let devicesCollection;

// =======================
// Connect Database
// =======================

async function connectDB() {
  try {
    await client.connect();

    console.log("✅ MongoDB Connected");

    const db = client.db("techbazaarDB");

    devicesCollection =
      db.collection("devices");

    console.log("✅ Database Ready");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

connectDB();

// =======================
// Routes
// =======================

app.get("/", (req, res) => {
  res.send({
    success: true,
    message: "🚀 TechBazaar Server Running",
  });
});

// Get All Devices

app.get("/devices", async (req, res) => {
  try {
    const devices =
      await devicesCollection
        .find()
        .toArray();

    res.send(devices);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to load devices",
    });
  }
});

// =======================
// Server
// =======================

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});