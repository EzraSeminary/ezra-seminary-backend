// app.js

const express = require("express");
const app = express();
const connectDb = require("./config/connectDb");
const dotenv = require("dotenv").config();
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const devotionRoutes = require("./routes/devotionRoutes");
const userRoutes = require("./routes/userRoutes");
const path = require("path");
const courseController = require("./controllers/courseController");
const quizController = require("./controllers/quizController");
const requireAuth = require("./middleware/requireAuth");

app.use(express.json({ limit: "50mb" }));

connectDb();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use("/", require("./routes/root"));
// app.use((req, res, next) => {
//   console.log(req.path, req.method);
//   next();
// });
// All routes are authenticated by default
app.use("/users", userRoutes);
app.use("/devotion", devotionRoutes);
app.use("/course", courseController);
app.use("/quiz", quizController);

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

// listen for requests
app.listen(process.env.PORT, () => {
  console.log("connected to the database");
  console.log(`Server is listening on port ${process.env.PORT}`);
});
