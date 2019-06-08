const express = require('express');
const mongoose = require('mongoose');
const app = express();





app.use(express.json());
app.use(express.urlencoded({extended : false}));

// Routes
const users = require('./routes/user');
const chat = require('./routes/chat');

const config = require('./config/keys');

mongoose.connect(config.mongoDB,{useNewUrlParser : true},(err)=>{
    if(!err){
        console.log("Mongo db connected");
    }
})



app.use("/api/user",users);
app.use("/api/chat",chat);


const PORT = 5000 || process.env.PORT;

app.listen(PORT,(req,res) => {
    console.log(`Server listening on port ${PORT}`);
});