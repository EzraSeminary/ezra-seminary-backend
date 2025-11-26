// app.js

const express = require("express");

const app = express();
const connectDb = require("./config/connectDb");
const dotenv = require("dotenv").config();

// Validate critical environment variables
if (!process.env.SECRET) {
  console.warn(
    "WARNING: SECRET environment variable is not set. Session may not work properly."
  );
}
if (!process.env.MONGODB_KEY) {
  console.warn(
    "WARNING: MONGODB_KEY environment variable is not set. Database connection will fail."
  );
}

const devotionRoutes = require("./routes/devotionRoutes");
const devotionPlanRoutes = require("./routes/devotionPlanRoutes");
const userRoutes = require("./routes/userRoutes");
const sslLinkRoutes = require("./routes/sslLinkRoutes");
const path = require("path");
const courseController = require("./controllers/courseController");
const quizController = require("./controllers/quizController");
// const userController = require("./controllers/usersController");
const analyticsRoutes = require("./routes/analyticsRoutes");
// const requireAuth = require("./middleware/requireAuth");
const passport = require("./config/passport");
const session = require("express-session");

app.use(
  session({
    secret: process.env.SECRET || "default-secret-change-in-production",
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// CORS must be applied BEFORE routes
// Use a simple, reliable CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow all origins for now to fix the issue
  // You can restrict this later by checking against allowedOrigins
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Start server - don't wait for DB connection
// This ensures the server is always available even if DB is slow to connect
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Connect to database (non-blocking)
connectDb()
  .then(() => {
    console.log("Database connection established");
  })
  .catch((error) => {
    console.error(
      "Database connection failed, but server is still running:",
      error.message
    );
    // Don't exit - let the server continue running
    // Routes will handle database errors gracefully
  });

app.use("/images", express.static(path.join(__dirname, "public/images")));
app.get("/download/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "public", "images", imageName);

  res.download(imagePath, (err) => {
    if (err) {
      console.error("Error downloading image:", err);
      res.status(500).send("Error downloading image");
    }
  });
});

app.use("/", require("./routes/root"));
// All routes are authenticated by default
app.use("/users", userRoutes);
app.use("/devotion", devotionRoutes);
app.use("/devotionPlan", devotionPlanRoutes);
app.use("/course", courseController);
app.use("/quiz", quizController);
app.use("/analytics", analyticsRoutes);
app.use("/sslLinks", sslLinkRoutes);
app.use("/migration", require("./routes/migrationRoutes"));

// app.use("/images", express.static("public/images"));
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

// listen handled after DB connection above

module.exports = app;
