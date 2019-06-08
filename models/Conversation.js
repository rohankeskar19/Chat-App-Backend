const mongoose = require('mongoose');

const Conversation = new mongoose.Schema({
    Users : [
        {
            user_id : {
                type : String,
                required : true
            },
            username : {
                type : String,
                required : true
            },
            name : {
                type : String,
                required : true
            },
            profileUrl : {
                type : String,
                required : true
            }
        }
    ],
    createdAt : {
        type : Date,
        default : Date.now,
        required : true
    }

});


module.exports = mongoose.model("Conversation",Conversation);