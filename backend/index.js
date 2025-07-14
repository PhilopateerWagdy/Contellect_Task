// Load .env variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");

const contactRouter = require("./routes/Contact");
const authRouter = require("./routes/Auth");
const authMiddleware = require("./middlewares/authMW");

// built-in middlewares
app.use(express.json());
//Enable CORS for all routes
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// ------------------------------------------------------
// Databse Connection

// 1- connect to db
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to Database...");
  })
  .catch((err) => {
    console.log("Failed to connect to Database.");
  });

// ------------------------------------------------------
app.get("/", function (req, res) {
  try {
    res.status(200).json("Hello from my Server");
  } catch (err) {
    console.log(err);
  }
});

// PUBLIC ROUTES
app.use("/api/users", authRouter);
// Protect all other routes
app.use("/api", authMiddleware);
// PROTECTED ROUTES
app.use("/api/contacts", contactRouter);

// ------------------------------------------------------
// listen to users requests

app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}....`);
});
