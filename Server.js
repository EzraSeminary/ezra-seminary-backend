const express = require("express");
const connectDb = require("./config/connectDb");
const dotenv = require("dotenv").config();
const cors = require("cors");
// const corsOptions = require('./config/corsOptions')
const courseController = require("./controllers/courseController");
// const devotionController = require("./controllers/devotionController");

const app = express();

connectDb();

app.use(cors());

// app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(
//   cors({
//     origin: ["http://localhost:5173"],
//     methods: ["POST", "GET", "PUT", "DELETE"],
//     credentials: true,
//   })
// );


app.use("/course", courseController);
app.use('/devotion', require('./routes/devotionRoutes'))



app.use("/images", express.static("public/images"));

app.listen(5000, () => {
  console.log("server has been started successfully!")
  console.log('Server is running on port 5000');
});
