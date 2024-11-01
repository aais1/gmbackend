function authMiddleware(req,res){
    const jwt_secret="asaf2&8jfbasdyufg3237t238rg37"
    const token = req.headers.Authorization.split(" ")[1];
    if(!token){
        return res.json({error:"Token not found"});
    }
    try{
        const decoded = jwt.verify(token,jwt_secret);
        console.log(decoded);
        console.log('you are ggood to go :)')
        next();
    }catch(err){
        res.json({error:err.message});
    }
}

module.exports = authMiddleware;