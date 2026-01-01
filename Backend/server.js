const app = require("./app");
const dotenv = require("dotenv"); // Dotenv sabse upar hona chahiye taaki env load ho sake
const connectDatabase = require("./config/database");
const cloudinary = require("cloudinary");
const http = require("http");
const { Server } = require("socket.io");

// --- Config (Sabse pehle load karo) ---
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config();
}

// --- Uncaught Exception Handle ---
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Uncaught Exception`);
  process.exit(1);
});

// --- Database ---
connectDatabase();

// --- Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- 🔥 SOCKET.IO & SERVER SETUP ---
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // --- UPDATED HERE ---
    origin: [process.env.CLIENT_URL],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`New Socket Connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log("Socket Disconnected");
  });
});

app.set("io", io);

// --- Start Server ---
const PORT = process.env.PORT || 4000;

const serverInstance = server.listen(PORT, () => {
  console.log(`Server is working on http://localhost:${PORT}`);
});

// --- Unhandled Promise Rejection ---
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);
  serverInstance.close(() => {
    process.exit(1);
  });
});