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
let cartCollection;
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
    cartCollection = db.collection("cart");
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


app.get("/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const device = await devicesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!device) {
      return res.status(404).send({
        message: "Device not found",
      });
    }

    res.send(device);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to load device",
    });
  }
});

//add to cart
app.post("/cart", async (req, res) => {
  try {
    const { userEmail, deviceId, quantity } = req.body;

    if (!userEmail || !deviceId) {
      return res.status(400).send({
        message: "Missing required fields.",
      });
    }

    const existingItem =
      await cartCollection.findOne({
        userEmail,
        deviceId,
      });

    if (existingItem) {
      await cartCollection.updateOne(
        { _id: existingItem._id },
        {
          $inc: {
            quantity: quantity || 1,
          },
        }
      );

      return res.send({
        success: true,
        message: "Cart updated successfully.",
      });
    }

    const result =
      await cartCollection.insertOne({
        userEmail,
        deviceId,
        quantity: quantity || 1,
        createdAt: new Date(),
      });

    res.send({
      success: true,
      insertedId: result.insertedId,
      message: "Added to cart.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to add to cart.",
    });
  }
});

//get cart
app.get("/cart", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send({
        message: "Email is required.",
      });
    }

    const cartItems =
      await cartCollection
        .find({
          userEmail: email,
        })
        .toArray();

    const result = await Promise.all(
      cartItems.map(async (item) => {
        const device =
          await devicesCollection.findOne({
            _id: new ObjectId(item.deviceId),
          });

        return {
          ...item,
          device,
        };
      })
    );

    res.send(result);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to load cart.",
    });
  }
});

//delete cart
app.delete("/cart/:id", async (req, res) => {
  try {
    const result =
      await cartCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });

    res.send(result);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to delete item.",
    });
  }
});

//update quantity
app.patch("/cart/:id", async (req, res) => {
  try {
    const { quantity } = req.body;

    const result =
      await cartCollection.updateOne(
        {
          _id: new ObjectId(req.params.id),
        },
        {
          $set: {
            quantity,
          },
        }
      );

    res.send(result);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to update quantity.",
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