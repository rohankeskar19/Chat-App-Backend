const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/keys');
const amqp = require('amqplib/callback_api');
const multiparty = require('multiparty');

const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');


const validator = require('../validators/user');
const Authentication = require('../middlewares/Authentication');

const User = require("../models/User");
const Request = require("../models/Request");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");   


const form = new multiparty.Form();

aws.config.update({
    secretAccessKey : config.secretAccesKey,
    accessKeyId : config.accesKeyId,
    region : config.region
});

var S3 = new aws.S3();

const fileFilter = (req,file,cb) => {
    if(file.mimetype == 'image/jpeg' || file.mimetype == 'image/png'){
        cb(null,true);
    }
    else{
        cb(new Error('Invalid Mime Type, only JPEG and PNG'), false);
    }
}

var upload = multer({
    fileFilter : fileFilter,
    storage : multerS3({
        s3 : S3,
        bucket : 'chat-application1',
        acl : 'public-read',
        metadata : function(req,file,cb){
            cb(null,{fieldName : 'testing'});
        },
        key : function(req,file,cb){
            cb(null, Date.now().toString())
        }
    })
});

const singleUpload = upload.single('image');

router.post('/profile-upload',Authentication.isAuthenticated,(req,res) => {
    var bio = "";
    var id = "";
    form.parse(req,(err,fields,files) => {
        if(fields.bio.toString() && fields.id.toString()){
            console.log(fields.bio.toString(),fields.id.toString());
            bio = fields.bio.toString();
            id = fields.id.toString();
        }
        else{
            console.log("error occured");
            return res.status(400).json({error : "Invalid request"});
        }
        
    })

    singleUpload(req,res,(err) => {
            
        if(err){
           return res.status(422).json({error : "Invalid file only JPEG and PNG are allowed"});
        }
        else{
            console.log(req.file.location)
            User.findById(id,(err,data) => {
                if(!err){
                    if(data){
                        
                            data.profileUrl = req.file.location;
                            data.bio = bio;
                            data.save((err,data) => {
                                if(!err){
                                    if(data){
                                        var user = {
                                            id : data._id,
                                            name : data.name,
                                            email : data.email,
                                            username : data.username,
                                            profileUrl : data.profileUrl,
                                            bio : data.bio
                                        }
                                        var token = jwt.sign({"user" : user}, config.secret, {
                                            expiresIn : config.tokenExpiry
                                        });
                                        token = "Bearer " + token;
                                        return res.json({token});
                                    }
                                    else{
                                        console.log("Ola");
                                        return res.status(400).json({error : "Invalid request"});
                                    }
                                }
                                else{
                                    return res.status(500).json({error : "Failed to process request try again"});
                                }
                            })
                    }
                    else{
                        console.log("Mola");
                        res.status(400).json({error : "Invalid request"});
                    }
                }
                else{
                    return res.status(500).json({error : "Failed to process request try again"});
                }
            })
        }
       
   });
    

})

router.post("/username-check",(req,res) => {
    var username = req.body.username;

    if(username.trim() != "" && username != undefined){
        User.find({'username' : username},(err,data) => {
            if(!err){
                if(data){
                    if(data.length){
                        return res.json({username : "invalid"});
                    }
                    else{
                        return res.json({username : "valid"});
                    }
                }
                else{
                    return res.status(400).json({error : "Invalid request"});
                }
            }
            else{
                return res.status(500).json({error : "Failed to process request try again"});
            }
        })
    }
    else{
        return res.status(400).json({error : "Invalid request"});
    }
})

router.post("/email-check",(req,res) => {
    
    var email = req.body.email;
    console.log(email);


    if(email.trim() != "" && email != undefined){
        User.find({'email' : email},(err,data) => {
            if(!err){
                if(data){
                    if(data.length){
                        console.log("invalid")
                        return res.json({email : "invalid"});
                    }
                    else{
                        console.log("valid");
                        return res.json({email : "valid"});
                    }
                }
                else{
                    return res.status(400).json({error : "Invalid request"});
                }
            }
            else{
                return res.status(500).json({error : "Failed to process request try again"});
            }
        })
    }
    else{
        return res.status(400).json({error : "Invalid request"});
    }
})

