// app.js

const express = require("express");

const app = express();
const connectDb = require("./config/connectDb");
const dotenv = require("dotenv").config();
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
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
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: "50mb" }));

// Wait for DB before listening
connectDb()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server is listening on port ${process.env.PORT}`);
    });
  })
  .catch(() => {
    // connectDb logs and exits
  });

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
