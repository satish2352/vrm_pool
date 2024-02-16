const express = require("express");
const apiRouter = require("./apiRouter");
const app = express();

app.use(express.json());
const dbObj = require("./db");


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use("/api/", apiRouter);


module.exports = app;
