const jwt = require('jsonwebtoken');
const config = require('../config/keys');

const Authentication = {}

Authentication.isAuthenticated = (req,res,next) => {
    if(!req.headers.authorization){
        return res.status(401).json({error : "No authorization credentials sent"});
    }
    else{
        var token = req.headers['authorization'];
        var actualToken = token.split(" ");
        jwt.verify(actualToken[1],config.secret,function(err,decoded){
            if(err) return res.status(500).json({auth : false,error : 'Failed to authenticate user'});
            else{
                req.user = decoded.user;
                
                return next();
            }
        })
    }
}

module.exports = Authentication;