router.post("/register",(req,res) => {
        
        var name = req.body.name;
        var email = req.body.email;
        var username = req.body.username;
        var password = req.body.password;
        var password2 = req.body.password2;
        
        
        const errors = validator.validateRegisterInput(name,email,username,password,password2);

        const count = Object.keys(errors).length;

        if(count == 0){
            User.findOne({'email' : email},(err,user) => {
                if(!err){
                    if(user){
                        res.status(409).json({"email" : "email already exists"});
                    }
                    else{
                        User.findOne({'username' : username},(err,user) => {
                            if(!err){
                                if(user){
                                    res.status(409).json({"username" : "username already exists"});
                                }
                                else{
                                    bcrypt.hash(password.trim(),10,function(err,hash){
                                        if(!err){
                                            var url = "https://chat-application1.s3.ap-south-1.amazonaws.com/placeholderprofileimage.png";
                                            var user = new User({
                                                name : name.trim(),
                                                email : email.trim(),
                                                username : username.trim(),
                                                password : hash,
                                                profileUrl : url.trim(),
                                             });

                                            user.save().then(user1 => {
                                                res.json({id : user1._id,name : user1.name,email : user1.email,username : user1.username,profileUrl : user1.profileUrl});
                                            })
                                            .catch(err => {
                                                res.status(500).json({"error" : "Failed to register user try again"});
                                            });

                                       }
                                    });
                                }
                            }
                            else{
                                res.status(500).json({"error" : "Failed to register user try again"});
                            }
                        });
                    }
                }
                else{
                    res.status(500).json({"error" : "Failed to register user try again"});
                }
            });
        }
        else{
            return res.status(400).json(errors);
        }

        

    })
    
    
    




router.post("verify-token",(req,res) => {
    var token = req.body.token;

    if(token){
        jwt.verify(token,config.secret,(err,decoded) => {
            if (err) {
                return res.status(500).json({auth : false,error : 'Failed to authenticate user'});
            }
            else{
                return res.status(200).json({token : "Valid"});
            }
        });
    }
    else{
        return res.status(400).json({token : "No credentials sent"});
    }


    

});



router.post("/login",(req,res) => {
    
    var email = req.body.email;
    var password = req.body.password;
    var username = req.body.username;

    if(email){
        const errors = validator.validateLoginInput(email,password);
        const count = Object.keys(errors).length;
        
        

        if(count == 0){
            User.findOne({'email' : email},(err,user1) => {
                if(!err){
                    if(!user1){
                        return res.status(404).json({"error" : "User does not exists"});
                    }
                    else{
                        bcrypt.compare(password,user1.password,function(err,isValid){
                            if(!err){
                                if(isValid){
                                    var user = {
                                        id : user1.id,
                                        name : user1.name,
                                        username : user1.username,
                                        email : user1.email,
                                        profileUrl : user1.profileUrl
                                    }
                                    
                                    var token = jwt.sign({"user" : user}, config.secret, {
                                        expiresIn : config.tokenExpiry
                                    });
                                    token = "Bearer " + token;
                                    

                                    res.status(200).send({ auth : true, token : token});
                                }
                                else{
                                    res.status(401).json({"error" : "Incorrect credentials"});
                                }
                            }
                            else{
                                res.status(500).json({"error" : "Failed to login user try again"});
                            }
                        });
                    }
                }
                else{
                    res.status(500).json({"error" : "Failed to login user try again"});
                }
            });
        }
        else{
            return res.status(400).json(errors);
        }

    }
    else if(username){
        if(username != null && username != ""){
            if(username.trim().length < 6 || username.trim().length > 20){
                return res.status(400).json({error : "Username must be between 6 to 20 characters"});
            }
            else if(username.trim().includes(" ")){
                return res.status(400).json({errror : "Invalid username"});
            }
            User.findOne({'username' : username},(err,user1) => {
                if(!err){
                    if(!user1){
                        return res.status(404).json({"error" : "User does not exists"});
                    }
                    else{
                        
                        bcrypt.compare(password,user1.password,function(err,isValid){
                            if(!err){
                                if(isValid){
                                    var user = {
                                        id : user1.id,
                                        name : user1.name,
                                        username : user1.username,
                                        email : user1.email,
                                        profileUrl : user1.profileUrl,
                                    }

                                    var token = jwt.sign({"user" : user}, config.secret, { expiresIn : config.tokenExpiry });
                                    token = "Bearer " + token;
                                    
                                    res.status(200).send({ auth : true, token : token});
                                }
                                else{
                                    res.status(401).json({"error" : "Incorrect credentials"});
                                }
                            }
                            else{
                                res.status(500).json({"error" : "Failed to login user try again"});
                            }
                        });
                    }
                }
                else{
                    res.status(500).json({"error" : "Failed to login user try again"});
                }
            });
        }
        else{
            return res.status(400).json({error : "Invalid username"});
        }
    }
    else{
        const errors = validator.validateLoginInput(email,password);
        res.status(400).json(errors);
    }

    
});

