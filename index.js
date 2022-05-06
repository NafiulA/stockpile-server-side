const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1zlsf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const database = client.db("stockpile");
        const inventoryCollection = database.collection("products");
        const emailCollection = database.collection('newsletterEmails');

        app.get("/products", async (req, res) => {
            const page = parseInt(req.query?.page) || 0;
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = inventoryCollection.find(query);
            let products;
            if (page || size) {
                products = await cursor.skip(size * page).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }
            res.send(products);
        });

        app.get('/inventoryCount', async (req, res) => {
            const count = await inventoryCollection.estimatedDocumentCount();
            res.send({ count });
        });

        app.get("/inventory/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await inventoryCollection.findOne(query);
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