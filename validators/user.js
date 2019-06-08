validator = {};



validator.validateRegisterInput = (name,email,username,password,password2) => {
    const errors = {};
    const emailVerifier = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
    if(name != "" && name != null){
        if(name.trim().length == 0){
            errors.name = "You must enter your name to continue";
        }
        if(name.trim().length > 40 || name.trim().length < 1){
            errors.name = "Name must be between 1-40 characters long";
        }
    }
    else{
        errors.name = "You must enter your name to continue";
    }
    if(email != "" && email != null){
        if(!emailVerifier.test(email)){
            errors.email = "Entered email is not valid";
        }
    }
    else{
        errors.email = "You must enter your email to continue";
    }
    if(password != "" && password != null){
        if(password.trim().length < 6 || password.trim.length > 30){
            errors.password = "Password must be between 6-30 characters long";
        }
    }
    else{
        errors.password = "You must enter your password to continue";
    }  
    if(username != "" && username != null){
        if(username.trim().length == 0){
            errors.username = "You must enter your username to continue";
        }
        if(username.trim().length < 6 || username.trim().length > 20){
            errors.username = "Username must be between 6-20 characters long";
        }
        
        if(username.trim().includes(" ")){
            errors.username = "There cant be a space in username";
        }
    }
    else{
        errors.username = "You must enter your username to continue";
    }   
    if(password2 != "" && password2 != null){
        if(password2.trim().length < 6){
            errors.password2 = "Password must be between 6-30 characters long";
        }
    }
    else{
        errors.password2 = "You must enter your password to continue";
    }
    if(!errors.password && !errors.password2){
        if(password != password2) errors.password = "Passwords do not match";
    }
    
    return errors;
    
}

validator.validateLoginInput = (email,password) => {
    const errors = {};
    const emailVerifier = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email != "" && email != null){
        if(!emailVerifier.test(email)){
            errors.email = "Entered email is not valid";
        }
        if(email.trim().length == 0){
            errors.email = "You must enter your email to continue";
        }
    }
    else{
        
        errors.email = "You must enter your email to continue";
    }

    if(password != "" && password != null){
        if(password.trim().length < 6){
            errors.password = "Password must be between 6-30 characters long";
        }
    }
    else{
        errors.password = "You must enter your password to continue";
    }  

    return errors;

}


validator.validateRequestInput = (id,username,profileUrl) => {
    const errors = {};
    const linkPattern = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;

    if(id != "" && id != null){
        if(id.trim().length == 0){
            errors.id = "No id specified";
        }
    }
    else{
        
        errors.id = "No id specified";
    }
    if(username != "" && username != null){
        if(username.trim().length == 0){
            errors.username = "You must enter your username to continue";
        }
        if(username.trim().length < 6 || username.trim().length > 20){
            errors.username = "Username must be between 6-20 characters long";
        }
        
        if(username.trim().includes(" ")){
            errors.username = "There cant be a space in username";
        }
    }
    if(profileUrl != null && profileUrl != ""){
        if(profileUrl.trim().length == 0){
            errors.profileUrl = "No profile url specified";
        }
        if(!linkPattern.test(profileUrl)){
            errors.profileUrl = "Invalid profile url";
        }
        
    }
    else{
        errors.profileUrl = "No profile url specified";
    }

    return errors;

}


module.exports = validator;