router.post("/users",Authentication.isAuthenticated,(req,res) => {
    const username = req.body.username;

    if(username != null){
        User.find({"username" : { $regex : username + ".*"}},(err, data) => {
            if(!err){
                var responseData = [];
                
                User.findById(req.user.id,(err,user) => {
                    if(!err){
                        if(user){
                            const freinds = user.freinds;
                            data.forEach(userData => {
                                if(userData.id != req.user.id){
                                    
                                    var user = {
                                        id : userData.id,
                                        username : userData.username,
                                        email : userData.email,
                                        profileUrl : userData.profileUrl,
                                        requestSent : false
                                    }
                                    Request.find({'from.id' : req.user.id,'to.id' : user.id},(err,requests) => {
                                        if(!err){
                                            if(requests){
                                                if(!requests.length){
                                                    
                                                }else{
                                                    user.requestSent = true;
                                                }
                                                var found = freinds.find((freind) => {
                                                    return freind.user_id == user.id;
                                                })
                                                if(!found){
                                                    responseData.push(user);
                                                }
                                                if(userData == data[data.length - 1]){
                                                    res.json({responseData});
                                                }
                                            }
                                            else{
                                                return res.status(500).json({errror : "Failed to perform request"});
                                            }
                                        }
                                        else{
                                            return res.status(500).json({error : "Failed to perform request"});
                                        }
                                    });
                                    

                                    
                                }
                                
                            });
                        }
                        else{
                            return res.status(400).json({error : "Invalid request"});
                        }
                    }
                    else{
                        return res.status(500).json({error : "Failed to perform request"});
                    }
                })
                
            }
            else{
                return res.status(500).json({error : "Cant retrieve required data"});
            }
        })
    }
    else{
        return res.status(400).json({error : "Invalid data"});
    }
});

router.post("/request",Authentication.isAuthenticated,(req,res) => {
    
    const id = req.body.id;
    const username = req.body.username;
    const profileUrl = req.body.profileUrl;

    const errors = validator.validateRequestInput(id,username,profileUrl);

    const count = Object.keys(errors).length;

    if(count == 0){
        const from = {
            id : req.user.id,
            username : req.user.username,
            profileUrl : req.user.profileUrl
        }
        const to = {
            id : id,
            username : username,
            profileUrl : profileUrl
        }
        var request = new Request({
            from,
            to,
        });
        User.findById(from.id,(err,user) => {
            if(!err){
                if(user){
                    const freinds = user.freinds;

                    freinds.forEach(freind => {
                        if(freind.id == to.id){
                            return res.status(400).json({error : "Invalid request"});
                        }
                    });


                }
                else{
                    return res.status(400).json({error : "Invalid request"});
                }
            }
            else{
                return res.status(500).json({error : "Failed to perform request"});
            }
        })
        request.save((err,request) => {
            if(!err){
                if(request){
                    return res.json({"msg" : "Request sent"});
                }
                else{
                    return res.status(400).json({error : "Failed to send request"});
                }
            }
            else{
                return res.status(500).json({error : "Failed to send request"});
            }
        });
    }
    else{
        return res.status(400).json(errors);
    }

});

