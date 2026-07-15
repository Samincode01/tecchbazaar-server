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

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let devicesCollection;
let cartCollection;

async function getDB() {
  if (!devicesCollection || !cartCollection) {
    await client.connect();

    console.log("✅ MongoDB Connected");

    const db = client.db("techbazaarDB");

    devicesCollection = db.collection("devices");
    cartCollection = db.collection("cart");
  }

  return {
    devicesCollection,
    cartCollection,
  };
}

app.get("/", (req, res) => {
  res.send({
    success: true,
    message: "🚀 TechBazaar Server Running",
  });
});

// ======================
// Devices
// ======================

app.get("/devices", async (req, res) => {
  try {
    const { devicesCollection } =
      await getDB();

    const limit = Number(req.query.limit) || 0;

    let query = devicesCollection.find();

    if (limit > 0) {
      query = query.limit(limit);
    }

    const devices = await query.toArray();

    res.send(devices);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: error.message,
    });
  }
});

app.get("/devices/:id", async (req, res) => {
  try {
    const { devicesCollection } =
      await getDB();

    const device =
      await devicesCollection.findOne({
        _id: new ObjectId(req.params.id),
      });

    if (!device) {
      return res.status(404).send({
        message: "Device not found",
      });
    }

    res.send(device);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: error.message,
    });
  }
});
// ======================
// Cart
// ======================

app.post("/cart", async (req, res) => {
  try {
    const { cartCollection } =
      await getDB();

    const {
      userEmail,
      deviceId,
      quantity,
    } = req.body;

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
        {
          _id: existingItem._id,
        },
        {
          $inc: {
            quantity: quantity || 1,
          },
        }
      );

      return res.send({
        success: true,
        message:
          "Cart updated successfully.",
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
    console.error(error);

    res.status(500).send({
      message: error.message,
    });
  }
});

app.get("/cart", async (req, res) => {
  try {
    const {
      devicesCollection,
      cartCollection,
    } = await getDB();

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
            _id: new ObjectId(
              item.deviceId
            ),
          });

        return {
          ...item,
          device,
        };
      })
    );

    res.send(result);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: error.message,
    });
  }
});

app.patch("/cart/:id", async (req, res) => {
  try {
    const { cartCollection } =
      await getDB();

    const { quantity } = req.body;

    const result =
      await cartCollection.updateOne(
        {
          _id: new ObjectId(
            req.params.id
          ),
        },
        {
          $set: {
            quantity,
          },
        }
      );

    res.send(result);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: error.message,
    });
  }
});

app.delete("/cart/:id", async (req, res) => {
  try {
    const { cartCollection } =
      await getDB();

    const result =
      await cartCollection.deleteOne({
        _id: new ObjectId(
          req.params.id
        ),
      });

    res.send(result);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: error.message,
    });
  }
});

// ======================
// Export for Vercel
// ======================

module.exports = app;