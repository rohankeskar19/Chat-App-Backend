const io = require('socket.io')();
const config = require('../config/keys');
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
const socketioJwt = require('socketio-jwt');
const amqp = require('amqplib');


mongoose.connect(config.mongoDB,{useNewUrlParser : true},(err)=>{
    if(!err){
        console.log("Mongo db connected");
    }
});


const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const clients = {};

io.use(function(socket,next){
    
    if(socket.request.headers && socket.request.headers.authorization){
        var token = socket.request.headers.authorization;
        var actualToken = token.split(" ");
        
        jwt.verify(actualToken[1],config.secret,function(err,decoded){
            if(err) return next(new Error("Authentication error"));
            socket.user = decoded.user;
            next();
        })


    }
    else{
        next(new Error("Authentication error"));
    }
}).on('connection',function(socket){
 
    clients[socket.user.id] = socket;

    const conversationQueue = socket.user.id + "conversations";

    const messageQueue = socket.user.id + "messages";

    const open = amqp.connect('amqp://localhost');

    var queueConnection;

    open.then(function(conn){
        queueConnection = conn;
        return conn.createChannel();
    }).then(function(channel){
        channel.assertQueue(conversationQueue,{
            durable : false
        })

        channel.consume(conversationQueue, function(msg){
            var conversation = JSON.parse(msg.content.toString());
            console.log(conversation);

            socket.emit("newConversation",conversation);
            console.log("event emmited conversation");
        },{
            noAck : true
        })


        channel.assertQueue(messageQueue,{
            durable : false
        })

        channel.consume(messageQueue, function(msg){
            var message = JSON.parse(msg.content.toString());
            console.log(message);
            
            socket.emit("newMessage",message);
            console.log("event emmited message",socket.user.username);
        },{
            noAck : true
        })
    })
    
    
  
    var USER = {};
    

    User.findById(socket.user.id,(err,user) => {
        if(!err){
            if(user){
                
                USER = user;
                var freinds = USER.freinds;
                var activeUsers = [];
                for(var  i = 0; i < freinds.length; i++){
                    
                    if(clients[freinds[i].user_id]){
                        activeUsers.push(freinds[i]);
                        clients[freinds[i].user_id].emit("online",{user : socket.user});
                    }
                }
                
                socket.emit("activeUsers",{activeUsers});
            }   
        }
    });

    
    socket.on("typing",(data) => {
        
        
        if(clients[data.toId]){
            clients[data.toId].emit("typing",{id : socket.user.id});
        }
        
    });

    socket.on("stop-typing",(data) => {
        
        
        if(clients[data.toId]){
            clients[data.toId].emit("stop-typing",{id : socket.user.id});
        }
        
    });

    socket.on("isOnline",(data) => {
       
        if(clients[data.id]){
            socket.emit("isOnline",{id : data.id});
        }
        else{
            socket.emit("isOffline",{id : data.id});
        }
    })



    socket.on("disconnect",function(){
        console.log("disconnected!");
        var freinds = USER.freinds;
            if(freinds.length){
                for(var  i = 0; i < freinds.length; i++){
                    if(clients[freinds[i].user_id]){
                        clients[freinds[i].user_id].emit("offline",{id : socket.user.id, username : socket.user.username});
                    }
                }
            }
            
            delete clients[socket.user.id];
            delete socket.query;

            console.log("Count: " + Object.keys(clients).length)
            queueConnection.close();
            
    });

});




const socketIOPORT = 4000 | process.env.SOCKET_PORT;

io.listen(socketIOPORT);