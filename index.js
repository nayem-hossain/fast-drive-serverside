const express = require("express");
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
const SSLCommerzPayment = require("sslcommerz");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Database Connection URI
const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@fastdrivecluster.cos56.mongodb.net/fastDriveDatabase?retryWrites=true&w=majority`;
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

async function run() {
  try {
    await client.connect();
    console.log("connected to FastDrive database successfully");

    const database = client.db("fastDriveDatabase");
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");
    const reviewsCollection = database.collection("reviews");
    const usersCollection = database.collection("users");
    const orderSuccessCollection = database.collection("successfull_orders");

    // Initialize Payment API
    app.post("/init", async (req, res) => {
      console.log(req.body);

      const data = {
        total_amount: req.body.price,
        currency: "USD",
        payment_status: "pending",
        tran_id: uuidv4(),
        success_url: "http://localhost:5000/success",
        fail_url: "http://localhost:5000/fail",
        cancel_url: "http://localhost:5000/cancel",
        ipn_url: "http://localhost:5000/ipn",
        shipping_method: "Courier",
        product_id: req.body.carID,
        product_name: req.body.carName,
        product_image: req.body.carImage,
        product_category: "CAR",
        product_profile: "general",
        cus_name: req.body.FullName,
        cus_email: req.body.email,
        cus_phone: req.body.phone,
        cus_fax: req.body.phone,
        cus_country: "Bangladesh",
        cus_postcode: "1000",
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        ship_name: req.body.FullName,
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
        multi_card_name: "mastercard",
        value_a: "ref001_A",
        value_b: "ref002_B",
        value_c: "ref003_C",
        value_d: "ref004_D",
      };
      const order = await ordersCollection.insertOne(data);

      const sslcommer = new SSLCommerzPayment(
        process.env.STORE_ID,
        process.env.STORE_PASSWORD,
        false
      ); //true for live default false for sandbox
      sslcommer.init(data).then((data) => {
        //process the response that got from sslcommerz
        //https://developer.sslcommerz.com/doc/v4/#returned-parameters
        console.log(data);
        if (data.GatewayPageURL) {
          res.json(data.GatewayPageURL);
        } else {
          return req.status(400).json({
            message: "payment session faild",
          });
        }
      });
    });
    app.post("/success", async (req, res) => {
      console.log(req);
      // res.status(200).json(req.body);
      res
        .status(200)
        .redirect(`https://fast-drive-nayem.netlify.app/order_success`);
    });
    // GET ALL PRODUCTS API
    app.get("/products", async (req, res) => {
      const AllProducts = productsCollection.find({});
      const Products = await AllProducts.toArray();
      res.send(Products);
    });

    // GET SINGLE PRODUCTS API
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      console.log("getting specific products", id);
      const query = { _id: ObjectId(id) };
      const product = await productsCollection.findOne(query);
      res.json(product);
    });

    // POST/ADD A NEW PRODUCTS API
    app.post("/products", async (req, res) => {
      const insertItem = req.body;
      console.log("hitted the post products API", insertItem);
      const result = await productsCollection.insertOne(insertItem);
      console.log(result);
      res.json(result);
    });

    // DELETE A PRODUCTS API
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      console.log("deleted a product with id", result);
      res.json(result);
    });

    // GET ORDER API
    app.get("/orders", async (req, res) => {
      const cursor = ordersCollection.find({});
      const result = await cursor.toArray();
      res.send(result);
    });

    // POST ORDER API
    /* app.post("/orders", async (req, res) => {
      const order = req.body;
      console.log("hitted the post orders API", order);
      const result = await ordersCollection.insertOne(order);
      console.log(result);
      res.json(result);
    }); */

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

    // POST/ADD A REVIEW API
    app.post("/reviews", async (req, res) => {
      const insertReview = req.body;
      console.log("hitted the post reviews API", insertReview);
      const result = await reviewsCollection.insertOne(insertReview);
      console.log(result);
      res.json(result);
    });

    // GET ALL USERS REVIEW API
    app.get("/reviews", async (req, res) => {
      const AllReviews = reviewsCollection.find({});
      const Products = await AllReviews.toArray();
      res.send(Products);
    });
    // POST/ADD USERS API
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log("hitted the post users API", user);
      const result = await usersCollection.insertOne(user);
      console.log("Added a new user with id", result);
      res.json(result);
    });

    // POST/UPDATE A USER API
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log("updated/added a user with id", result);
      res.json(result);
    });

    // UPDATE A USER TO AN ADMIN
    app.put("/users/admin", async (req, res) => {
      const adminUser = req.body;
      const filter = { email: adminUser.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      console.log("updated a user to admin with id", result);
      res.json(result);
    });

    // CHECK ADMIN EMAIL API
    app.get("/users/:email", async (req, res) => {
      const userEmail = req.params.email;
      console.log("getting a specific user", userEmail);
      const query = { email: userEmail };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
