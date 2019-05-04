const io = require('socket.io')();
const jwt = require('jsonwebtoken');
const config = require('../config/keys');

const mongoose = require("mongoose");

mongoose.connect(config.mongoDB,{useNewUrlParser : true},(err)=>{
    if(!err){
        console.log("Mongo db connected");
    }
});


const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const clients = {};

io.use(function(socket, next){
    if(socket.handshake.query && socket.handshake.query.token){
        const token = socket.handshake.query.token.split(" ");
        const actualToken = token[1];

        jwt.verify(actualToken,config.secret,function(err,decoded){
            if(err) return next(new Error("Authentication error"));
            socket.user = decoded.user;
            next();
        });
    }
    else{
        next(new Error("Authentication error"));
    }
})
.on('connection',function(socket){
    
    clients[socket.user.id] = socket;
    var USER = {};

    User.findById(socket.user.id,(err,user) => {
        if(!err){
            if(user){
                
                USER = user;
                var freinds = USER.freinds;
                     
                for(var  i = 0; i < freinds.length; i++){
                    
                    if(clients[freinds[i].user_id]){
                        
                        clients[freinds[i].user_id].emit("online",{id : socket.user.id, username : socket.user.username});
                    }
                }
            }   
        }
    });

    // Create Conversation event
    // Checks if a conversation exists and if it doesn't it creates a conversation
    socket.on("createConversation",(data) => {
        
        const users = data.users;
        const userId = [];
        users.forEach(user => {
            userId.push({user_id : user});
        })
        
        var conversation = new Conversation({
            Users : userId
        });
        
        Conversation.find({'Users.user_id' : { $all : users}},(err,data) => {
            if(!err){
                if(data){
                    if(data.length){
                        
                        socket.emit("Error : Conversation already exists");
                    }
                    else{
                        conversation.save((err,conversation) => {
                            if(!err){

                                if(conversation){
                                    // console.log(conversation);
                                    socket.emit("Success : Conversation created");
                                }
                                else{
                                    socket.emit("Error : Failed to create conversation");
                                }
                            }
                            else{
                                socket.emit("Error : Failed to create conversation");
                            }
                        });
                    }
                }
                else{
                    socket.emit("Error : Can't create conversation");
                }
            }
            else{
                socket.emit("Error : Can't create conversation");
            }
        })

    });

    socket.on("createMessage",(data) => {
        
        var message = new Message({
            conversationID : data.conversationID,
            fromId : data.fromId,
            toId : data.toId,
            content : data.content
        });
        
        clients[data.toId].emit("newMessage",data);
        
        message.save((err,message) => {
            if(!err){
                if(message){

                }
                else{
                    socket.emit("Error : Failed to create message");
                }
            }
            else{
                socket.emit("Error : Can't create message");
            }
        })
    });


    socket.on("typing",(data) => {
        console.log("typing " + data.toId);
        
        if(clients[data.toId]){
            clients[data.toId].emit("typing",socket.user);
        }
        
    });

    

    socket.on("disconnect",function(){
    
        var freinds = USER.freinds;
            //console.log(freinds);            
            for(var  i = 0; i < freinds.length; i++){
                
                if(clients[freinds[i].user_id]){
                    
                    clients[freinds[i].user_id].emit("offline",{id : socket.user.id, username : socket.user.username});
                }
            }
            delete clients[USER.id];
            
    });
})

const socketIOPORT = 4000 | process.env.SOCKET_PORT;

io.listen(socketIOPORT,() => {
    console.log(`Socket started on port ${socketIOPORT}`);
})