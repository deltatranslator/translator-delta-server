const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");

const port = process.env.PORT || 5001;

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174',],
  credentials: true,
}
app.use(cors(corsOptions));
app.use(express.json());

// delta-translator
//hzWSRlIt0p80K7sK+

// backend link :   https://translator-delta-server.vercel.app/nodem

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://delta-translator:hzWSRlIt0p80K7sK@cluster0.gspqc3c.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const usersCollection = client.db('deltaTranslateDB').collection('users')


    app.post('/users', async (req, res) => {
      try {
          const user = req.body;
          //inserted email if user does not exists: 
          //you can do this many ways (1.email unique , 2.upsert , 3.simple checking)
          const query = { email: user.email }
          const existingUser = await usersCollection.findOne(query)
          if (existingUser) {
              return res.send({ message: 'user already exist', insertedId: null })
          }
          const result = await usersCollection.insertOne(user);
          res.send(result)
      } catch {
          error => console.log(error)
      }

  })

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("our delta translator is running fluently");
});
app.listen(port, (req, res) => {
  console.log(`Our translator is running on ${port}`);
});
