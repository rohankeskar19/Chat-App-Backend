const mongoose = require('mongoose');

const Message = new mongoose.Schema({
    conversationID : {
        type : String,
        required : true
    },
    fromId : {
        type : String,
        required : true
    },
    toId : {
        type : String,
        required : true
    },
    content : {
        type : String,
        required : true
    },
    createdAt : {
        type : Date,
        default : Date.now,
        required : true
    }
});


module.exports = mongoose.model("Message",Message);