router.post("/request-transaction",Authentication.isAuthenticated,(req,res) => {
    console.log(req.body);
    
    const id = req.body.id;
    const status = req.body.status;

    if(id != null && id != "" && status != null && status != "" && id && status){
        if(id.trim().length == 0){
            return res.status(400).json({error : "Invalid request"});
        }
        if(status.trim().length == 0){
            return res.status(400).json({error : "Invalid request"});
        }
        
        if(status == "accepted"){
            Request.findByIdAndDelete(id,(err,request) => {
                if(!err){
                    if(request){
                        var fromId = request.from.id;
                        var toId = request.to.id;
    
                        var fromUser = {};
                        var toUser = {};
    
                        User.findById(fromId,(err,user) => {
                            if(!err){
                                if(user){
                                    fromUser = user;
                                    User.findById(toId,(err,user) => {
                                        if(!err){
                                            if(user){
                                                toUser = user;
                                                var toUserData = {
                                                    user_id : toUser.id,
                                                    username : toUser.username,
                                                    profileUrl : toUser.profileUrl,
                                                    name : toUser.name
                                                }
                                                var fromUserData = {
                                                    user_id : fromUser.id,
                                                    username : fromUser.username,
                                                    profileUrl : fromUser.profileUrl,
                                                    name : fromUser.name
                                                }
                                               
                                                User.findById(fromId,(err,user) => {
                                                    if(!err){
                                                        if(user){
                                                            user.freinds.push(toUserData);
                                                            user.save((err,user) => {
                                                                if(!err){
                                                                    if(user){
                                                                        User.findById(toId,(err,user) => {
                                                                            user.freinds.push(fromUserData);
                                                                            user.save((err,user) => {
                                                                                if(!err){
                                                                                    if(user){
                                                                                        return res.json({msg : "Success"});
                                                                                    }
                                                                                    else{
                                                                                        return res.status(400).json({error : "User not found"});
                                                                                    }
                                                                                }
                                                                                else{
                                                                                    
                                                                                    return res.status(500).json({error : "Failed to perform request"});
                                                                                }
                                                                            })
                                                                        })
                                                                    }
                                                                    else{
                                                                        return res.status(400).json({error : "User not found"});
                                                                    }
                                                                }
                                                                else{
                                                                    
                                                                    return res.status(500).json({error : "Failed to perform request"});
                                                                }
                                                            })
                                                        }
                                                        else{
                                                            return res.status(400).json({error : "User not found"});
                                                        }
                                                    }
                                                    else{
                                                        
                                                        return res.status(500).json({error : "Failed to perform request"});
                                                    }
                                                });
                                            }
                                            else{
                                                return res.status(400).json({error : "Invalid request"});
                                            }
                                        }
                                        else{
                                            return res.status(500).json({error : "Failed to perform request try again"});
                                        }
                                    })
                                }
                                else{
                                    return res.status(400).json({error : "Invalid request"});
                                }
                            }
                            else{
                                return res.status(500).json({error : "Failed to perform request try again"});
                            }
                        });
                    }
                    else{
    
                    }
                }
                else{
                    return res.status(500).json({error : "Failed to delete request try again"});
                }
            });
        }
        else{
            Request.findByIdAndDelete(id,(err,request) => {
                if(!err){
                    if(request){
                        return res.json({msg : "Success"});
                    }
                    else{
                        return res.status(500).json({error : "Failed to delete request try agian"});
                    }
                }
                else{
                    return res.status(500).json({error : "Failed to delete request try again"});
                }
            })
        }

        
        
    }



});

// My Requests
router.get("/request-self",Authentication.isAuthenticated,(req,res) => {
    Request.find({'to.id' : req.user.id},(err,requests) => {
        if(!err){
            if(requests){
                return res.json({requests});
            }
            else{
                return res.status(500).json({error : "Failed to retrieve data"});
            }
        }
        else{
            return res.status(500).json({error : "Failed to retrieve data"});
        }
    });
});
// Requests I sent
router.get("/request-to",Authentication.isAuthenticated,(req,res) => {
    Request.find({'from.id' : req.user.id},(err,requests) => {
        if(!err){
            if(requests){
                return res.json({requests});
            }
            else{
                return res.status(500).json({error : "Failed to retrieve data"});
            }
        }
        else{
            return res.status(500).json({error : "Failed to retrieve data"});
        }
    });
});


router.get("/details",Authentication.isAuthenticated,(req,res) => {
    const id = req.user.id;

    if(id != null && id != ""){
        User.findById(id,(err, userData) => {
            if(!err){
                if(userData){
                    var user = {
                        _id : userData.id,
                        name : userData.name,
                        username : userData.username,
                        email : userData.email,
                        profileUrl : userData.profileUrl,
                        createdAt : userData.createdAt,
                        freinds : userData.freinds
                    }
                    return res.json(user);
                }
                else{
                    return res.status(404).json({"error" : "User does not exists"});
                }
            }
            else{
                return res.status(500).json({error : "Can't retrieve user data"});
            }
        })
    }
    else{
        return res.status(400).json({error : "Invalid User"});
    }

    
})


