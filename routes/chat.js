const express = require('express');
const router = express.Router();

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const Authentication = require('../middlewares/Authentication');

router.get("/conversations",Authentication.isAuthenticated,(req,res) => {
   
        Conversation.find({'Users.user_id' : req.user.id},(err,data) => {
            if(!err){
                if(data){
                    return res.json(data);
                }
                else{
                    return res.status(400).json({error : "Failed to retrieve data"});
                }
            }
            else{
                return res.status(500).json({error : "Failed to perform request"});
            }
        });
     
});



router.get("/messages",Authentication.isAuthenticated,(req,res) => {
    const conversationIDs = req.body.ids;

    if(conversationIDs != null && conversationIDs != "" && Array.isArray(conversationIDs)){
        var messages = [];
        for(var i = 0; i < conversationIDs.length; i++){
            Message.find({"conversationID" : conversationIDs[i]},(err,data) => {
                if(!err){
                    if(data){
                        messages.push(data);
                    }
                    else{
                        return res.status(500).json({error : "Failed to retrieve data"});
                    }
                }
                else{
                    return res.status(500).json({error : "Failed to retrieve data"});
                }
            })
            if(i == conversationIDs.length){
                return res.json(messages);
            }
        }
    }
})

module.exports = router;