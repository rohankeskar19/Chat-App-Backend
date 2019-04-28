const express = require('express');
const mongoose = require('mongoose');
const app = express();


// Routes
const users = require('./routes/user');

const config = require('./config/keys');

mongoose.connect(config.mongoDB,{useNewUrlParser : true},(err)=>{
    if(!err){
        console.log("Mongo db connected");
    }
})

app.use(express.urlencoded({ extended : false}));
app.use(express.json());


app.use("/api/user",users);


const PORT = 5000 || process.env.PORT;

app.listen(PORT,(req,res) => {
    console.log(`Server listening on ${PORT}`);
});