router.post("/conversation", Authentication.isAuthenticated, (req,res) => {
 
    const users = req.body.users;
    
    if(users && users.length > 1){

        const usersToAdd = [];
        users.forEach(user => {
            usersToAdd.push({
                user_id : user.user_id,
                username : user.username,
                name : user.name,
                profileUrl : user.profileUrl
            });
        })
        
        

        var conversation = new Conversation({
            Users : usersToAdd
        });
        
        Conversation.find({'Users' : { $elemMatch : {$in : {usersToAdd}}}},(err,data) => {
            if(!err){
                if(data){
                    console.log("Data " + data);
                    if(data.length){
                        console.log("Data1 " + data);
                        data.forEach(conversation => {
                            
                            console.log("Hi1");
                            const Users = conversation.Users;

                            var count = 0;
                              
                            Users.forEach(user => {
                                var newUser = {
                                    user_id : user.user_id,
                                    username : user.username,
                                    name : user.name,
                                    profileUrl : user.profileUrl
                                }
                                console.log("Users to add ", usersToAdd);
                                console.log("Index " + usersToAdd.indexOf(newUser));
                                console.log("Incremented");
                                console.log("User",newUser)
                                if(usersToAdd.indexOf(newUser) > -1) {
                                    console.log("Incremented");
                                    
                                    count++;
                                }
                            })
                            console.log("Count " + count);
                            if(count == 2){
                                console.log("Conversation Exists:");
                                return res.json(conversation);
                            }
                            else if(count == 1){
                                console.log("Conversation Does not exist creating a new one...:");
                                conversation.save((err,conversation) => {
                                    if(!err){
                                        if(conversation){
                                            //@TODO add the conversation to the rabbit message queue
        
                                            
                                            amqp.connect('amqp://localhost', function(error0, connection) {
                                                if (error0) {
                                                    throw error0;
                                                }
                                                connection.createChannel(function(error1, channel) {
                                                    if (error1) {
                                                        throw error1;
                                                    }
        
                                                    var queue = "";
                                                    usersToAdd.forEach(user => {
                                                        if(user.user_id != req.user.id){
                                                            queue += user.user_id
                                                        }
                                                    });
        
                                                    queue += "conversations";
        
                                                    
                                                    var msg = JSON.stringify(conversation);
        
                                                    channel.assertQueue(queue, {
                                                        durable: false
                                                    })
                                                    
                                                    channel.sendToQueue(queue, Buffer.from(msg));
        
                                                    
                                                });
                                                setTimeout(function() {
                                                    connection.close();
                                                    
                                                }, 500);
        
                                            });
                                            return res.json(conversation);
                                        }
                                        else{
                                            return res.status(400).json({error : "Invalid request"});
                                        }
                                    }
                                    else{
                                        return res.status(500).json({error : "Failed to process request try again1"});
                                    }
                                });
                            }
                        })
                    }
                    else{
                        console.log("No conversation for user " + conversation);
                        conversation.save((err,conversation) => {
                            if(!err){
                                if(conversation){
                                    //@TODO add the conversation to the rabbit message queue

                                    
                                    amqp.connect('amqp://localhost', function(error0, connection) {
                                        if (error0) {
                                            throw error0;
                                        }
                                        connection.createChannel(function(error1, channel) {
                                            if (error1) {
                                                throw error1;
                                            }

                                            var queue = "";
                                            usersToAdd.forEach(user => {
                                                if(user.user_id != req.user.id){
                                                    queue += user.user_id
                                                }
                                            });

                                            queue += "conversations";

                                            
                                            var msg = JSON.stringify(conversation);

                                            channel.assertQueue(queue, {
                                                durable: false
                                            })
                                            
                                            channel.sendToQueue(queue, Buffer.from(msg));

                                            
                                        });
                                        setTimeout(function() {
                                            connection.close();
                                            
                                        }, 500);

                                    });
                                    return res.json(conversation);
                                }
                                else{
                                    return res.status(400).json({error : "Invalid request"});
                                }
                            }
                            else{
                                return res.status(500).json({error : "Failed to process request try again1"});
                            }
                        });
                        
                    }
                }
                else{
                    return res.status(500).json({error : "Failed to process request try again2"});
                }
            }
            else{
                return res.status(500).json({error : "Failed to process request try again3"});
            }
        })

    }
    else{
        return res.status(400).json({error : "Invalid request"});
    }
    
});


router.post("/message", Authentication.isAuthenticated, (req, res) => {
    var message = req.body.message;
    
    if(message){
        const newMessage = new Message({
            conversationID : message.conversationID,
            fromId : message.fromId,
            toId : message.toId,
            content : message.content,
            createdAt : message.timeStamp
        });

        newMessage.save((err, message) => {
            if(!err){
                if(message){
                    // @TODO add message to the queue
                    amqp.connect('amqp://localhost', function(error0, connection) {
                        if (error0) {
                            throw error0;
                        }
                        connection.createChannel(function(error1, channel) {
                            if (error1) {
                                throw error1;
                            }

                            var queue = message.toId + "messages";
                            var msg = JSON.stringify(message);

                            channel.assertQueue(queue, {
                                durable: false
                            });
                            channel.sendToQueue(queue, Buffer.from(msg));

                            console.log(" [x] Sent %s", msg);
                            setTimeout(function() {
                                connection.close();
                                
                            }, 500);
                        });
                        
                    });
                    return res.json(message);
                }
                else{
                    return res.status(400).json({error : "Invalid request"});
                }
            }
            else{
                return res.status(500).json({error : "Failed to process request try agian"});
            }
        })
    }
    else{
        return res.status(400).json({error : "Invalid request"});
    }

})



module.exports = router;