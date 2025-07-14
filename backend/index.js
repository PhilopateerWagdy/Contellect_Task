// Load .env variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const contactRouter = require("./routes/Contact");
const authRouter = require("./routes/Auth");
const authMiddleware = require("./middlewares/authMW");

const app = express();
const server = http.createServer(app);

// ------------------------------------------------------
// Socket.io setup for real-time contact locking
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on("disconnect", () => console.log(`User disconnected: ${socket.id}`));
});

// Make io globally accessible
app.set("io", io);

// ------------------------------------------------------
// Middleware
app.use(express.json());

// Enable CORS for all routes
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// ------------------------------------------------------
// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to Database"))
  .catch((err) => console.error("Failed to connect to Database", err));

// ------------------------------------------------------
// Routes

app.get("/", (req, res) => {
  res.status(200).json("Hello from my Server");
});

// PUBLIC ROUTES
app.use("/api/users", authRouter);

// PROTECTED ROUTES
app.use("/api", authMiddleware);
app.use("/api/contacts", contactRouter);

// ------------------------------------------------------
// Start Server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
