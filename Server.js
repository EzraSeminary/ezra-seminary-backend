// app.js

const express = require("express");
const app = express();
const connectDb = require("./config/connectDb");
const dotenv = require("dotenv").config();
const cors = require("cors");
const devotionRoutes = require('./routes/devotionRoutes');
const path = require('path');
const courseController = require("./controllers/courseController");
const quizController = require("./controllers/quizController");

connectDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/', require('./routes/root'))
app.use('/devotion', devotionRoutes);
app.use("/course", courseController);
app.use("/quiz", quizController);

app.use("/images", express.static("public/images"));

app.all('*', (req, res) => {
    res.status(404)
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.json({ message: '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
})

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});

