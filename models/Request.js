const mongoose = require('mongoose');


const Request = new mongoose.Schema({
    from : {
        id : {
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
        }
    },
    to : {
        id : {
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
        }
    }



});


module.exports = mongoose.model("Request",Request);