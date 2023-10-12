const express = require("express");
const connectDb = require("./config/connectDb");
const dotenv = require("dotenv").config();
const cors = require("cors");
const courseController = require("./controllers/courseController");

const app = express();
connectDb();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use("/course", courseController);

app.listen(5000, () => console.log("server has been started successfully!"));
