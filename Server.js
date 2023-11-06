// app.js

const express = require("express");
const connectDb = require("./config/connectDb");
const dotenv = require("dotenv").config();
const cors = require("cors");
const devotionRoutes = require('./routes/devotionRoutes');

const app = express();

connectDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/devotion', devotionRoutes);

app.use("/images", express.static("public/images"));

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});

