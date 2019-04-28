const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const bcrypt = require('bcryptjs');

const validator = require('../validators/user');

const User = require("../models/User");

router.post("/register",(req,res) => {

    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var password2 = req.body.password2;
    

    const errors = validator.validateRegisterInput(name,email,password,password2);

    const count = Object.keys(errors).length;

    if(count == 0){
        User.findOne({'email' : email},(err,user) => {
            if(!err){
                if(user){
                    res.json({"error" : "User already exists"});
                }
                else{
                    bcrypt.hash(password,10,function(err,hash){
                        if(!err){
                            
                            var user = new User({
                                name : name.trim(),email : email.trim(),password : hash
                            });
                            user.save().then(user1 => {
                                res.json({id : user1._id,name : user1.name,email : user1.email});
                            })
                            .catch(err => {
                                res.json({"error" : "Failed to register user try again"});
                            })
                        }
                    });
                    
                }
            }
            else{
                res.json({"error" : "Failed to register user try again"});
            }
        })
    }
    else{
        return res.json(errors);
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
                    return res.json({"error" : "user does not exists"});
                }
                else{
                    bcrypt.compare(password,user.password,function(isValid){
                        if(isValid){
                            res.json({"success": "login succesful"});
                        }
                        else{
                            res.json({"error" : "Incorrect credentials"});
                        }
                    });
                }
            }
            else{
                res.json({"error" : "Failed to login user try again"});
            }
        });
    }
    else{
        return res.json(errors);
    }


});

module.exports = router;