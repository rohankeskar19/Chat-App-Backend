const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const config = require('../config/keys');


const validator = require('../validators/user');
const Authentication = require('../middlewares/Authentication');

const User = require("../models/User");
const Request = require("../models/Request");

const aws  = require('aws-sdk');


aws.config.update({
    secretAccessKey : config.secretAccesKey,
    accessKeyId : config.accesKeyId,
});

const upload = require('../aws/Upload');

const singleUpload = upload.single('profile');



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
                                        var  url = "";
                                     
                                        url = gravatar.url(email.trim(),{s : '200',r : 'pg', d : 'mm'});
                                        
                                        var user = new User({
                                            name : name.trim(),
                                            email : email.trim(),
                                            username : username.trim(),
                                            password : hash,
                                            profileUrl : url,
                                            online : false
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
        })
    }
    else{
        return res.status(400).json(errors);
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

    
});

router.get("/users",Authentication.isAuthenticated,(req,res) => {
    const username = req.body.username;
    if(username != null){
        User.find({"username" : { $regex : username + ".*"}},(err, data) => {
            if(!err){
                var responseData = [];
                data.forEach(userData => {
                    var user = {
                        id : userData.id,
                        username : userData.username,
                        email : userData.email,
                        profileUrl : userData.profileUrl
                    }
                    responseData.push(user);
                });
                res.json(responseData);
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

router.delete("/request",Authentication.isAuthenticated,(req,res) => {
    const id = req.body.id;

    if(id != null && id != ""){
        if(id.trim().length == 0){
            return res.status(400).json({error : "Invalid request"});
        }
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
                                            console.log(toUserData);
                                            console.log(fromUserData);
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
                                                                                console.log(err + "1");
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
                                                                console.log(err + "2");
                                                                return res.status(500).json({error : "Failed to perform request"});
                                                            }
                                                        })
                                                    }
                                                    else{
                                                        return res.status(400).json({error : "User not found"});
                                                    }
                                                }
                                                else{
                                                    console.log(err + "3");
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



});

// My Requests
router.get("/request-self",Authentication.isAuthenticated,(req,res) => {
    Request.find({'to.id' : req.user.id},(err,requests) => {
        if(!err){
            if(requests){
                return res.json(requests);
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
                return res.json(requests);
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
    const id = req.body.id;

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


router.get("/conversation-users",(req,res) => {
    const ids = req.body;
    
    if(ids != null && ids != "" && Array.isArray(ids)){
        const users = [];
        var i = 0;
        ids.forEach(id => {
            User.findById(id,(err,data) => {
                if(!err){
                    if(data){
                        i++;
                        var user  = {
                            id : data._id,
                            username : data.username,
                            nam : data.name,
                            profileUrl : data.profileUrl,
                            bio : data.bio,

                        }
                        users.push(user);
                        if(i == ids.length){
                            return res.json(users);
                        }
                    }
                    else{
                        return res.status(500).json({error : "Failed to retrieve data"})
                    }
                }
                else{
                    return res.status(500).json({error : "Failed to retrieve data"});
                }
            })
        });
        
    }
    else{
        return res.status(400).json({error : "Invalid request"});
    }

})

// router.post("/update-profile",Authentication.isAuthenticated,(req,res) => {
//     const username = req.body.username;
//     const email = req.body.email;
//     const name = req.body.name;
//     const bio = req.body.bio;
//     const 
// })
module.exports = router;