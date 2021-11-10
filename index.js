const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

//Database Connection URI
const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@fastdrivecluster.cos56.mongodb.net/FastDriveDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log(uri);

app.get("/", (req, res) => {
  res.send("Running fastDrive Server");
});

app.listen(port, () => {
  console.log(`fastDrive Server listening at http://localhost:${port}`);
});

/* client.connect((err) => {
  const collection = client.db(process.env.DB_NAME).collection("orders");
  // perform actions on the collection object
  client.close();
}); */

async function run() {
  try {
    await client.connect();
    console.log("connected to database");

    const database = client.db("FastDriveDatabase");
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");

    // GET ALL SERVICES API
    app.get("/products", async (req, res) => {
      const allService = servicesCollection.find({});
      const services = await allService.toArray();
      res.send(services);
    });

    // POST ADD A NEW SERVICE API
    app.post("/products", async (req, res) => {
      const insertItem = req.body;
      console.log("hitted the post products API", insertItem);
      const result = await servicesCollection.insertOne(insertItem);
      console.log(result);
      res.json(result);
    });

    // GET SINGLE SERVICES API
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      console.log("getting specific products", id);
      const query = { _id: ObjectId(id) };
      const service = await servicesCollection.findOne(query);
      res.json(service);
    });

    // GET ORDER API
    app.get("/orders", async (req, res) => {
      const cursor = ordersCollection.find({});
      const result = await cursor.toArray();
      res.send(result);
    });

    // POST ORDER API
    app.post("/orders", async (req, res) => {
      const order = req.body;
      console.log("hitted the post orders API", order);
      const result = await ordersCollection.insertOne(order);
      console.log(result);
      res.json(result);
    });

    // UPDATE A DOCUMENT
    app.put("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await ordersCollection.updateOne(filter, updateDoc);
      console.log("updating user with id", result);
      res.json(result);
    });

    // DELETE ORDER API
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      console.log("deleting user with id", result);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
