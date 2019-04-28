const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const config = require('../config/keys');


const validator = require('../validators/user');
const Authentication = require('../middlewares/Authentication');

const User = require("../models/User");



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
                                        var user = new User({
                                            name : name.trim(),
                                            email : email.trim(),
                                            username : username.trim(),
                                            password : hash
                                        });
                                        user.save().then(user1 => {
                                            res.json({id : user1._id,name : user1.name,email : user1.email,username : user1.username});
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
    
    const errors = validator.validateLoginInput(email,password);
    const count = Object.keys(errors).length;


    if(count == 0){
        User.findOne({'email' : email},(err,user) => {
            if(!err){
                if(!user){
                    return res.status(404).json({"error" : "User does not exists"});
                }
                else{
                    console.log(user.password);
                    bcrypt.compare(password,user.password,function(err,isValid){
                        if(!err){
                            if(isValid){
                                var token = jwt.sign({ id : user._id}, config.secret, {
                                    expiresIn : 60 * 60 * 60
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
});


router.get("/dashboard",Authentication.isAuthenticated,(req,res) => {
    
    
});





module.exports = router;