const express = require("express");
const { DateTime } = require("luxon");
const app = express();
require("dotenv").config();
const cors = require("cors");

const port = process.env.PORT || 5001;

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://delta-translator-ac8d6.web.app",
  ],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// delta-translator
//hzWSRlIt0p80K7sK+

// backend link :   https://translator-delta-server.vercel.app/

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    await client.connect();

    const deltaTranslateDB = client.db("deltaTranslateDB");
    const translationHistoryCollection = deltaTranslateDB.collection(
      "translationHistoryCollection"
    );
    const favoriteHistoryCollection = client
      .db("deltaTranslateDB")
      .collection("favoriteHistory");
    const userFeedbackCollection = deltaTranslateDB.collection(
      "userFeedbackCollection"
    );
    const usersCollection = client.db("deltaTranslateDB").collection("users");
    const profileCollection = client
      .db("deltaTranslateDB")
      .collection("profile");
    /****inbox api collections*****/
    const inboxCollection = client.db("deltaTranslateDB").collection("inbox");
    // =========== User Profile routes ========== \\
    app.post("/profile", async (req, res) => {
      const profile = req.body;
      const result = await profileCollection.insertOne(profile);
      res.send(result);
    });

    app.get("/profile", async (req, res) => {
      const result = await profileCollection.find().toArray();
      res.send(result);
    });

    app.get("/profile/api/:email", async (req, res) => {
      const email = req.params.email;
      const result = await profileCollection.findOne({ email });
      res.send(result);
    });

    app.get("/translation-history", async (req, res) => {
      const result = await translationHistoryCollection.find().toArray();
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/translation-history/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };

      const result = await translationHistoryCollection.findOne(query);

      // const result = userHistory.translationHistory;
      res.send(result);
    });

    app.put("/translation-history/:email", async (req, res) => {
      const email = req.params.email;
      const updatedTranslationHistory = req.body;

      // console.log("hello");

      const filter = { userEmail: email };
      const existingUser = await translationHistoryCollection.findOne(filter);

      // console.log(existingUser);

      if (existingUser) {
        let tempHistory = [...existingUser.translationHistory];
        tempHistory.unshift(updatedTranslationHistory.translationHistory[0]);

        if (updatedTranslationHistory.translationHistory.length > 50) {
          tempHistory = tempHistory.slice(0, 20);
        }

        // console.log(tempHistory);

        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            translationHistory: tempHistory,
          },
        };
        const updateResult = await translationHistoryCollection.updateOne(
          filter,
          updatedDoc,
          options
        );
        res.send(updateResult);
      } else {
        const insertResult = await translationHistoryCollection.insertOne(
          updatedTranslationHistory
        );
        res.send(insertResult);
      }
    });

    app.delete("/translation-history/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await translationHistoryCollection.deleteOne(query);
      res.send(result);
    });

    // favorite History API

    app.get("/favoriteHistory", async (req, res) => {
      const email = req.query.userEmail;
      const query = { userEmail: email };
      const result = await favoriteHistoryCollection.findOne(query);
      res.send(result);
    });

    app.put("/favoriteHistory/:status", async (req, res) => {
      try {
        const FavHistory = req.body;
        const status = req.params.status;
        // console.log(FavHistory);
        const filter = { userEmail: FavHistory.userEmail };
        const existingUser = await favoriteHistoryCollection.findOne(filter);
        // console.log(existingUser);

        if (existingUser) {
          let latestFavH = [...existingUser.FavHistory];

          if (status === "add") {
            latestFavH.unshift(FavHistory.FavHistory[0]);

            // console.log(latestFavH);

            const updatedDoc = {
              $set: {
                FavHistory: latestFavH,
              },
            };

            const updateResult = await favoriteHistoryCollection.updateOne(
              filter,
              updatedDoc
            );
            res.send(updateResult);
          } else {
            const deletedHistory = latestFavH.filter(
              (item) => item.id !== FavHistory.FavHistory[0].id
            );

            const updatedDoc = {
              $set: {
                FavHistory: deletedHistory,
              },
            };

            const updateResult = await favoriteHistoryCollection.updateOne(
              filter,
              updatedDoc
            );
            res.send(updateResult);
          }
        } else {
          const result = await favoriteHistoryCollection.insertOne(FavHistory);
          res.send(result);
        }
      } catch {
        (error) => console.log(error);
      }
    });

    // users api
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        //inserted email if user does not exists:
        //you can do this many ways (1.email unique , 2.upsert , 3.simple checking)
        const query = { email: user.email };
        const existingUser = await usersCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: "user already exist", insertedId: null });
        }
        const result = await usersCollection.insertOne(user);
        res.send(result);
      } catch {
        (error) => console.log(error);
      }
    });

    // It's route for user profile
    app.get("/users/api/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      // console.log("=========>Email", email);
      const result = await usersCollection.findOne(query);
      // console.log("=========>Result", result);
      res.send(result);
    });

    // feedback Api
    app.get("/user-feedback", async (req, res) => {
      const result = await userFeedbackCollection.find().toArray();
      res.send(result);
    });

    app.put("/user-feedback/:email", async (req, res) => {
      const email = req.params.email;
      const updatedFeedback = req.body;
      // console.log("hello");
      const filter = { userEmail: email };
      const existingUser = await userFeedbackCollection.findOne(filter);

      // console.log(existingUser);

      if (existingUser) {
        let tempFeedback = [...existingUser.feedbackMessage];
        tempFeedback.unshift(updatedFeedback.feedbackMessage[0]);
        let tempCount = existingUser.count;

        console.log(tempFeedback);
        if (tempFeedback.length > 20) {
          tempFeedback = tempFeedback.slice(0, 20);
        }

        // console.log(tempHistory);

        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            feedbackMessage: tempFeedback,
            count: tempCount + 1,
          },
        };
        const updateResult = await userFeedbackCollection.updateOne(
          filter,
          updatedDoc,
          options
        );
        res.send(updateResult);
      } else {
        updatedFeedback.count = 1;
        const insertResult = await userFeedbackCollection.insertOne(
          updatedFeedback
        );
        res.send(insertResult);
      }
    });

    /********Inbox api*******/
    app.post("/inbox", async (req, res) => {
      const inboxInfo = req.body;
      // inboxInfo.date = DateTime.now().toLocaleString(DateTime.DATETIME_FULL);
      inboxInfo.date = DateTime.now().toLocaleString({
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const result = await inboxCollection.insertOne(inboxInfo);
      res.send(result);
    });
    app.get("/inbox", async (req, res) => {
      const result = await inboxCollection.find().toArray();
      res.send(result);
    });
    app.get("/inboxDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await inboxCollection.findOne(query);
      res.send(result);
    });
    /********Inbox api*******/
    // Send a ping to confirm a successful connection
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
