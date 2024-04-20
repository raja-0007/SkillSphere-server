const authenticationJWT = (req,res,next)=>{
    if(req.action == 'login'){
        console.log('login')
        next()
    }
    else{
        next()
    }
}
module.exports = authenticationJWT