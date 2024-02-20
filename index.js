const express = require("express");
const apiRouter = require("./apiRouter");
const app = express();
var bodyParser = require('body-parser')
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded());
app.use(express.json());
const dbObj = require("./db");

app.get("/",function(req,res){

  return res.status(200).send({message:"Welcome............"});
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use("/api/", apiRouter);


module.exports = app;
