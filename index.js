const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.json());

const verifyJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized Access!" })
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Forbidden access" });
        }
        req.decoded = decoded;
    })
    next();
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1zlsf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const database = client.db("stockpile");
        const inventoryCollection = database.collection("products");
        const emailCollection = database.collection('newsletterEmails');

        //JWT token
        app.post("/gettoken", async (req, res) => {
            const user = req.body;
            const jwtToken = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "1d" });
            res.send({ jwtToken });
        })

        app.get("/inventories", async (req, res) => {
            const page = parseInt(req.query?.page) || 0;
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = inventoryCollection.find(query);
            let inventories;
            if (page || size) {
                inventories = await cursor.skip(size * page).limit(size).toArray();
            }
            else {
                inventories = await cursor.toArray();
            }
            res.send(inventories);
        });

        app.get("/myitem", verifyJwt, async (req, res) => {
            const page = parseInt(req.query?.page) || 0;
            const size = parseInt(req.query.size);
            const email = req.query?.email;
            const decodedEmail = req?.decoded?.email;
            if (email === decodedEmail) {
                const query = { userEmail: email };
                const cursor = inventoryCollection.find(query);
                let myitems;
                if (page || size) {
                    myitems = await cursor.skip(size * page).limit(size).toArray();
                }
                else {
                    myitems = await cursor.toArray();
                }
                res.send(myitems);
            }
            else {
                res.status(403).send({ message: "Forbidden Access" });
            }

        });

        app.get('/inventoryCount', async (req, res) => {
            const count = await inventoryCollection.estimatedDocumentCount();
            res.send({ count });
        });

        app.get('/myitemCount', async (req, res) => {
            const email = req.query.email;

            const query = { userEmail: email };
            const count = await inventoryCollection.countDocuments(query);
            res.send({ count });
        });

        app.get("/inventory/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await inventoryCollection.findOne(query);
            res.send(result);
        });

        app.put("/updatequantity/:id", async (req, res) => {
            const incAmount = parseInt(req.query.incAmount);
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const newQuantity = {
                $inc: {
                    quantity: incAmount,
                },
            };
            const result = await inventoryCollection.updateOne(filter, newQuantity)
            res.send(result);
        });

        app.post("/additem", async (req, res) => {
            const item = req.body;
            const result = await inventoryCollection.insertOne(item);
            res.send(result);
        })

        app.delete("/deleteinventory/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await inventoryCollection.deleteOne(query);
            res.send(result);
        });

        app.post("/newsletterEmails", async (req, res) => {
            const email = req.body;
            const result = await emailCollection.insertOne(email);
            res.send(result);
        });

    } finally {

    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("server running");
})

app.listen(port, () => {
    console.log("listening to port ", port);
})