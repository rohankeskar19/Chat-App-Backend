const mongoose = require('mongoose');


const User = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    username : {
        type : String,
        required : true
    },
    profileUrl : {
        type : String,
        required: true
    },
    bio : {
        type : String
    },
    freinds : [
        {
            user_id : {
                type : String,
                required : true
            },
            username : {
                type : String,
                required : true
            },
            profileUrl : {
                type : String,
                required : true
            },
            name : {
                type : String,
                required : true
            }
        }
    ]
    ,
    createdAt : {
        type : Date,
        default : Date.now
    }
});


module.exports = mongoose.model("User",User);