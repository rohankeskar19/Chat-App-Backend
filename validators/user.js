validator = {};

const errors = {};

validator.validateRegisterInput = (name,email,password,password2) => {
    const emailVerifier = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(name != "" && name != null){
        if(name.trim().length == 0){
            errors.name = "You must enter your name to continue";
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
        if(password.trim().length < 6){
            errors.password = "Password must be between 6-30 characters long";
        }
    }
    else{
        errors.password = "You must enter your password to continue";
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


module.exports = validator;