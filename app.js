const dialogflow = require('@google-cloud/dialogflow');
const { WebhookClient, Suggestion } = require('dialogflow-fulfillment');
const express = require("express")
const nodemailer = require("nodemailer");
const cors = require("cors");
const { MongoClient } = require("mongodb"); // <-- Add this line

// MongoDB connection URI and client setup
const uri = process.env.MONGO_URI; // Change this to your MongoDB URI if needed
const client = new MongoClient(uri);

let db;
client.connect()
  .then(() => {
    db = client.db("dialogflowDB"); // Use your DB name
    console.log("Connected to MongoDB");
  })
  .catch(err => {
    console.error("Failed to connect to MongoDB", err);
  });

const app = express();
app.use(express.json())
app.use(cors());

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/webhook", async (req, res) => {
  var id = (res.req.body.session).substr(43);
  console.log(id)
  const agent = new WebhookClient({ request: req, response: res });

  function hi(agent) {
    console.log(`intent  =>  hi`);
    agent.add("Hi from server")
  }

  function lead(agent) {

    const { number, person, email } = agent.parameters;
    agent.add(`Lead added successfully ${number} ${person} ${email}`)

    // Save to MongoDB
    if (db) {
      db.collection("leads").insertOne({ number, person, email, timestamp: new Date() })
        .then(result => {
          console.log("Lead saved to MongoDB", result.insertedId);
        })
        .catch(err => {
          console.error("Error saving lead to MongoDB", err);
        });
    } else {
      console.error("No MongoDB connection");
    }

  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', hi);
  intentMap.set('lead', lead);
  agent.handleRequest(intentMap);
})

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});